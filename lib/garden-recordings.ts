export type SavedVoice = {
  id: string; gardenId: string; title: string; recipient: string; prompt: string;
  audio: Blob; createdAt: number;
};

const DATABASE = 'memory-garden-voices-v1';
const STORE = 'recordings';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    let failed = false;
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE, { keyPath: 'id' }); };
    request.onblocked = () => { failed = true; reject(new Error('Recording storage is busy in another tab.')); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (failed) { request.result.close(); return; }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}

async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let value: T;
    tx.oncomplete = () => { db.close(); resolve(value); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Recording storage was interrupted.')); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    try { operation(tx.objectStore(STORE), result => { value = result; }); }
    catch (error) { tx.abort(); db.close(); reject(error); }
  });
}

export async function saveVoice(voice: SavedVoice) {
  if (!voice.gardenId || !voice.id || !(voice.audio instanceof Blob) || !voice.audio.size || voice.audio.size > 8 * 1024 * 1024) throw new Error('This recording cannot be saved.');
  return transaction<void>('readwrite', store => { store.put(voice); });
}

export async function getVoices(gardenId: string): Promise<SavedVoice[]> {
  return transaction<SavedVoice[]>('readonly', (store, result) => {
    const request = store.getAll();
    request.onsuccess = () => result((request.result as SavedVoice[]).filter(voice => voice.gardenId === gardenId).sort((a, b) => b.createdAt - a.createdAt));
  });
}

export async function deleteVoice(id: string, gardenId: string) {
  return transaction<void>('readwrite', store => {
    const request = store.get(id);
    request.onsuccess = () => { if (request.result?.gardenId === gardenId) store.delete(id); };
  });
}

export async function clearGardenRecordings(gardenId?: string) {
  if (!gardenId) return;
  return transaction<void>('readwrite', store => {
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (!row) return;
      if (row.value.gardenId === gardenId) row.delete();
      row.continue();
    };
  });
}
