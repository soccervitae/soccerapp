import { useState } from "react";
import imageCompression from "browser-image-compression";

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

export const useImageCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = async (
    file: File | Blob,
    options?: CompressionOptions
  ): Promise<Blob> => {
    const opts = {
      maxSizeMB: options?.maxSizeMB ?? 1,
      maxWidthOrHeight: options?.maxWidthOrHeight ?? 1920,
      useWebWorker: true,
      initialQuality: options?.quality ?? 0.8,
    };

    setIsCompressing(true);
    try {
      const fileToCompress = file instanceof File ? file : new File([file], "image.jpg", { type: file.type || "image/jpeg" });
      const compressed = await imageCompression(fileToCompress, opts);
      console.log(
        `Comprimido: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`
      );
      return compressed;
    } finally {
      setIsCompressing(false);
    }
  };

  const compressMultiple = async (
    files: (File | Blob)[],
    options?: CompressionOptions
  ): Promise<Blob[]> => {
    setIsCompressing(true);
    try {
      return await Promise.all(files.map((f) => compressImage(f, options)));
    } finally {
      setIsCompressing(false);
    }
  };

  return { compressImage, compressMultiple, isCompressing };
};
