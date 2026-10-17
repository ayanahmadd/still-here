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
  assert.equal(memory.stage, 4);
  assert.equal(garden.finishMemory(first).stage, 5, 'one short expression can still bloom');
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
  global.localStorage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
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
    assert.ok(sent.instructions.includes('不编造')); assert.ok(!sent.input[0].content.includes('photo'));
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
