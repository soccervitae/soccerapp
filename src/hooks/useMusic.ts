import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://wdgpmpgdlauiawbtbxmn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3BtcGdkbGF1aWF3YnRieG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTQ2NDAsImV4cCI6MjA3MTk5MDY0MH0.N4GcBwufglOUGhJ9pARhgxsA3_NOY9WbAtsKRmtBA08";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration_seconds: number;
  audio_url: string;
  cover_url: string | null;
  play_count: number;
  source?: "local" | "deezer";
}

export interface SelectedMusicWithTrim {
  track: MusicTrack;
  startSeconds: number;
  endSeconds: number;
}

// Deezer genre categories
export const DEEZER_GENRES = [
  { id: "all", label: "Top Charts", icon: "trending_up" },
  { id: "pop", label: "Pop", icon: "star" },
  { id: "rock", label: "Rock", icon: "electric_bolt" },
  { id: "hiphop", label: "Hip Hop", icon: "mic" },
  { id: "electronic", label: "Eletrônica", icon: "graphic_eq" },
  { id: "latin", label: "Latin", icon: "music_note" },
  { id: "rnb", label: "R&B", icon: "nightlife" },
  { id: "jazz", label: "Jazz", icon: "piano" },
  { id: "classical", label: "Clássica", icon: "library_music" },
  { id: "reggae", label: "Reggae", icon: "waves" },
  { id: "country", label: "Country", icon: "forest" },
] as const;

// Fetch trending music from Deezer API
export const useTrendingMusic = (limit: number = 6) => {
  return useQuery({
    queryKey: ["deezer-trending", limit],
    queryFn: async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/fetch-deezer-music?type=chart&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch trending music");
      }

      const result = await response.json();
      return result.tracks as MusicTrack[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch music by genre from Deezer API
export const useDeezerByGenre = (genre: string, limit: number = 30) => {
  return useQuery({
    queryKey: ["deezer-genre", genre, limit],
    queryFn: async () => {
      const params = genre === "all" 
        ? `type=chart&limit=${limit}`
        : `genre=${genre}&limit=${limit}`;
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/fetch-deezer-music?${params}`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch music by genre");
      }

      const result = await response.json();
      return result.tracks as MusicTrack[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Search music from Deezer API
export const useDeezerSearch = (searchQuery: string) => {
  return useQuery({
    queryKey: ["deezer-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/fetch-deezer-music?search=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search music");
      }

      const result = await response.json();
      return result.tracks as MusicTrack[];
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000,
  });
};


export const useMusicPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopProgressTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startProgressTracking = useCallback(() => {
    stopProgressTracking();
    intervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const currentProgress =
          (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(isNaN(currentProgress) ? 0 : currentProgress);
      }
    }, 100);
  }, [stopProgressTracking]);

  const play = useCallback(
    (track: MusicTrack) => {
      // Se é a mesma música, apenas resume
      if (currentTrack?.id === track.id && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
        startProgressTracking();
        return;
      }

      // Para a música atual se existir
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Cria novo audio
      const audio = new Audio(track.audio_url);
      audioRef.current = audio;
      setCurrentTrack(track);
      setProgress(0);

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
        stopProgressTracking();
      });

      audio.addEventListener("error", () => {
        setIsPlaying(false);
        stopProgressTracking();
      });

      audio.play().then(() => {
        setIsPlaying(true);
        startProgressTracking();
      });
    },
    [currentTrack, startProgressTracking, stopProgressTracking]
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopProgressTracking();
    }
  }, [stopProgressTracking]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const toggle = useCallback(
    (track: MusicTrack) => {
      if (currentTrack?.id === track.id && isPlaying) {
        pause();
      } else {
        play(track);
      }
    },
    [currentTrack, isPlaying, pause, play]
  );

  return {
    currentTrack,
    isPlaying,
    progress,
    play,
    pause,
    stop,
    toggle,
  };
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
