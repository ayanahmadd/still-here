export type FlowerKind = 'daisy' | 'gardenia' | 'calendula';
export type GardenEntry = {
  id: string;
  speaker: 'patient' | 'family' | 'companion';
  text: string;
  createdAt: string;
  name?: string;
  consent?: boolean;
  mode?: 'local' | 'ai';
};
export type GardenMemory = {
  id: string;
  title: string;
  kind: FlowerKind;
  stage: number;
  status: 'growing' | 'paused' | 'bloomed';
  entries: GardenEntry[];
  createdAt: string;
  example?: boolean;
  familyBud?: boolean;
};
export type GardenStore = { version: 1; flowers: GardenMemory[]; current: GardenMemory | null };

export const GARDEN_KEY = 'memory-garden-v1';
export const MAX_EXPRESSION = 1200;
export const flowerNames: Record<FlowerKind, string> = { daisy: '滨菊', gardenia: '栀子', calendula: '金盏花' };
export const OPENING = '你和家人去过什么地方？';
export const COMFORT = '没关系，我们可以改天再来看它。现在可以和身边的人一起休息一会儿。';

export const exampleFlowers: GardenMemory[] = [
  { id: 'example-sea', title: '海边和爸爸', kind: 'daisy', stage: 5, status: 'bloomed', example: true, createdAt: '2026-10-17T12:00:00Z', entries: [
    { id: 'sea-1', speaker: 'patient', text: '我和爸爸去过海边。浪很响，一下一下的。', createdAt: '2026-10-17T12:00:00Z' },
    { id: 'sea-2', speaker: 'family', name: '小林', consent: true, text: '我印象里，那天你带回了一只小贝壳。', createdAt: '2026-10-17T12:01:00Z' },
    { id: 'sea-3', speaker: 'patient', text: '我把贝壳放在口袋里，想带回家。', createdAt: '2026-10-17T12:02:00Z' },
  ] },
  { id: 'example-home', title: '妈妈煮的汤', kind: 'gardenia', stage: 5, status: 'bloomed', example: true, createdAt: '2026-10-16T12:00:00Z', entries: [
    { id: 'home-1', speaker: 'patient', text: '妈妈煮的汤很香。她会站在厨房门口，叫我过去吃饭。', createdAt: '2026-10-16T12:00:00Z' },
    { id: 'home-2', speaker: 'patient', text: '我喜欢捧着碗，手心暖暖的。', createdAt: '2026-10-16T12:01:00Z' },
  ] },
  { id: 'example-sun', title: '院子里的阳光', kind: 'calendula', stage: 5, status: 'bloomed', example: true, createdAt: '2026-10-15T12:00:00Z', entries: [
    { id: 'sun-1', speaker: 'patient', text: '午后，我们在院子里坐着。阳光照在身上，我觉得很暖和。', createdAt: '2026-10-15T12:00:00Z' },
    { id: 'sun-2', speaker: 'family', name: '小林', consent: true, text: '我记得我们把椅子搬到了桂花树旁边。', createdAt: '2026-10-15T12:01:00Z' },
  ] },
];

export function isStopSignal(text: string) {
  return /不想.{0,3}(说|聊|讲|继续)|不(说|聊|讲)了|先别问|别问了|停下来|停止|先停|休息|累了|难过|害怕|不舒服|想不起来|记不清|记不得|不知道|不愿意/.test(text);
}

export function normalise(text: string) { return text.replace(/[\s，。！？、,.!?；;：:“”「」]/g, ''); }

export function chooseFlower(text: string): FlowerKind {
  if (/海边|海滩|大海|海浪|沙滩|海风|山|林间|冬|雪/.test(text)) return 'daisy';
  if (/家|厨房|妈妈|汤|饭|奶奶|外婆/.test(text)) return 'gardenia';
  if (/阳光|温暖|暖和|开心|快乐|院子/.test(text)) return 'calendula';
  return 'daisy';
}

export function newMemory(): GardenMemory {
  return { id: crypto.randomUUID(), title: '一段慢慢说的时光', kind: 'daisy', stage: 0, status: 'growing', entries: [], createdAt: new Date().toISOString() };
}

export function addPatient(memory: GardenMemory, text: string): GardenMemory {
  const clean = text.trim();
  if (!clean || clean.length > MAX_EXPRESSION) return memory;
  if (isStopSignal(clean)) return { ...memory, status: 'paused' };
  const previous = memory.entries.filter(entry => entry.speaker === 'patient');
  const distinct = !previous.some(entry => normalise(entry.text) === normalise(clean));
  const meaningful = normalise(clean).length > 1 && !/^(嗯+|好+|是的?|可以|谢谢|对的?)$/.test(normalise(clean));
  const first = previous.length === 0;
  const stage = first ? 1 : distinct && meaningful ? Math.min(4, memory.stage + 1) : memory.stage;
  return {
    ...memory, status: 'growing', stage,
    kind: first ? chooseFlower(clean) : memory.kind,
    title: first ? clean.replace(/[。！？!?].*$/, '').slice(0, 24) : memory.title,
    entries: [...memory.entries, { id: crypto.randomUUID(), speaker: 'patient', text: clean, createdAt: new Date().toISOString() }],
  };
}

export function addFamily(memory: GardenMemory, text: string, name: string, consent: boolean): GardenMemory {
  if (!consent || !text.trim() || text.length > MAX_EXPRESSION || memory.status !== 'growing' || !memory.entries.some(entry => entry.speaker === 'patient')) return memory;
  return { ...memory, familyBud: true, entries: [...memory.entries, { id: crypto.randomUUID(), speaker: 'family', text: text.trim(), name: name.trim() || '家人', consent: true, createdAt: new Date().toISOString() }] };
}

export function finishMemory(memory: GardenMemory): GardenMemory | null {
  if (!memory.entries.some(entry => entry.speaker === 'patient')) return null;
  return { ...memory, status: 'bloomed', stage: 5 };
}

export function localReply(memory: GardenMemory): string {
  const patient = memory.entries.filter(entry => entry.speaker === 'patient');
  const latest = memory.entries[memory.entries.length - 1];
  if (!latest) return OPENING;
  if (latest.speaker === 'family') return `${latest.name || '家人'}补充了一点自己的印象。你愿意接着说些什么？`;
  const text = latest.text;
  if (isStopSignal(text)) return COMFORT;
  const all = patient.map(entry => entry.text).join(' ');
  const repeats = patient.slice(0, -1).some(entry => normalise(entry.text) === normalise(text));
  if (repeats) return '嗯，我在听。我们可以慢慢说，也可以安静地坐一会儿。';
  if (/海边|沙滩|大海/.test(text) && !/声音|浪声|响/.test(all)) return '你提到了海边。那里有什么声音，让你印象深？';
  if (/浪|声音|响/.test(text)) return '你说到了那里的声音。那时，你身边都有谁？';
  if (/香|味道/.test(text)) return '你提到了那股香味。它让你想到什么？';
  if (/妈妈|奶奶|外婆/.test(text)) return '你提到了她。你愿意说说和她在一起的一件小事吗？';
  if (/爸爸|爷爷|外公/.test(text)) return '你提到了他。你愿意说说和他在一起的一件小事吗？';
  if (/暖|开心|快乐/.test(text)) return '你说到了自己的感受。你愿意再讲一点那个时候的事吗？';
  const quote = text.length > 22 ? `${text.slice(0, 20)}…` : text;
  return `你说：“${quote}”。你愿意接着讲一点吗？`;
}

function validEntry(value: unknown): value is GardenEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as GardenEntry;
  return typeof entry.id === 'string' && ['patient', 'family', 'companion'].includes(entry.speaker)
    && typeof entry.text === 'string' && entry.text.length <= 4000 && typeof entry.createdAt === 'string'
    && (entry.speaker !== 'family' || (entry.consent === true && typeof entry.name === 'string'));
}

export function validMemory(value: unknown): value is GardenMemory {
  if (!value || typeof value !== 'object') return false;
  const memory = value as GardenMemory;
  return typeof memory.id === 'string' && typeof memory.title === 'string' && memory.title.length <= 100
    && ['daisy', 'gardenia', 'calendula'].includes(memory.kind)
    && Number.isInteger(memory.stage) && memory.stage >= 0 && memory.stage <= 5
    && ['growing', 'paused', 'bloomed'].includes(memory.status)
    && typeof memory.createdAt === 'string' && Array.isArray(memory.entries) && memory.entries.every(validEntry);
}

export function readGarden(): GardenStore {
  const raw = localStorage.getItem(GARDEN_KEY);
  if (!raw) return { version: 1, flowers: exampleFlowers, current: null };
  const saved = JSON.parse(raw);
  if (saved?.version !== 1 || !Array.isArray(saved.flowers) || !saved.flowers.every(validMemory)
    || (saved.current !== null && !validMemory(saved.current))) throw new Error('Invalid garden data');
  return { ...saved, current: saved.current ? { ...saved.current, status: 'paused' } : null };
}

export function writeGarden(store: GardenStore) {
  try { localStorage.setItem(GARDEN_KEY, JSON.stringify(store)); return true; }
  catch { return false; }
}

export function validConversation(value: unknown): value is { entries: GardenEntry[] } {
  if (!value || typeof value !== 'object') return false;
  const { entries } = value as { entries?: unknown };
  return Array.isArray(entries) && entries.length > 0 && entries.length <= 20 && entries.every(validEntry)
    && entries.reduce((total, entry) => total + entry.text.length, 0) <= 16000
    && entries[entries.length - 1].speaker !== 'companion';
}
