import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration_seconds: number;
  audio_url: string;
  cover_url: string | null;
  play_count: number;
}

export interface SelectedMusicWithTrim {
  track: MusicTrack;
  startSeconds: number;
  endSeconds: number;
}

export const MUSIC_CATEGORIES = [
  { id: "all", label: "Todas", icon: "music_note" },
  { id: "energia", label: "Energia", icon: "bolt" },
  { id: "motivacao", label: "Motivação", icon: "trending_up" },
  { id: "treino", label: "Treino", icon: "fitness_center" },
  { id: "celebracao", label: "Celebração", icon: "celebration" },
  { id: "relaxante", label: "Relaxante", icon: "spa" },
] as const;

export const useTrendingMusic = (limit: number = 6) => {
  return useQuery({
    queryKey: ["trending-music", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("music_tracks")
        .select("*")
        .eq("is_active", true)
        .order("play_count", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as MusicTrack[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useMusicTracks = (category?: string) => {
  return useQuery({
    queryKey: ["music-tracks", category],
    queryFn: async () => {
      let query = supabase
        .from("music_tracks")
        .select("*")
        .eq("is_active", true)
        .order("play_count", { ascending: false });

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MusicTrack[];
    },
  });
};

export const useSearchMusic = (searchQuery: string) => {
  return useQuery({
    queryKey: ["music-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase
        .from("music_tracks")
        .select("*")
        .eq("is_active", true)
        .or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`)
        .order("play_count", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as MusicTrack[];
    },
    enabled: searchQuery.trim().length > 0,
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
