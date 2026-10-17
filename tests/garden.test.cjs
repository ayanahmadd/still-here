const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => dependencies[name] || require(name), module, module.exports);
  return module.exports;
}
const garden = load('lib/garden.ts');
const ai = load('lib/garden-ai.ts');
const api = load('app/api/garden/route.ts', { '../../../lib/garden': garden, '../../../lib/garden-ai': ai });

test('patient expression grows gradually, repeats and acknowledgments do not become a score', () => {
  const first = garden.addPatient(garden.newMemory(), '我和爸爸去过海边');
  assert.equal(first.stage, 1); assert.equal(first.kind, 'daisy');
  const repeat = garden.addPatient(first, '我和爸爸去过海边。');
  assert.equal(repeat.stage, 1); assert.equal(repeat.entries.length, 2);
  assert.ok(!garden.localReply(repeat).includes('?'));
  const second = garden.addPatient(repeat, '浪声很响');
  assert.equal(second.stage, 2);
  assert.equal(garden.addPatient(second, '嗯').stage, 2);
  let memory = second;
  for (const text of ['沙子很软', '口袋里有贝壳', '风吹着衣服', '那时候很开心']) memory = garden.addPatient(memory, text);
  assert.equal(memory.stage, 6);
  assert.equal(garden.finishMemory(first).stage, 1, 'saving never skips growth stages');
  assert.equal(garden.finishMemory(first).status, 'paused');
  assert.equal(garden.finishMemory(garden.newMemory()), null);
});

test('explicit discomfort stops without growth, repetition and unconfirmed family notes remain separate', () => {
  const first = garden.addPatient(garden.newMemory(), '妈妈煮的汤');
  for (const text of ['不想说了', '不知道', '记不清了', '累了', '我有点害怕']) {
    const paused = garden.addPatient(first, text);
    assert.equal(paused.status, 'paused'); assert.equal(paused.stage, first.stage); assert.deepEqual(paused.entries, first.entries);
  }
  assert.equal(garden.addFamily(first, '我印象里有一只白碗', '小林', false), first);
  const withFamily = garden.addFamily(first, '我印象里有一只白碗', '小林', true);
  assert.equal(withFamily.stage, first.stage); assert.equal(withFamily.familyBud, true);
  assert.equal(withFamily.entries.at(-1).speaker, 'family'); assert.equal(withFamily.entries.at(-1).consent, true);
  assert.equal(garden.addFamily(garden.newMemory(), '替他讲完', '小林', true).entries.length, 0);
  assert.equal(garden.addFamily({ ...first, status: 'paused' }, '补充', '小林', true).entries.length, 1);
});

test('local storage restores a paused draft and never overwrites malformed data on read', () => {
  let stored = null;
  const ids = {};
  global.localStorage = { getItem: key => key === garden.GARDEN_KEY ? stored : ids[key] || null, setItem: (key, value) => { if (key === garden.GARDEN_KEY) stored = value; else ids[key] = value; } };
  const memory = garden.addPatient(garden.newMemory(), '我和家人去海边');
  assert.equal(garden.writeGarden({ version: 1, flowers: [], current: memory }), true);
  const loaded = garden.readGarden();
  assert.equal(loaded.current.status, 'paused'); assert.equal(loaded.current.stage, 1);
  stored = '{broken';
  assert.throws(() => garden.readGarden()); assert.equal(stored, '{broken');
  global.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(garden.writeGarden({ version: 1, flowers: [], current: null }), false);
  delete global.localStorage;
});

test('API validates consent, identity of speakers, byte limits and local-only access', async () => {
  const entries = garden.addPatient(garden.newMemory(), '海边有很响的浪声').entries;
  const request = (body, origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/garden', { method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body) });
  assert.equal((await api.POST(request({ entries }))).status, 400);
  assert.equal((await api.POST(request({ entries, cloudConsent: true }, 'https://another.example'))).status, 403);
  assert.equal((await api.POST(request({ cloudConsent: true, entries: [{ ...entries[0], speaker: 'system' }] }))).status, 400);
  assert.equal((await api.POST(request({ cloudConsent: true, entries: [{ ...entries[0], speaker: 'family', name: '家人', consent: false }] }))).status, 400);
  assert.equal((await api.POST(request({ huge: 'x'.repeat(80001) }))).status, 413);
});

test('API uses structured replies without storing response state; invalid, harmful, and incomplete replies fail safely', async () => {
  const oldKey = process.env.OPENAI_API_KEY; const oldModel = process.env.OPENAI_MODEL; const oldFetch = global.fetch;
  const entries = garden.addPatient(garden.newMemory(), '我和爸爸去海边').entries;
  const request = (items = entries) => new Request('http://localhost:3000/api/garden', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: items, cloudConsent: true }) });
  try {
    delete process.env.OPENAI_API_KEY;
    assert.equal((await (await api.GET()).json()).available, false);
    assert.equal((await api.POST(request())).status, 503);
    process.env.OPENAI_API_KEY = 'test-only-not-a-real-key'; delete process.env.OPENAI_MODEL;
    let sent;
    let reply = { message: '你提到了爸爸。你愿意说说和他在一起的一件小事吗？', action: 'continue' };
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/responses'); sent = JSON.parse(options.body);
      return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(reply) }] }] });
    };
    assert.equal((await api.POST(request())).status, 200);
    assert.equal(sent.store, false); assert.equal(sent.text.format.type, 'json_schema'); assert.equal(sent.text.format.strict, true);
    assert.ok(sent.instructions.includes('Never invent')); assert.ok(sent.instructions.includes('Always respond in English')); assert.ok(!sent.input[0].content.includes('photo'));
    reply = { message: '你还记得吗？考考你？', action: 'continue' };
    assert.equal((await api.POST(request())).status, 502);
    reply = { message: '想休息吗？', action: 'pause' };
    const pauseReply = await (await api.POST(request())).json();
    assert.equal(pauseReply.action, 'pause'); assert.equal(pauseReply.message, garden.COMFORT); assert.ok(!pauseReply.message.includes('？'));
    global.fetch = async () => { throw new Error('Must not call provider for a stop signal'); };
    const stopped = await api.POST(request([{ ...entries[0], text: '不想说了' }]));
    assert.equal(stopped.status, 200); assert.equal((await stopped.json()).action, 'pause');
    assert.equal((await api.POST(request())).status, 502);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENAI_MODEL; else process.env.OPENAI_MODEL = oldModel;
  }
});

test('English topics begin empty and grow only from confirmed expressions', () => {
  assert.equal(garden.topics.length, 9);
  for (const topic of garden.topics) {
    const memory = garden.newMemory(topic.question);
    assert.equal(memory.stage, 0); assert.equal(memory.entries.length, 0);
    assert.equal(garden.localReply(memory), topic.question);
  }
  const first = garden.addPatient(garden.newMemory(), 'Mom made soup in the kitchen');
  assert.equal(first.kind, 'gardenia'); assert.equal(first.stage, 1);
  assert.equal(garden.addPatient(first, 'MOM made soup in the kitchen!').stage, 1);
  assert.equal(garden.addPatient(first, 'Yes').stage, 1);
  assert.equal(garden.chooseFlower('We sat in the warm sunshine'), 'calendula');
  for (const text of ['Please stop.', 'I don’t want to talk', 'I am tired', 'I feel confused', 'I can’t remember', 'I do not know', 'I need a break']) {
    assert.equal(garden.isStopSignal(text), true, text);
    assert.equal(garden.addPatient(first, text).stage, 1);
    assert.equal(garden.addPatient(first, text).status, 'paused');
  }
  for (const text of ['We waited at the bus stop.', 'I was not tired.', 'The beach was lovely']) assert.equal(garden.isStopSignal(text), false, text);
  assert.ok(!/[\u3400-\u9fff]/.test(garden.localReply(first)));
});
test('fresh gardens have no examples and migration preserves personal stories', () => {
  let stored = null;
  global.localStorage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  assert.deepEqual(garden.readGarden().flowers, []);
  const personal = garden.finishMemory(garden.addPatient(garden.newMemory(), 'A walk with Dad'));
  stored = JSON.stringify({ version:1, flowers:[personal, {...personal, id:'example-sea', example:true}], current:null });
  assert.deepEqual(garden.readGarden().flowers.map(f => f.id), [personal.id]);
  delete global.localStorage;
});

test('eight growth states advance once per detail, never through saving, family notes or pauses', () => {
  assert.deepEqual([...garden.GROWTH_STAGES], ['empty','seed','sprout','stem','leaf','bud','petal','bloom']);
  let memory = garden.newMemory();
  const details = ['A walk with Dad', 'The waves sounded loud', 'The sand felt soft', 'He held my hand', 'We walked by the water', 'I carried a shell', 'We sat near the path'];
  for (let index = 0; index < details.length; index++) {
    const previous = memory;
    memory = garden.addPatient(memory, details[index]);
    assert.equal(memory.stage, index + 1);
    assert.equal(memory.stage - previous.stage, 1);
    assert.equal(garden.finishMemory(memory).stage, memory.stage);
    const withFamily = garden.addFamily(memory, 'My impression is that we went together.', 'Alex', true);
    assert.equal(withFamily.stage, memory.stage);
    assert.equal(garden.addPatient(memory, details[index]).stage, memory.stage);
    assert.equal(garden.addPatient(memory, 'I need a rest').stage, memory.stage);
    assert.equal(garden.addPatient({...memory,status:'paused'}, 'A new detail').stage, memory.stage);
  }
  assert.equal(garden.finishMemory(memory).status,'bloomed');
  assert.ok(memory.sensoryDetails > 0);
  assert.equal(garden.addPatient(memory, 'We watched the water').stage,7);
});
test('legacy stages migrate without losing flowers or changing their visual maturity', () => {
  const original = garden.addPatient(garden.newMemory(), 'Our garden at home');
  const legacy = {...original,stage:5,status:'bloomed'}; delete legacy.growthVersion; delete legacy.sensoryDetails;
  let stored=JSON.stringify({version:1,flowers:[legacy],current:{...legacy,stage:1,status:'growing',id:'draft'}});
  global.localStorage={getItem:()=>stored};
  const loaded=garden.readGarden();
  assert.equal(loaded.flowers[0].stage,7); assert.equal(loaded.flowers[0].growthVersion,2);
  assert.equal(loaded.current.stage,2); assert.equal(loaded.current.status,'paused');
  stored=JSON.stringify(loaded);
  assert.deepEqual(garden.readGarden(),loaded,'migration is applied only once');
  delete global.localStorage;
});
test('contact numbers accept phone formats, reject URI injection, and stay separate from story data', () => {
  const contacts=load('lib/garden-contact.ts');
  assert.equal(contacts.normalisePhone('+1 (202) 555-0123'),'+12025550123');
  for(const phone of ['123','tel:5555555555','5555555555?body=hello','5555555555;ext=1','javascript:alert(1)']) assert.equal(contacts.normalisePhone(phone),null);
  const data={};
  global.localStorage={getItem:key=>data[key]||null,setItem:(key,value)=>{data[key]=value},removeItem:key=>{delete data[key]}};
  assert.equal(contacts.writeContact({name:'Alex',phone:'+1 (202) 555-0123'}),true);
  assert.deepEqual(contacts.readContact(),{name:'Alex',phone:'+12025550123'});
  assert.equal(data[garden.GARDEN_KEY],undefined);
  assert.equal(contacts.writeContact(null),true); assert.equal(contacts.readContact(),null);
  delete global.localStorage;
});

test('device garden UUID and named stages persist across reloads, preserving family provenance', () => {
  const data = {};
  global.localStorage={getItem:key=>data[key]||null,setItem:(key,value)=>{data[key]=value},removeItem:key=>{delete data[key]}};
  const fresh=garden.readGarden();
  assert.match(fresh.garden_id,/^[0-9a-f-]{36}$/);
  assert.equal(garden.readGarden().garden_id,fresh.garden_id);
  let memory=garden.addPatient(garden.newMemory(),'A walk with Dad');
  memory=garden.addFamily(memory,'My impression is that we walked near home.','Alex',true);
  assert.equal(garden.writeGarden({...fresh,flowers:[garden.finishMemory(memory)]}),true);
  const raw=JSON.parse(data[garden.GARDEN_KEY]);
  assert.equal(raw.garden_id,fresh.garden_id);
  assert.equal(raw.flowers[0].stage,'seed');
  assert.equal(raw.flowers[0].memory_title,'A walk with Dad');
  assert.deepEqual(raw.flowers[0].details,['A walk with Dad']);
  assert.equal(raw.flowers[0].entries.at(-1).speaker,'family');
  const loaded=garden.readGarden();
  assert.equal(loaded.flowers[0].stage,1);assert.equal(loaded.flowers[0].entries.at(-1).name,'Alex');
  assert.equal(loaded.garden_id,fresh.garden_id);
  data[garden.GARDEN_KEY]=JSON.stringify({...raw,flowers:[{...raw.flowers[0],stage:'unknown'}]});
  const malformed=data[garden.GARDEN_KEY];assert.throws(()=>garden.readGarden());assert.equal(data[garden.GARDEN_KEY],malformed);
  delete global.localStorage;
});
test('simple public flower documents import their actual stage and reset removes only app-owned data', () => {
  const id=crypto.randomUUID();
  const data={other_site:'keep',gardenName:'Mary',garden_id:id};
  data['memory-garden-game-demo-' + id] = 'demo progress';
  data[garden.GARDEN_KEY]=JSON.stringify({garden_id:id,flowers:[{id:'flower_1',memory_title:'A day at the beach',stage:'bud',created_at:123456789,details:['There was a breeze','Dad was there','I heard the gulls']}]});
  global.localStorage={get length(){return Object.keys(data).length},key:index=>Object.keys(data)[index]||null,getItem:key=>data[key]||null,setItem:(key,value)=>{data[key]=value},removeItem:key=>{delete data[key]}};
  const loaded=garden.readGarden();assert.equal(loaded.flowers[0].stage,5);assert.equal(loaded.flowers[0].entries.length,3);
  const fresh=garden.resetGarden();assert.notEqual(fresh.garden_id,id);assert.deepEqual(fresh.flowers,[]);assert.equal(data.other_site,'keep');assert.equal(data.gardenName,undefined);
  assert.equal(data['memory-garden-game-demo-' + id],undefined);
  delete global.localStorage;
});
test('garden names prefer URL, then local storage, then My Garden, with stable possessive labels', () => {
  const names=load('lib/garden-name.ts');const data={};
  global.localStorage={getItem:key=>data[key]||null,setItem:(key,value)=>{data[key]=value}};
  assert.equal(names.readGardenName(''),'My Garden');assert.equal(names.gardenLabel('My Garden'),'My Garden');
  assert.equal(names.writeGardenName('  Mary  '),'Mary');assert.equal(names.readGardenName(''),'Mary');assert.equal(names.gardenLabel('Mary'),"Mary's garden");
  assert.equal(names.readGardenName('?name=James'),'James');assert.equal(data.gardenName,'James');assert.equal(names.readGardenName(''),'James');
  assert.equal(names.cleanGardenName('A'.repeat(100)).length,40);
  delete global.localStorage;
});
