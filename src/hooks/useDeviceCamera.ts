import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraImage {
  webPath: string;
  base64?: string;
}

export const useDeviceCamera = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = async () => {
    try {
      const permissions = await Camera.checkPermissions();
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        const requested = await Camera.requestPermissions();
        return requested.camera === 'granted' && requested.photos === 'granted';
      }
      return true;
    } catch (err) {
      console.error('Error checking permissions:', err);
      return false;
    }
  };

  const takePhoto = useCallback(async (): Promise<CameraImage | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isNative) {
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          setError('Permissão da câmera negada');
          return null;
        }
      }

      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      if (photo.webPath) {
        return { webPath: photo.webPath };
      }
      return null;
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') {
        setError(err.message || 'Erro ao capturar foto');
        console.error('Camera error:', err);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  const pickFromGallery = useCallback(async (): Promise<CameraImage | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isNative) {
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          setError('Permissão da galeria negada');
          return null;
        }
      }

      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      if (photo.webPath) {
        return { webPath: photo.webPath };
      }
      return null;
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') {
        setError(err.message || 'Erro ao selecionar imagem');
        console.error('Gallery error:', err);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  const pickMultipleFromGallery = useCallback(async (limit: number = 10): Promise<CameraImage[]> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isNative) {
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          setError('Permissão da galeria negada');
          return [];
        }
      }

      const result = await Camera.pickImages({
        quality: 90,
        limit,
      });

      return result.photos.map(photo => ({
        webPath: photo.webPath || '',
      })).filter(img => img.webPath);
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') {
        setError(err.message || 'Erro ao selecionar imagens');
        console.error('Gallery error:', err);
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  return {
    takePhoto,
    pickFromGallery,
    pickMultipleFromGallery,
    isLoading,
    error,
    isNative,
  };
};
