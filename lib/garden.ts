export type FlowerKind = 'daisy' | 'gardenia' | 'calendula';
export type GardenEntry = {
  id: string; speaker: 'patient' | 'family' | 'companion'; text: string; createdAt: string;
  name?: string; consent?: boolean; mode?: 'local' | 'ai';
};
export type GardenMemory = {
  id: string; title: string; kind: FlowerKind; stage: number; status: 'growing' | 'paused' | 'bloomed';
  entries: GardenEntry[]; createdAt: string; example?: boolean; familyBud?: boolean; opening?: string;
  growthVersion?: 2; sensoryDetails?: number;
};
export type GardenStore = { version: 1; garden_id?: string; flowers: GardenMemory[]; current: GardenMemory | null };
export const GARDEN_KEY = 'memory-garden-v1';
export const GARDEN_ID_KEY = 'garden_id';
export const MAX_EXPRESSION = 1200;
export const GROWTH_STAGES = ['empty', 'seed', 'sprout', 'stem', 'leaf', 'bud', 'petal', 'bloom'] as const;
export const flowerNames: Record<FlowerKind, string> = { daisy: 'Daisy', gardenia: 'Gardenia', calendula: 'Calendula' };
export const OPENING = 'What is a place you have enjoyed with someone close to you?';
export const COMFORT = 'That is okay. We can visit another day. You can rest with someone you trust nearby.';
export const REASSURANCE = 'No need to remember everything. Being here together is enough.';
export const topics = [
  { id: 'places', title: 'Somewhere special', label: 'A place, a journey, a little adventure', question: OPENING },
  { id: 'people', title: 'Someone dear', label: 'A person you would like to talk about', question: 'Who would you like to tell me a little about?' },
  { id: 'home', title: 'A moment at home', label: 'Everyday things that feel like you', question: 'What is a little moment at home you would like to share?' },
  { id: 'food', title: 'Something delicious', label: 'A meal, a scent, a familiar kitchen', question: 'What is a food you enjoy sharing with someone?' },
  { id: 'music', title: 'A familiar song', label: 'A tune, a voice, a little melody', question: 'What is a song you enjoy listening to?' },
  { id: 'outdoors', title: 'A little fresh air', label: 'A walk, a view, a peaceful place', question: 'What is an outdoor place you enjoy spending time in?' },
  { id: 'objects', title: 'Something you treasure', label: 'An object with a little story', question: 'What is an object you would like to tell me about?' },
  { id: 'seasons', title: 'A favorite season', label: 'A time of year that feels special', question: 'What do you enjoy about a season you like?' },
  { id: 'pastimes', title: 'A small pleasure', label: 'Something you like doing in your own time', question: 'What is something you enjoy doing in a quiet moment?' },
];

export function isStopSignal(text: string) {
  const clean = text.toLowerCase().replace(/[’‘]/g, "'");
  if (/^(?:please\s+)?stop(?:\s+(?:asking|talking|now))?[.!\s]*$/.test(clean.trim())) return true;
  return /不想.{0,3}(说|聊|讲|继续)|不(说|聊|讲)了|先别问|别问了|停下来|停止|先停|休息|累了|难过|害怕|不舒服|想不起来|记不清|记不得|不知道|不愿意/.test(clean)
    || /\b(i (?:do not|don't|don t) want to (?:talk|share|speak|continue)|(?:please )?stop (?:asking|talking)|(?:can we|i want to|i need to) stop|leave me alone|(?:i |i'm |i am |i feel |feeling )(?:so |very |a little |too )?(?:tired|scared|afraid|sad|distressed|upset|confused|uncomfortable)|(?:i )?(?:can t|can't|cannot) remember|(?:i )?(?:don't|do not) know|(?:need|want) (?:a |to )?(?:rest|break)|let'?s (?:rest|stop))\b/.test(clean);
}
export function normalise(text: string) { return text.toLowerCase().replace(/[\s\p{P}]/gu, ''); }
export function chooseFlower(text: string): FlowerKind {
  if (/\b(sea|beach|ocean|waves?|shore|mountains?|woods?|forest|winter|snow)\b|海边|海浪|大海|沙滩|山|冬|雪/i.test(text)) return 'daisy';
  if (/\b(home|kitchen|mum|mom|mother|soup|dinner|grandmother|grandma)\b|家|厨房|妈妈|汤|饭|奶奶|外婆/i.test(text)) return 'gardenia';
  if (/\b(sunshine|sunny|warm|happy|joy|courtyard)\b|阳光|温暖|暖和|开心|快乐|院子/i.test(text)) return 'calendula';
  return 'daisy';
}
export function newMemory(opening = OPENING): GardenMemory {
  return { id: crypto.randomUUID(), title: 'A little moment', opening, kind: 'daisy', stage: 0, growthVersion: 2, sensoryDetails: 0, status: 'growing', entries: [], createdAt: new Date().toISOString() };
}
export function addPatient(memory: GardenMemory, text: string): GardenMemory {
  const clean = text.trim();
  if (!clean || clean.length > MAX_EXPRESSION || memory.status !== 'growing') return memory;
  if (isStopSignal(clean)) return { ...memory, status: 'paused' };
  const previous = memory.entries.filter(entry => entry.speaker === 'patient');
  const distinct = !previous.some(entry => normalise(entry.text) === normalise(clean));
  const meaningful = normalise(clean).length > 1 && !/^(嗯+|好+|是的?|可以|谢谢|对的?|yes|yeah|yep|ok|okay|sure|thanks|thankyou|uhh?|hmm?)$/.test(normalise(clean));
  const first = previous.length === 0;
  const stage = distinct && meaningful ? Math.min(7, memory.stage + 1) : memory.stage;
  const sensory = distinct && meaningful && /\b(smell|scent|fragrance|aroma|sound|sounds|heard|hear|waves|music|soft|rough|smooth|touch|felt|warm|cold|hot|cool|shell|cup|bowl|photo|blanket|breeze)\b|气味|香|声音|浪声|触感|柔软|温度|温暖|凉|贝壳|碗/i.test(clean);
  return {
    ...memory, status: 'growing', stage, kind: first ? chooseFlower(clean) : memory.kind,
    sensoryDetails: (memory.sensoryDetails || 0) + (sensory ? 1 : 0),
    title: first ? clean.replace(/[。！？.!?].*$/, '').slice(0, 64).trim() : memory.title,
    entries: [...memory.entries, { id: crypto.randomUUID(), speaker: 'patient', text: clean, createdAt: new Date().toISOString() }],
  };
}
export function addFamily(memory: GardenMemory, text: string, name: string, consent: boolean): GardenMemory {
  if (!consent || !text.trim() || text.length > MAX_EXPRESSION || memory.status !== 'growing' || !memory.entries.some(entry => entry.speaker === 'patient')) return memory;
  return { ...memory, familyBud: true, entries: [...memory.entries, { id: crypto.randomUUID(), speaker: 'family', text: text.trim(), name: name.trim() || 'Family', consent: true, createdAt: new Date().toISOString() }] };
}
export function finishMemory(memory: GardenMemory): GardenMemory | null {
  if (!memory.entries.some(entry => entry.speaker === 'patient')) return null;
  return { ...memory, status: memory.stage === 7 ? 'bloomed' : 'paused' };
}
export function localReply(memory: GardenMemory): string {
  const patient = memory.entries.filter(entry => entry.speaker === 'patient');
  const latest = memory.entries[memory.entries.length - 1];
  if (!latest) return memory.opening || OPENING;
  if (latest.speaker === 'family') return `${latest.name || 'Your companion'} shared their own impression. What would you like to share next?`;
  if (isStopSignal(latest.text)) return COMFORT;
  const text = latest.text;
  const all = patient.map(entry => entry.text).join(' ');
  if (patient.slice(0, -1).some(entry => normalise(entry.text) === normalise(text))) return 'I am here, listening. We can take our time, or sit quietly together.';
  if (/\b(beach|sea|ocean)\b|海边|沙滩|大海/i.test(text) && !/\b(sounds?|waves?|loud)\b|声音|浪声|响/i.test(all)) return 'You mentioned the seaside. What sounds come to mind from that place?';
  if (/\b(waves?|sounds?|loud)\b|浪|声音|响/i.test(text)) return 'You shared a little about the sounds. Who was there with you?';
  if (/\b(smell|scent|fragrance|aroma)\b|香|味道/i.test(text)) return 'You mentioned a scent. What does it bring to mind?';
  if (/\b(mom|mum|mother|grandma|grandmother)\b|妈妈|奶奶|外婆/i.test(text)) return 'You mentioned her. What is a little moment together you would like to share?';
  if (/\b(dad|father|grandpa|grandfather)\b|爸爸|爷爷|外公/i.test(text)) return 'You mentioned him. What is a little moment together you would like to share?';
  if (/\b(warm|happy|joy)\b|暖|开心|快乐/i.test(text)) return 'You shared how it felt. What else comes to mind about that moment?';
  const quote = text.length > 90 ? `${text.slice(0, 87)}…` : text;
  return `You said, “${quote}” What else would you like to share about it?`;
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
    && Number.isInteger(memory.stage) && memory.stage >= 0 && memory.stage <= (memory.growthVersion === 2 ? 7 : 5)
    && (memory.growthVersion === undefined || memory.growthVersion === 2)
    && (memory.sensoryDetails === undefined || (Number.isInteger(memory.sensoryDetails) && memory.sensoryDetails >= 0))
    && ['growing', 'paused', 'bloomed'].includes(memory.status)
    && (memory.opening === undefined || (typeof memory.opening === 'string' && memory.opening.length <= 300))
    && typeof memory.createdAt === 'string' && Array.isArray(memory.entries) && memory.entries.every(validEntry)
    && (memory.sensoryDetails || 0) <= memory.entries.filter(entry => entry.speaker === 'patient').length;
}

function getGardenId(preferred?: string): string {
  if (preferred && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(preferred)) return preferred;
  const saved = localStorage.getItem(GARDEN_ID_KEY);
  return saved && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(saved) ? saved : crypto.randomUUID();
}

function encodeFlower(memory: GardenMemory) {
  return {
    id: memory.id, memory_title: memory.title, stage: GROWTH_STAGES[memory.stage],
    created_at: Date.parse(memory.createdAt),
    details: memory.entries.filter(entry => entry.speaker === 'patient').map(entry => entry.text),
    // Preserve provenance and resuming context alongside the simple public fields.
    kind: memory.kind, status: memory.status, entries: memory.entries,
    familyBud: memory.familyBud || false, sensoryDetails: memory.sensoryDetails || 0, opening: memory.opening,
  };
}

function decodeFlower(value: unknown): GardenMemory {
  if (!value || typeof value !== 'object') throw new Error('Invalid flower');
  const raw = value as Record<string, unknown>;
  const stage = GROWTH_STAGES.indexOf(raw.stage as typeof GROWTH_STAGES[number]);
  if (stage < 0 || typeof raw.created_at !== 'number' || !Number.isFinite(raw.created_at)) throw new Error('Invalid flower stage or date');
  const createdAt = new Date(raw.created_at).toISOString();
  const details = raw.details;
  if (!Array.isArray(details) || !details.every(detail => typeof detail === 'string' && detail.length <= 4000)) throw new Error('Invalid flower details');
  const entries = Array.isArray(raw.entries) ? raw.entries : details.map((text, index) => ({ id: String(raw.id) + '-detail-' + index, speaker: 'patient', text, createdAt }));
  const memory = {
    id: raw.id, title: raw.memory_title, stage, growthVersion: 2,
    createdAt, kind: raw.kind || chooseFlower(details.join(' ')),
    status: raw.status || (stage === 7 ? 'bloomed' : 'paused'), entries,
    familyBud: raw.familyBud === true, sensoryDetails: raw.sensoryDetails || 0, opening: raw.opening,
  };
  if (!validMemory(memory)) throw new Error('Invalid flower data');
  return memory;
}

export function readGarden(): GardenStore {
  const raw = localStorage.getItem(GARDEN_KEY);
  if (!raw) {
    const empty: GardenStore = { version: 1, garden_id: getGardenId(), flowers: [], current: null };
    if (!writeGarden(empty)) throw new Error('Local storage unavailable');
    return empty;
  }
  const saved = JSON.parse(raw);
  let garden: GardenStore;
  if (saved?.version === 2 || (saved?.garden_id && saved?.version === undefined)) {
    if (!Array.isArray(saved.flowers)) throw new Error('Invalid garden data');
    garden = { version: 1, garden_id: getGardenId(saved.garden_id), flowers: saved.flowers.map(decodeFlower), current: saved.current ? decodeFlower(saved.current) : null };
  } else {
    if (saved?.version !== 1 || !Array.isArray(saved.flowers) || !saved.flowers.every(validMemory)
      || (saved.current !== null && !validMemory(saved.current))) throw new Error('Invalid garden data');
    const migrate = (memory: GardenMemory): GardenMemory => memory.growthVersion === 2 ? memory : {
      ...memory, growthVersion: 2, stage: [0, 2, 4, 5, 6, 7][memory.stage], sensoryDetails: 0,
    };
    garden = { version: 1, garden_id: getGardenId(saved.garden_id), flowers: saved.flowers.filter((flower: GardenMemory) => !flower.example).map(migrate), current: saved.current ? migrate(saved.current) : null };
  }
  if (garden.current) garden.current = { ...garden.current, status: 'paused' };
  // Only migrate validated data. Malformed originals remain untouched.
  writeGarden(garden);
  return garden;
}

export function writeGarden(store: GardenStore) {
  try {
    const garden_id = getGardenId(store.garden_id);
    const data = { version: 2, garden_id, flowers: store.flowers.map(encodeFlower), current: store.current ? encodeFlower(store.current) : null };
    localStorage.setItem(GARDEN_KEY, JSON.stringify(data));
    localStorage.setItem(GARDEN_ID_KEY, garden_id);
    return true;
  } catch { return false; }
}

export function resetGarden(): GardenStore {
  const gameKeys: string[] = [];
  for (let index = 0; index < localStorage.length; index++) { const key = localStorage.key(index); if (key?.startsWith('memory-garden-game-')) gameKeys.push(key); }
  for (const key of [GARDEN_KEY, GARDEN_ID_KEY, 'gardenName', 'gardenNameAsked', 'memory-garden-contact-v1', 'memory-garden-audio', ...gameKeys]) localStorage.removeItem(key);
  const fresh: GardenStore = { version: 1, garden_id: crypto.randomUUID(), flowers: [], current: null };
  if (!writeGarden(fresh)) throw new Error('Local storage unavailable');
  return fresh;
}

export function validConversation(value: unknown): value is { entries: GardenEntry[] } {
  if (!value || typeof value !== 'object') return false;
  const { entries } = value as { entries?: unknown };
  return Array.isArray(entries) && entries.length > 0 && entries.length <= 20 && entries.every(validEntry)
    && entries.reduce((total, entry) => total + entry.text.length, 0) <= 16000
    && entries[entries.length - 1].speaker !== 'companion';
}
