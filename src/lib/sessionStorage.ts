// IndexedDB-based session storage for PWA authentication transfer
const DB_NAME = 'soccer-vitae-auth';
const DB_VERSION = 1;
const STORE_NAME = 'session';
const SESSION_KEY = 'supabase-session';

interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  saved_at: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveSessionToIndexedDB = async (
  accessToken: string,
  refreshToken: string,
  expiresAt?: number
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const sessionData: StoredSession = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      saved_at: Date.now(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(sessionData, SESSION_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    console.log('[SessionStorage] Session saved to IndexedDB');
  } catch (error) {
    console.error('[SessionStorage] Error saving session:', error);
  }
};

export const getSessionFromIndexedDB = async (): Promise<StoredSession | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const session = await new Promise<StoredSession | null>((resolve, reject) => {
      const request = store.get(SESSION_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    if (session) {
      // Check if session is not too old (24 hours max for transfer)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - session.saved_at > maxAge) {
        console.log('[SessionStorage] Session expired, clearing');
        await clearSessionFromIndexedDB();
        return null;
      }
    }
    
    return session;
  } catch (error) {
    console.error('[SessionStorage] Error getting session:', error);
    return null;
  }
};

export const clearSessionFromIndexedDB = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(SESSION_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    console.log('[SessionStorage] Session cleared from IndexedDB');
  } catch (error) {
    console.error('[SessionStorage] Error clearing session:', error);
  }
};

export const hasSessionInIndexedDB = async (): Promise<boolean> => {
  const session = await getSessionFromIndexedDB();
  return session !== null;
};
