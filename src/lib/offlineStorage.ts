// IndexedDB wrapper for offline storage

const DB_NAME = 'soccervitae-offline';
const DB_VERSION = 2;
const MESSAGES_STORE = 'messages';
const CONVERSATIONS_STORE = 'conversations';
const PENDING_STORE = 'pending_messages';
const POSTS_STORE = 'posts';
const PROFILES_STORE = 'profiles';
const USER_POSTS_STORE = 'user_posts';

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

      // Posts store (feed posts)
      if (!database.objectStoreNames.contains(POSTS_STORE)) {
        const postsStore = database.createObjectStore(POSTS_STORE, { keyPath: 'id' });
        postsStore.createIndex('created_at', 'created_at', { unique: false });
        postsStore.createIndex('user_id', 'user_id', { unique: false });
      }

      // Profiles store
      if (!database.objectStoreNames.contains(PROFILES_STORE)) {
        const profilesStore = database.createObjectStore(PROFILES_STORE, { keyPath: 'id' });
        profilesStore.createIndex('username', 'username', { unique: false });
      }

      // User posts store (posts by specific user)
      if (!database.objectStoreNames.contains(USER_POSTS_STORE)) {
        const userPostsStore = database.createObjectStore(USER_POSTS_STORE, { keyPath: 'id' });
        userPostsStore.createIndex('user_id', 'user_id', { unique: false });
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

// Posts operations
export const cachePosts = async (posts: unknown[]): Promise<void> => {
  const database = await openDB();
  const tx = database.transaction(POSTS_STORE, 'readwrite');
  const store = tx.objectStore(POSTS_STORE);

  for (const post of posts) {
    store.put(post);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedPosts = async (): Promise<unknown[]> => {
  const database = await openDB();
  const tx = database.transaction(POSTS_STORE, 'readonly');
  const store = tx.objectStore(POSTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const posts = request.result || [];
      // Sort by created_at descending
      posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      resolve(posts);
    };
    request.onerror = () => reject(request.error);
  });
};

// Profile operations
export const cacheProfile = async (profile: unknown): Promise<void> => {
  const database = await openDB();
  const tx = database.transaction(PROFILES_STORE, 'readwrite');
  const store = tx.objectStore(PROFILES_STORE);

  store.put(profile);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedProfile = async (userId: string): Promise<unknown | null> => {
  const database = await openDB();
  const tx = database.transaction(PROFILES_STORE, 'readonly');
  const store = tx.objectStore(PROFILES_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(userId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getCachedProfileByUsername = async (username: string): Promise<unknown | null> => {
  const database = await openDB();
  const tx = database.transaction(PROFILES_STORE, 'readonly');
  const store = tx.objectStore(PROFILES_STORE);
  const index = store.index('username');

  return new Promise((resolve, reject) => {
    const request = index.get(username);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// User posts operations
export const cacheUserPosts = async (userId: string, posts: unknown[]): Promise<void> => {
  const database = await openDB();
  const tx = database.transaction(USER_POSTS_STORE, 'readwrite');
  const store = tx.objectStore(USER_POSTS_STORE);

  // Clear existing posts for this user first
  const index = store.index('user_id');
  const existingRequest = index.getAllKeys(userId);
  
  await new Promise<void>((resolve, reject) => {
    existingRequest.onsuccess = async () => {
      for (const key of existingRequest.result) {
        store.delete(key);
      }
      resolve();
    };
    existingRequest.onerror = () => reject(existingRequest.error);
  });

  // Add new posts
  for (const post of posts) {
    store.put(post);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedUserPosts = async (userId: string): Promise<unknown[]> => {
  const database = await openDB();
  const tx = database.transaction(USER_POSTS_STORE, 'readonly');
  const store = tx.objectStore(USER_POSTS_STORE);
  const index = store.index('user_id');

  return new Promise((resolve, reject) => {
    const request = index.getAll(userId);
    request.onsuccess = () => {
      const posts = request.result || [];
      posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      resolve(posts);
    };
    request.onerror = () => reject(request.error);
  });
};

// Remove a post from cache (used when deleting posts)
export const removePostFromCache = async (postId: string): Promise<void> => {
  const database = await openDB();
  
  // Remove from POSTS_STORE
  const tx1 = database.transaction(POSTS_STORE, 'readwrite');
  const store1 = tx1.objectStore(POSTS_STORE);
  store1.delete(postId);
  
  // Remove from USER_POSTS_STORE
  const tx2 = database.transaction(USER_POSTS_STORE, 'readwrite');
  const store2 = tx2.objectStore(USER_POSTS_STORE);
  store2.delete(postId);
  
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      tx1.oncomplete = () => resolve();
      tx1.onerror = () => reject(tx1.error);
    }),
    new Promise<void>((resolve, reject) => {
      tx2.oncomplete = () => resolve();
      tx2.onerror = () => reject(tx2.error);
    })
  ]);
};

// Cache timestamp functions
const POSTS_CACHE_TIMESTAMP_KEY = 'posts_cached_at';

export const setPostsCacheTimestamp = (): void => {
  localStorage.setItem(POSTS_CACHE_TIMESTAMP_KEY, new Date().toISOString());
};

export const getPostsCacheTimestamp = (): string | null => {
  return localStorage.getItem(POSTS_CACHE_TIMESTAMP_KEY);
};

// Clear all cached data
export const clearCache = async (): Promise<void> => {
  const database = await openDB();
  const stores = [MESSAGES_STORE, CONVERSATIONS_STORE, PENDING_STORE, POSTS_STORE, PROFILES_STORE, USER_POSTS_STORE];
  const tx = database.transaction(stores, 'readwrite');
  
  for (const storeName of stores) {
    tx.objectStore(storeName).clear();
  }
  
  localStorage.removeItem(POSTS_CACHE_TIMESTAMP_KEY);

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
