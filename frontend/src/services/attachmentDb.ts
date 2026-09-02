const DB_NAME = 'sapi-papi-demo-attachments';
const STORE_NAME = 'attachments';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export interface StoredAttachment { id: string; name: string; type: string; size: number; createdAt: string; blob: Blob }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'id' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAttachments(files: File[]): Promise<string[]> {
  if (files.length > 3) throw new Error('Maksimal 3 lampiran per pembayaran.');
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error(`Format ${file.name} tidak didukung.`);
    if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name} melebihi batas 5 MB.`);
  }
  const db = await openDb();
  const ids: string[] = [];
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    files.forEach(file => {
      const id = `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      ids.push(id); store.put({ id, name: file.name, type: file.type, size: file.size, createdAt: new Date().toISOString(), blob: file } satisfies StoredAttachment);
    });
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close(); return ids;
}

export async function getAttachment(id: string): Promise<StoredAttachment | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function clearAttachments(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite'); tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close();
}
