// IndexedDB wrapper for offline message storage

const DB_NAME = 'soccervitae-offline';
const DB_VERSION = 1;
const MESSAGES_STORE = 'messages';
const CONVERSATIONS_STORE = 'conversations';
const PENDING_STORE = 'pending_messages';

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Messages store - keyed by conversation ID
      if (!database.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = database.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        messagesStore.createIndex('conversation_id', 'conversation_id', { unique: false });
        messagesStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Conversations store
      if (!database.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        database.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
      }

      // Pending messages store (messages to be sent when online)
      if (!database.objectStoreNames.contains(PENDING_STORE)) {
        const pendingStore = database.createObjectStore(PENDING_STORE, { keyPath: 'tempId', autoIncrement: true });
        pendingStore.createIndex('conversation_id', 'conversation_id', { unique: false });
      }
    };
  });
};

// Messages operations
export const cacheMessages = async (messages: unknown[]): Promise<void> => {
  const database = await openDB();
  const tx = database.transaction(MESSAGES_STORE, 'readwrite');
  const store = tx.objectStore(MESSAGES_STORE);

  for (const message of messages) {
    store.put(message);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedMessages = async (conversationId: string): Promise<unknown[]> => {
  const database = await openDB();
  const tx = database.transaction(MESSAGES_STORE, 'readonly');
  const store = tx.objectStore(MESSAGES_STORE);
  const index = store.index('conversation_id');

  return new Promise((resolve, reject) => {
    const request = index.getAll(conversationId);
    request.onsuccess = () => {
      const messages = request.result || [];
      // Sort by created_at
      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      resolve(messages);
    };
    request.onerror = () => reject(request.error);
  });
};

// Conversations operations
export const cacheConversations = async (conversations: unknown[]): Promise<void> => {
  const database = await openDB();
  const tx = database.transaction(CONVERSATIONS_STORE, 'readwrite');
  const store = tx.objectStore(CONVERSATIONS_STORE);

  for (const conversation of conversations) {
    store.put(conversation);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedConversations = async (): Promise<unknown[]> => {
  const database = await openDB();
  const tx = database.transaction(CONVERSATIONS_STORE, 'readonly');
  const store = tx.objectStore(CONVERSATIONS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const conversations = request.result || [];
      // Sort by updated_at descending
      conversations.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      resolve(conversations);
    };
    request.onerror = () => reject(request.error);
  });
};

// Pending messages operations (for offline sending)
export interface PendingMessage {
  tempId?: number;
  conversation_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  reply_to_message_id?: string;
  created_at: string;
  sender_id: string;
}

export const addPendingMessage = async (message: Omit<PendingMessage, 'tempId'>): Promise<number> => {
  const database = await openDB();
  const tx = database.transaction(PENDING_STORE, 'readwrite');
  const store = tx.objectStore(PENDING_STORE);

  return new Promise((resolve, reject) => {
    const request = store.add(message);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getPendingMessages = async (): Promise<PendingMessage[]> => {
  const database = await openDB();
  const tx = database.transaction(PENDING_STORE, 'readonly');
  const store = tx.objectStore(PENDING_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const removePendingMessage = async (tempId: number): Promise<void> => {
  const database = await openDB();
  const tx = database.transaction(PENDING_STORE, 'readwrite');
  const store = tx.objectStore(PENDING_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(tempId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Clear all cached data
export const clearCache = async (): Promise<void> => {
  const database = await openDB();
  const tx = database.transaction([MESSAGES_STORE, CONVERSATIONS_STORE, PENDING_STORE], 'readwrite');
  
  tx.objectStore(MESSAGES_STORE).clear();
  tx.objectStore(CONVERSATIONS_STORE).clear();
  tx.objectStore(PENDING_STORE).clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Check if we're online
export const isOnline = (): boolean => navigator.onLine;

// Listen for online/offline events
export const onOnlineStatusChange = (callback: (isOnline: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
