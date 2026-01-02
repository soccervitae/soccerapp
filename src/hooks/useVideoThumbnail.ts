import { useState, useCallback } from "react";

interface ThumbnailResult {
  thumbnailUrl: string;
  thumbnailBlob: Blob;
}

export const useVideoThumbnail = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateThumbnail = useCallback(async (
    videoSource: string | Blob,
    seekTime: number = 1
  ): Promise<ThumbnailResult | null> => {
    setIsGenerating(true);

    return new Promise((resolve) => {
      try {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        const cleanup = () => {
          video.pause();
          video.removeAttribute("src");
          video.load();
          if (videoSource instanceof Blob) {
            URL.revokeObjectURL(video.src);
          }
        };

        const handleError = () => {
          console.error("Error loading video for thumbnail generation");
          cleanup();
          setIsGenerating(false);
          resolve(null);
        };

        video.onerror = handleError;

        video.onloadedmetadata = () => {
          // Seek to the specified time or 25% of the video if too short
          const targetTime = Math.min(seekTime, video.duration * 0.25);
          video.currentTime = Math.max(0.1, targetTime);
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              cleanup();
              setIsGenerating(false);
              resolve(null);
              return;
            }

            // Use video dimensions, with a max of 640px for thumbnails
            const maxSize = 640;
            const aspectRatio = video.videoWidth / video.videoHeight;
            
            let width = video.videoWidth;
            let height = video.videoHeight;
            
            if (width > maxSize || height > maxSize) {
              if (aspectRatio > 1) {
                width = maxSize;
                height = Math.round(maxSize / aspectRatio);
              } else {
                height = maxSize;
                width = Math.round(maxSize * aspectRatio);
              }
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(video, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                cleanup();
                setIsGenerating(false);

                if (blob) {
                  const thumbnailUrl = URL.createObjectURL(blob);
                  resolve({ thumbnailUrl, thumbnailBlob: blob });
                } else {
                  resolve(null);
                }
              },
              "image/jpeg",
              0.85
            );
          } catch (err) {
            console.error("Error generating thumbnail:", err);
            cleanup();
            setIsGenerating(false);
            resolve(null);
          }
        };

        // Set the video source
        if (videoSource instanceof Blob) {
          video.src = URL.createObjectURL(videoSource);
        } else {
          video.src = videoSource;
        }

        video.load();
      } catch (err) {
        console.error("Error in thumbnail generation:", err);
        setIsGenerating(false);
        resolve(null);
      }
    });
  }, []);

  const generateThumbnailFromUrl = useCallback(async (
    url: string,
    seekTime: number = 1
  ): Promise<ThumbnailResult | null> => {
    return generateThumbnail(url, seekTime);
  }, [generateThumbnail]);

  const generateThumbnailFromBlob = useCallback(async (
    blob: Blob,
    seekTime: number = 1
  ): Promise<ThumbnailResult | null> => {
    return generateThumbnail(blob, seekTime);
  }, [generateThumbnail]);

  return {
    generateThumbnail,
    generateThumbnailFromUrl,
    generateThumbnailFromBlob,
    isGenerating,
  };
};

// Utility function for one-off thumbnail generation
export const generateVideoThumbnail = async (
  videoSource: string | Blob,
  seekTime: number = 1
): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
        if (videoSource instanceof Blob) {
          URL.revokeObjectURL(video.src);
        }
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };

      video.onloadedmetadata = () => {
        const targetTime = Math.min(seekTime, video.duration * 0.25);
        video.currentTime = Math.max(0.1, targetTime);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            cleanup();
            resolve(null);
            return;
          }

          const maxSize = 320;
          const aspectRatio = video.videoWidth / video.videoHeight;
          
          let width = video.videoWidth;
          let height = video.videoHeight;
          
          if (width > maxSize || height > maxSize) {
            if (aspectRatio > 1) {
              width = maxSize;
              height = Math.round(maxSize / aspectRatio);
            } else {
              height = maxSize;
              width = Math.round(maxSize * aspectRatio);
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);

          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
          cleanup();
          resolve(thumbnailUrl);
        } catch {
          cleanup();
          resolve(null);
        }
      };

      if (videoSource instanceof Blob) {
        video.src = URL.createObjectURL(videoSource);
      } else {
        video.src = videoSource;
      }

      video.load();
    } catch {
      resolve(null);
    }
  });
};
