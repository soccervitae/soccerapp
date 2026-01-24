import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, ChevronDown, ChevronUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeezerSearch, type MusicTrack } from "@/hooks/useMusic";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [showMoreFromArtist, setShowMoreFromArtist] = useState(false);
  const [previewTrack, setPreviewTrack] = useState<MusicTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const effectiveEnd = endSeconds ?? durationSeconds;
  const trimDuration = effectiveEnd - startSeconds;

  // Search for more songs from the same artist
  const { data: artistTracks, isLoading: isLoadingArtist } = useDeezerSearch(
    showMoreFromArtist ? artist : ""
  );

  // Filter out the current track from artist results
  const filteredArtistTracks = artistTracks?.filter(
    (track) => track.title.toLowerCase() !== title.toLowerCase()
  );

  useEffect(() => {
    if (!isOpen) {
      // Stop and reset when sheet closes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = startSeconds;
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setShowMoreFromArtist(false);
      setPreviewTrack(null);
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

    // Stop any preview playing
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewTrack(null);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const togglePreview = (track: MusicTrack) => {
    // Stop main audio if playing
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (previewTrack?.id === track.id) {
      // Stop current preview
      previewAudioRef.current?.pause();
      setPreviewTrack(null);
    } else {
      // Play new preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      previewAudioRef.current = new Audio(track.audio_url);
      previewAudioRef.current.play().catch(() => {});
      previewAudioRef.current.addEventListener("ended", () => {
        setPreviewTrack(null);
      });
      setPreviewTrack(track);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 max-h-[85vh]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center">Música do Post</SheetTitle>
        </SheetHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
          <div className="flex flex-col items-center gap-6 pb-4">
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

            {/* More from Artist Button */}
            <Button
              variant="outline"
              className="w-full max-w-xs gap-2"
              onClick={() => setShowMoreFromArtist(!showMoreFromArtist)}
            >
              <span className="material-symbols-outlined text-[18px]">
                library_music
              </span>
              Mais de {artist}
              {showMoreFromArtist ? (
                <ChevronUp className="w-4 h-4 ml-auto" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto" />
              )}
            </Button>

            {/* Artist Tracks Section */}
            {showMoreFromArtist && (
              <div className="w-full space-y-3">
                {isLoadingArtist ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredArtistTracks && filteredArtistTracks.length > 0 ? (
                  <div className="space-y-2">
                    {filteredArtistTracks.slice(0, 10).map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {track.cover_url ? (
                            <img
                              src={track.cover_url}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="material-symbols-outlined text-muted-foreground">
                                music_note
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-foreground">
                            {track.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(track.duration_seconds)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full w-10 h-10 p-0"
                          onClick={() => togglePreview(track)}
                        >
                          {previewTrack?.id === track.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma outra música encontrada
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
