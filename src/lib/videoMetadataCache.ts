// IndexedDB cache for video thumbnails and durations

const DB_NAME = 'soccervitae-video-cache';
const DB_VERSION = 1;
const METADATA_STORE = 'video_metadata';

// Cache expiration: 7 days
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

interface VideoMetadata {
  url: string;
  thumbnail: string | null;
  duration: number | null;
  cachedAt: number;
}

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

      if (!database.objectStoreNames.contains(METADATA_STORE)) {
        database.createObjectStore(METADATA_STORE, { keyPath: 'url' });
      }
    };
  });
};

/**
 * Generate a cache key from video URL
 */
const getCacheKey = (url: string): string => {
  // Use a simple hash to normalize URLs
  return url.split('?')[0]; // Remove query params for consistency
};

/**
 * Get cached video metadata
 */
export const getCachedVideoMetadata = async (videoUrl: string): Promise<VideoMetadata | null> => {
  try {
    const database = await openDB();
    const tx = database.transaction(METADATA_STORE, 'readonly');
    const store = tx.objectStore(METADATA_STORE);
    const key = getCacheKey(videoUrl);

    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result as VideoMetadata | undefined;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Check if cache is expired
        if (Date.now() - result.cachedAt > CACHE_EXPIRATION_MS) {
          // Cache expired, remove it
          deleteVideoMetadata(videoUrl);
          resolve(null);
          return;
        }

        resolve(result);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

/**
 * Cache video metadata
 */
export const cacheVideoMetadata = async (
  videoUrl: string,
  thumbnail: string | null,
  duration: number | null
): Promise<void> => {
  try {
    const database = await openDB();
    const tx = database.transaction(METADATA_STORE, 'readwrite');
    const store = tx.objectStore(METADATA_STORE);
    const key = getCacheKey(videoUrl);

    const metadata: VideoMetadata = {
      url: key,
      thumbnail,
      duration,
      cachedAt: Date.now(),
    };

    store.put(metadata);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail - cache is optional
  }
};

/**
 * Delete cached video metadata
 */
export const deleteVideoMetadata = async (videoUrl: string): Promise<void> => {
  try {
    const database = await openDB();
    const tx = database.transaction(METADATA_STORE, 'readwrite');
    const store = tx.objectStore(METADATA_STORE);
    const key = getCacheKey(videoUrl);

    store.delete(key);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail
  }
};

/**
 * Clear all cached video metadata
 */
export const clearVideoMetadataCache = async (): Promise<void> => {
  try {
    const database = await openDB();
    const tx = database.transaction(METADATA_STORE, 'readwrite');
    const store = tx.objectStore(METADATA_STORE);

    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail
  }
};

/**
 * Clean up expired cache entries
 */
export const cleanupExpiredCache = async (): Promise<void> => {
  try {
    const database = await openDB();
    const tx = database.transaction(METADATA_STORE, 'readwrite');
    const store = tx.objectStore(METADATA_STORE);
    const now = Date.now();

    const request = store.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        const metadata = cursor.value as VideoMetadata;
        if (now - metadata.cachedAt > CACHE_EXPIRATION_MS) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch {
    // Silently fail
  }
};
