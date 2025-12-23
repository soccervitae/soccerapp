import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export interface GalleryMedia {
  id: string;
  thumbnail: string;
  webPath: string;
  type: 'image' | 'video';
  createdAt?: number;
}

export const useDeviceGallery = () => {
  const [media, setMedia] = useState<GalleryMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const isNative = Capacitor.isNativePlatform();

  const loadGallery = useCallback(async (options?: { 
    limit?: number; 
    startAt?: number; 
    type?: 'image' | 'video' | 'all' 
  }) => {
    if (!isNative) {
      setError('Galeria disponível apenas em dispositivos móveis');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dynamically import to avoid issues on web
      const { GalleryPlus } = await import('capacitor-gallery-plus');
      
      // Check permissions
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
    }
  }, [isNative]);

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

  const clearGallery = useCallback(() => {
    setMedia([]);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    media,
    loadGallery,
    getMediaPath,
    clearGallery,
    isLoading,
    error,
    hasMore,
    isNative,
  };
};
