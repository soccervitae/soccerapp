import { useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

export interface GalleryMedia {
  id: string;
  thumbnail: string;
  webPath: string;
  type: 'image' | 'video';
  createdAt?: number;
}

interface LoadOptions {
  limit?: number;
  startAt?: number;
  type?: 'image' | 'video' | 'all';
}

export const useDeviceGallery = () => {
  const [media, setMedia] = useState<GalleryMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastOptionsRef = useRef<LoadOptions>({});

  const platform = Capacitor.getPlatform(); // 'ios', 'android', 'web'
  const isNative = Capacitor.isNativePlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  
  // Gallery plugin only works on iOS - Android support is "Planned"
  const supportsGalleryPlugin = isIOS;

  const loadGallery = useCallback(async (options?: LoadOptions) => {
    // Only try to load gallery on iOS (Android doesn't support the plugin)
    if (!supportsGalleryPlugin) {
      if (isAndroid) {
        // Android: Don't show error, just return empty (UI will show native picker button)
        setIsLoading(false);
        return [];
      }
      setError('Galeria disponível apenas em dispositivos móveis');
      return [];
    }

    const isLoadingMoreItems = (options?.startAt || 0) > 0;
    
    if (isLoadingMoreItems) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const { GalleryPlus } = await import('capacitor-gallery-plus');
      
      const { status } = await GalleryPlus.checkPermissions();
      if (status !== 'granted') {
        const { status: newStatus } = await GalleryPlus.requestPermissions();
        if (newStatus !== 'granted') {
          setError('Permissão negada para acessar a galeria');
          return [];
        }
      }

      const limit = options?.limit || 50;
      const startAt = options?.startAt || 0;
      const mediaType = options?.type || 'all';

      // Save options for loadMore
      lastOptionsRef.current = { limit, type: mediaType };

      const result = await GalleryPlus.getMediaList({
        type: mediaType === 'all' ? 'all' : mediaType,
        limit,
        startAt,
        thumbnailSize: 300,
        sort: 'newest',
      });

      const galleryItems: GalleryMedia[] = result.media.map((item: any) => ({
        id: item.id,
        thumbnail: item.thumbnail,
        webPath: item.path || item.webPath || '',
        type: item.type === 'video' ? 'video' : 'image',
        createdAt: item.createdAt,
      }));

      setHasMore(result.media.length >= limit);
      
      if (startAt > 0) {
        setMedia(prev => [...prev, ...galleryItems]);
      } else {
        setMedia(galleryItems);
      }

      return galleryItems;
    } catch (err: any) {
      console.error('Gallery error:', err);
      setError(err.message || 'Erro ao carregar galeria');
      return [];
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isNative]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return [];
    
    const { limit = 50, type = 'all' } = lastOptionsRef.current;
    return loadGallery({ 
      limit, 
      startAt: media.length, 
      type 
    });
  }, [loadGallery, media.length, isLoading, isLoadingMore, hasMore]);

  const getMediaPath = useCallback(async (id: string): Promise<string | null> => {
    if (!isNative) return null;

    try {
      const { GalleryPlus } = await import('capacitor-gallery-plus');
      const result = await GalleryPlus.getMedia({ 
        id, 
        includePath: true 
      });
      return result.path || null;
    } catch (err) {
      console.error('Error getting media path:', err);
      return null;
    }
  }, [isNative]);

  // Get media blob from gallery item - useful for uploading
  // Since gallery plugin doesn't return base64 directly, we need to use Camera plugin to re-pick
  const getMediaBlob = useCallback(async (id: string): Promise<Blob | null> => {
    if (!supportsGalleryPlugin) return null;

    try {
      // The gallery plugin doesn't support getting base64 data directly
      // For iOS, the path returned can be accessed via fetch in some cases
      const { GalleryPlus } = await import('capacitor-gallery-plus');
      const result = await GalleryPlus.getMedia({ 
        id, 
        includePath: true
      });
      
      if (result.path) {
        // Try to fetch the local file (may not work on all platforms)
        try {
          const response = await fetch(result.path);
          if (response.ok) {
            return await response.blob();
          }
        } catch (fetchErr) {
          console.warn('Could not fetch local path:', fetchErr);
        }
      }
      return null;
    } catch (err) {
      console.error('Error getting media blob:', err);
      return null;
    }
  }, [supportsGalleryPlugin]);

  const clearGallery = useCallback(() => {
    setMedia([]);
    setHasMore(true);
    setError(null);
    lastOptionsRef.current = {};
  }, []);

  return {
    media,
    loadGallery,
    loadMore,
    getMediaPath,
    getMediaBlob,
    clearGallery,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    isNative,
    isIOS,
    isAndroid,
    supportsGalleryPlugin,
  };
};
