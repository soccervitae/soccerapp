import { useState, useRef, useCallback, useEffect } from "react";
import { MusicTrack, SelectedMusicWithTrim, useTrendingMusic, formatDuration } from "@/hooks/useMusic";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MusicTrimmer } from "@/components/feed/MusicTrimmer";
import { toast } from "sonner";

interface TrendingMusicCardsProps {
  selectedMusic: SelectedMusicWithTrim | null;
  onSelect: (music: SelectedMusicWithTrim | null) => void;
  onOpenFullPicker: () => void;
  maxTrimDuration?: number;
  disabled?: boolean;
}

export const TrendingMusicCards = ({
  selectedMusic,
  onSelect,
  onOpenFullPicker,
  maxTrimDuration = 15,
  disabled = false,
}: TrendingMusicCardsProps) => {
  const { data: tracks, isLoading } = useTrendingMusic(6);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [pendingTrack, setPendingTrack] = useState<MusicTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingTrackId(null);
  }, []);

  const playPreview = useCallback((track: MusicTrack) => {
    // Stop current audio if playing
    stopAudio();

    // If clicking the same track, just stop
    if (playingTrackId === track.id) {
      return;
    }

    // Play new track
    const audio = new Audio(track.audio_url);
    audioRef.current = audio;
    setPlayingTrackId(track.id);

    audio.addEventListener("ended", () => {
      setPlayingTrackId(null);
    });

    audio.addEventListener("error", () => {
      setPlayingTrackId(null);
    });

    // Play only first 15 seconds as preview
    audio.play().catch(() => {
      setPlayingTrackId(null);
    });

    // Stop after maxTrimDuration seconds for preview
    setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause();
        setPlayingTrackId(null);
      }
    }, maxTrimDuration * 1000);
  }, [playingTrackId, stopAudio, maxTrimDuration]);

  const handleTrackSelect = (track: MusicTrack) => {
    if (disabled) return;
    
    stopAudio();

    // If duration is greater than maxTrimDuration, show trimmer
    if (track.duration_seconds > maxTrimDuration) {
      setPendingTrack(track);
      setShowTrimmer(true);
    } else {
      // Select directly with full duration
      onSelect({
        track,
        startSeconds: 0,
        endSeconds: track.duration_seconds,
      });
      toast.success("Música adicionada!");
    }
  };

  const handleTrimConfirm = (startSeconds: number, endSeconds: number) => {
    if (pendingTrack) {
      onSelect({
        track: pendingTrack,
        startSeconds,
        endSeconds,
      });
      toast.success("Música adicionada!");
    }
    setPendingTrack(null);
    setShowTrimmer(false);
  };

  const handleTrimClose = () => {
    setPendingTrack(null);
    setShowTrimmer(false);
  };

  if (selectedMusic) {
    return null; // Don't show trending cards if music is already selected
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[20px] text-primary">music_note</span>
          <span className="text-sm font-medium text-foreground">Adicionar música</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {isLoading ? (
            // Skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-24">
                <Skeleton className="w-full aspect-square rounded-lg mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
            ))
          ) : (
            <>
              {tracks?.map((track) => {
                const isPlaying = playingTrackId === track.id;
                
                return (
                  <button
                    key={track.id}
                    onClick={() => handleTrackSelect(track)}
                    disabled={disabled}
                    className="flex-shrink-0 w-24 text-left group disabled:opacity-50"
                  >
                    <div className="relative w-full aspect-square rounded-lg bg-muted overflow-hidden mb-1.5">
                      {track.cover_url ? (
                        <img
                          src={track.cover_url}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                          <span className="material-symbols-outlined text-[28px] text-primary">
                            music_note
                          </span>
                        </div>
                      )}
                      
                      {/* Play/Pause overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playPreview(track);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px] text-black">
                            {isPlaying ? "pause" : "play_arrow"}
                          </span>
                        </div>
                      </button>

                      {/* Playing indicator */}
                      {isPlaying && (
                        <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-3">
                            <div className="w-0.5 bg-primary-foreground rounded-full animate-pulse" style={{ height: '40%' }} />
                            <div className="w-0.5 bg-primary-foreground rounded-full animate-pulse" style={{ height: '80%', animationDelay: '0.1s' }} />
                            <div className="w-0.5 bg-primary-foreground rounded-full animate-pulse" style={{ height: '60%', animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      )}

                      {/* Duration badge */}
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
                        {formatDuration(track.duration_seconds)}
                      </div>
                    </div>
                    
                    <p className="text-xs font-medium text-foreground truncate">
                      {track.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {track.artist}
                    </p>
                  </button>
                );
              })}

              {/* See more button */}
              <button
                onClick={() => {
                  stopAudio();
                  onOpenFullPicker();
                }}
                disabled={disabled}
                className="flex-shrink-0 w-24 text-left disabled:opacity-50"
              >
                <div className="w-full aspect-square rounded-lg bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 mb-1.5 hover:bg-muted hover:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-[24px] text-muted-foreground">
                    more_horiz
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Ver mais
                  </span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Music Trimmer Dialog */}
      <Dialog open={showTrimmer} onOpenChange={setShowTrimmer}>
        <DialogContent className="max-w-lg h-[60vh] p-0 overflow-hidden">
          {pendingTrack && (
            <MusicTrimmer
              track={pendingTrack}
              maxDuration={maxTrimDuration}
              onConfirm={handleTrimConfirm}
              onClose={handleTrimClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
