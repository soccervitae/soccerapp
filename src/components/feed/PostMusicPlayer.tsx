import { useState, useRef, useCallback, useEffect } from "react";
import { formatDuration } from "@/hooks/useMusic";
import { cn } from "@/lib/utils";

interface MusicTrackInfo {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  duration_seconds: number;
  cover_url: string | null;
}

interface PostMusicPlayerProps {
  track: MusicTrackInfo;
  startSeconds?: number;
  endSeconds?: number;
  className?: string;
}

export function PostMusicPlayer({
  track,
  startSeconds = 0,
  endSeconds,
  className,
}: PostMusicPlayerProps) {
  const effectiveEnd = endSeconds ?? track.duration_seconds;
  const duration = effectiveEnd - startSeconds;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startSeconds);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(startSeconds);
    setProgress(0);
  }, [startSeconds]);

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(track.audio_url);
    }

    const audio = audioRef.current;
    audio.currentTime = startSeconds;
    setCurrentTime(startSeconds);

    audio.play().then(() => {
      setIsPlaying(true);

      intervalRef.current = setInterval(() => {
        const time = audio.currentTime;
        if (time >= effectiveEnd) {
          stopPlayback();
        } else {
          setCurrentTime(time);
          setProgress(((time - startSeconds) / duration) * 100);
        }
      }, 100);
    }).catch(() => {
      // Autoplay blocked
      setIsPlaying(false);
    });
  }, [track.audio_url, startSeconds, effectiveEnd, duration, stopPlayback]);

  const toggle = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      play();
    }
  };

  const displayTime = isPlaying 
    ? formatDuration(Math.floor(currentTime - startSeconds))
    : formatDuration(duration);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg mx-4 my-2",
        className
      )}
    >
      {/* Music Icon / Cover */}
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <span className="material-symbols-outlined text-lg text-primary">
            music_note
          </span>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          {/* Progress bar */}
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden min-w-[40px]">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {displayTime}
          </span>
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={toggle}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
          isPlaying
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        )}
      >
        <span className="material-symbols-outlined text-lg">
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>
    </div>
  );
}
