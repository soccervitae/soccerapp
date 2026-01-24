import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface MusicDetailsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  artist: string;
  coverUrl?: string;
  audioUrl?: string;
  durationSeconds?: number;
  startSeconds?: number;
  endSeconds?: number;
}

export const MusicDetailsSheet = ({
  isOpen,
  onOpenChange,
  title,
  artist,
  coverUrl,
  audioUrl,
  durationSeconds = 30,
  startSeconds = 0,
  endSeconds,
}: MusicDetailsSheetProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const effectiveEnd = endSeconds ?? durationSeconds;
  const trimDuration = effectiveEnd - startSeconds;

  useEffect(() => {
    if (!isOpen) {
      // Stop and reset when sheet closes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = startSeconds;
      }
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [isOpen, startSeconds]);

  useEffect(() => {
    if (!audioUrl) return;

    audioRef.current = new Audio(audioUrl);
    audioRef.current.currentTime = startSeconds;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      const current = audio.currentTime - startSeconds;
      setCurrentTime(current);
      setProgress((current / trimDuration) * 100);

      // Loop back to start if reached end
      if (audio.currentTime >= effectiveEnd) {
        audio.currentTime = startSeconds;
      }
    };

    const handleEnded = () => {
      audio.currentTime = startSeconds;
      audio.play();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl, startSeconds, effectiveEnd, trimDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center">Música do Post</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-6">
          {/* Album Cover */}
          <motion.div
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={
              isPlaying
                ? { duration: 8, repeat: Infinity, ease: "linear" }
                : { duration: 0.3 }
            }
            className="relative"
          >
            <div className="w-40 h-40 rounded-full overflow-hidden shadow-xl border-4 border-muted">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-primary">
                    music_note
                  </span>
                </div>
              )}
            </div>
            {/* Vinyl hole effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-background border-2 border-muted" />
            </div>
          </motion.div>

          {/* Track Info */}
          <div className="text-center">
            <h3 className="font-bold text-lg text-foreground">{title}</h3>
            <p className="text-muted-foreground">{artist}</p>
          </div>

          {/* Progress Bar */}
          {audioUrl && (
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress} className="h-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(trimDuration)}</span>
              </div>
            </div>
          )}

          {/* Play Button */}
          {audioUrl && (
            <Button
              size="lg"
              onClick={togglePlay}
              className="rounded-full w-16 h-16 p-0"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-1" />
              )}
            </Button>
          )}

          {/* Duration info */}
          <p className="text-xs text-muted-foreground text-center">
            Prévia de {formatTime(trimDuration)} da faixa original
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
