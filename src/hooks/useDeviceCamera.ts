import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraImage {
  webPath: string;
  base64?: string;
  blob?: Blob;
}

export interface CameraVideo {
  webPath: string;
  blob: Blob;
}

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

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

      // Use Base64 on native to get the actual image data (fetch() doesn't work with local file URLs)
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: isNative ? CameraResultType.Base64 : CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      if (isNative && photo.base64String) {
        const blob = base64ToBlob(photo.base64String, `image/${photo.format || 'jpeg'}`);
        const webPath = URL.createObjectURL(blob);
        return { webPath, base64: photo.base64String, blob };
      } else if (photo.webPath) {
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

      // Use Base64 on native to get the actual image data
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: isNative ? CameraResultType.Base64 : CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      if (isNative && photo.base64String) {
        const blob = base64ToBlob(photo.base64String, `image/${photo.format || 'jpeg'}`);
        const webPath = URL.createObjectURL(blob);
        return { webPath, base64: photo.base64String, blob };
      } else if (photo.webPath) {
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

      // For multiple picks, we need to get base64 for each image
      // pickImages returns webPaths, so we need to read them as base64
      const images: CameraImage[] = [];
      
      for (const photo of result.photos) {
        if (photo.webPath) {
          // Try to get the image as base64 using a single pick (workaround)
          // Since pickImages doesn't support base64, create blob URL for preview
          // and store the webPath - the upload function will handle conversion
          images.push({
            webPath: photo.webPath,
          });
        }
      }
      
      return images;
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

  const pickVideoFromGallery = useCallback(async (): Promise<CameraVideo | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && file.type.startsWith('video/')) {
          const webPath = URL.createObjectURL(file);
          resolve({ webPath, blob: file });
        } else {
          resolve(null);
        }
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }, []);

  return {
    takePhoto,
    pickFromGallery,
    pickMultipleFromGallery,
    pickVideoFromGallery,
    isLoading,
    error,
    isNative,
  };
};
