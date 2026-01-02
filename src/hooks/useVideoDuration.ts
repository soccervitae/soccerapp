import { useState, useEffect } from "react";

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
 * Get video duration from URL
 */
export const getVideoDuration = (videoUrl: string): Promise<number | null> => {
  return new Promise((resolve) => {
    if (!videoUrl) {
      resolve(null);
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      resolve(duration && isFinite(duration) ? duration : null);
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
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
      resolve(duration && isFinite(duration) ? duration : null);
    };

    video.src = videoUrl;
  });
};

/**
 * Hook to get video duration
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

    setIsLoading(true);
    getVideoDuration(videoUrl).then((dur) => {
      setDuration(dur);
      setFormattedDuration(dur ? formatDuration(dur) : "");
      setIsLoading(false);
    });
  }, [videoUrl]);

  return { duration, formattedDuration, isLoading };
};
