/** Match videos are far too large for localStorage (which is ~5 MB and string-only),
 *  so the file itself lives in IndexedDB as a Blob, keyed by session. Only the
 *  metadata travels in the normal app state. */

const DB_NAME = 'fut7-video';
const DB_VERSION = 1;
const STORE = 'videos';

export interface VideoMeta {
  nome: string;
  tamanho: number;
  tipo: string;
  salvoEm: number;
}

interface Registro extends VideoMeta {
  sessaoId: string;
  blob: Blob;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'sessaoId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function transacao<T>(modo: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return abrir().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, modo);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  }));
}

export async function salvarVideo(sessaoId: string, file: File): Promise<VideoMeta> {
  const meta: VideoMeta = { nome: file.name, tamanho: file.size, tipo: file.type, salvoEm: Date.now() };
  const registro: Registro = { sessaoId, blob: file, ...meta };
  await transacao('readwrite', (s) => s.put(registro));
  return meta;
}

export async function carregarVideo(sessaoId: string): Promise<{ blob: Blob; meta: VideoMeta } | null> {
  try {
    const r = await transacao<Registro | undefined>('readonly', (s) => s.get(sessaoId));
    if (!r) return null;
    return { blob: r.blob, meta: { nome: r.nome, tamanho: r.tamanho, tipo: r.tipo, salvoEm: r.salvoEm } };
  } catch {
    return null;
  }
}

export async function removerVideo(sessaoId: string): Promise<void> {
  try {
    await transacao('readwrite', (s) => s.delete(sessaoId));
  } catch {
    // nothing to remove
  }
}

export function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/** Rough headroom check so a 2 GB file fails with an explanation instead of a
 *  QuotaExceededError in the middle of the save. */
export async function espacoDisponivel(): Promise<{ usado: number; total: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  if (e.usage === undefined || e.quota === undefined) return null;
  return { usado: e.usage, total: e.quota };
}
