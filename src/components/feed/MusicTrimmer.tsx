import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MusicTrack, formatDuration } from "@/hooks/useMusic";
import { cn } from "@/lib/utils";

interface MusicTrimmerProps {
  track: MusicTrack;
  maxDuration?: number;
  initialStart?: number;
  initialEnd?: number;
  onConfirm: (startSeconds: number, endSeconds: number) => void;
  onClose: () => void;
}

export function MusicTrimmer({
  track,
  maxDuration = 15,
  initialStart,
  initialEnd,
  onConfirm,
  onClose,
}: MusicTrimmerProps) {
  const [startSeconds, setStartSeconds] = useState(initialStart ?? 0);
  const [endSeconds, setEndSeconds] = useState(
    initialEnd ?? Math.min(maxDuration, track.duration_seconds)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const duration = endSeconds - startSeconds;

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
  }, []);

  const playPreview = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(track.audio_url);
    }

    const audio = audioRef.current;
    audio.currentTime = startSeconds;
    setCurrentTime(startSeconds);

    audio.play().then(() => {
      setIsPlaying(true);

      // Track progress
      intervalRef.current = setInterval(() => {
        if (audio.currentTime >= endSeconds) {
          audio.pause();
          audio.currentTime = startSeconds;
          setCurrentTime(startSeconds);
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setCurrentTime(audio.currentTime);
        }
      }, 100);
    });
  }, [track.audio_url, startSeconds, endSeconds]);

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playPreview();
    }
  };

  const handleRangeChange = (values: number[]) => {
    const [newStart, newEnd] = values;
    
    // Ensure minimum difference of 5 seconds and max of maxDuration
    if (newEnd - newStart < 5) return;
    if (newEnd - newStart > maxDuration) {
      // Adjust to maintain max duration
      if (newStart !== startSeconds) {
        setStartSeconds(newStart);
        setEndSeconds(Math.min(newStart + maxDuration, track.duration_seconds));
      } else {
        setEndSeconds(newEnd);
        setStartSeconds(Math.max(0, newEnd - maxDuration));
      }
      return;
    }

    setStartSeconds(newStart);
    setEndSeconds(newEnd);

    // Stop playback if range changed
    if (isPlaying) {
      stopPlayback();
    }
  };

  const handleConfirm = () => {
    stopPlayback();
    onConfirm(startSeconds, endSeconds);
  };

  const handleClose = () => {
    stopPlayback();
    onClose();
  };

  // Generate waveform bars
  const waveformBars = Array.from({ length: 60 }, (_, i) => {
    const position = (i / 60) * track.duration_seconds;
    const isInRange = position >= startSeconds && position <= endSeconds;
    const isCurrentPosition = isPlaying && position <= currentTime && position >= startSeconds;
    // Pseudo-random heights for visual effect
    const height = 20 + Math.sin(i * 0.5) * 15 + Math.cos(i * 0.3) * 10;
    return { height, isInRange, isCurrentPosition };
  });

  const progress = isPlaying 
    ? ((currentTime - startSeconds) / duration) * 100 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={handleClose} className="p-1">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="font-semibold text-lg">Recortar Música</h2>
        <Button size="sm" onClick={handleConfirm} className="px-4">
          Confirmar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Track Info */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {track.cover_url ? (
              <img
                src={track.cover_url}
                alt={track.title}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="material-symbols-outlined text-4xl text-primary">
                music_note
              </span>
            )}
          </div>
          <h3 className="font-semibold text-lg">{track.title}</h3>
          <p className="text-muted-foreground">{track.artist}</p>
        </div>

        {/* Waveform Visualization */}
        <div className="w-full max-w-md">
          <div className="flex items-end justify-center gap-0.5 h-16 mb-4">
            {waveformBars.map((bar, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-colors",
                  bar.isCurrentPosition
                    ? "bg-primary"
                    : bar.isInRange
                    ? "bg-primary/40"
                    : "bg-muted"
                )}
                style={{ height: `${bar.height}%` }}
              />
            ))}
          </div>

          {/* Range Slider */}
          <div className="px-2">
            <Slider
              value={[startSeconds, endSeconds]}
              min={0}
              max={track.duration_seconds}
              step={1}
              onValueChange={handleRangeChange}
              className="my-4"
            />
          </div>

          {/* Time Labels */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatDuration(startSeconds)}</span>
            <span className="font-medium text-foreground">
              Duração: {formatDuration(duration)}
            </span>
            <span>{formatDuration(endSeconds)}</span>
          </div>
        </div>

        {/* Duration Info */}
        <p className="text-sm text-muted-foreground">
          Máximo: {maxDuration} segundos
        </p>

        {/* Play Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={togglePlayback}
          className="gap-2 px-8"
        >
          <span className="material-symbols-outlined">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
          {isPlaying ? "Pausar" : "Ouvir trecho"}
        </Button>

        {/* Progress Bar when playing */}
        {isPlaying && (
          <div className="w-full max-w-md">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span>{formatDuration(endSeconds)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
