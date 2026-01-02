import { useState, useEffect } from "react";
import { getCachedVideoMetadata, cacheVideoMetadata } from "@/lib/videoMetadataCache";

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Get video duration from URL (with cache support)
 */
export const getVideoDuration = async (videoUrl: string): Promise<number | null> => {
  if (!videoUrl) return null;

  // Check cache first
  const cached = await getCachedVideoMetadata(videoUrl);
  if (cached && cached.duration !== null) {
    return cached.duration;
  }

  // Fetch duration from video
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 5000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = video.duration;
      cleanup();
      
      const validDuration = duration && isFinite(duration) ? duration : null;
      
      // Cache the duration (don't overwrite thumbnail if exists)
      if (cached) {
        cacheVideoMetadata(videoUrl, cached.thumbnail, validDuration);
      } else {
        cacheVideoMetadata(videoUrl, null, validDuration);
      }
      
      resolve(validDuration);
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve(null);
    };

    video.src = videoUrl;
  });
};

/**
 * Hook to get video duration with caching
 */
export const useVideoDuration = (videoUrl: string | null | undefined) => {
  const [duration, setDuration] = useState<number | null>(null);
  const [formattedDuration, setFormattedDuration] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!videoUrl) {
      setDuration(null);
      setFormattedDuration("");
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    // Check cache first for instant display
    getCachedVideoMetadata(videoUrl).then((cached) => {
      if (!isMounted) return;
      
      if (cached && cached.duration !== null) {
        setDuration(cached.duration);
        setFormattedDuration(formatDuration(cached.duration));
        setIsLoading(false);
        return;
      }

      // Fetch from video if not cached
      getVideoDuration(videoUrl).then((dur) => {
        if (!isMounted) return;
        setDuration(dur);
        setFormattedDuration(dur ? formatDuration(dur) : "");
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [videoUrl]);

  return { duration, formattedDuration, isLoading };
};
