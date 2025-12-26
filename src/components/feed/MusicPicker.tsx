import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMusicTracks,
  useSearchMusic,
  useMusicPlayer,
  MusicTrack,
  MUSIC_CATEGORIES,
  formatDuration,
  SelectedMusicWithTrim,
} from "@/hooks/useMusic";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { MusicTrimmer } from "./MusicTrimmer";

interface MusicPickerProps {
  selectedMusic: SelectedMusicWithTrim | null;
  onSelect: (music: SelectedMusicWithTrim | null) => void;
  onClose: () => void;
  onConfirm: () => void;
  maxTrimDuration?: number;
}

export function MusicPicker({
  selectedMusic,
  onSelect,
  onClose,
  onConfirm,
  maxTrimDuration = 15,
}: MusicPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [pendingTrack, setPendingTrack] = useState<MusicTrack | null>(null);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const { data: tracks, isLoading } = useMusicTracks(activeCategory);
  const { data: searchResults, isLoading: isSearching } =
    useSearchMusic(debouncedSearch);
  const { currentTrack, isPlaying, progress, toggle, stop } = useMusicPlayer();

  // Parar música ao desmontar
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const displayTracks = debouncedSearch.trim() ? searchResults : tracks;

  const handleTrackSelect = (track: MusicTrack) => {
    if (selectedMusic?.track.id === track.id) {
      onSelect(null);
    } else {
      // Se a música for maior que maxTrimDuration, mostrar trimmer
      if (track.duration_seconds > maxTrimDuration) {
        setPendingTrack(track);
        setShowTrimmer(true);
        stop();
      } else {
        // Música curta, selecionar diretamente
        onSelect({
          track,
          startSeconds: 0,
          endSeconds: track.duration_seconds,
        });
      }
    }
  };

  const handleTrimConfirm = (startSeconds: number, endSeconds: number) => {
    if (pendingTrack) {
      onSelect({
        track: pendingTrack,
        startSeconds,
        endSeconds,
      });
      setPendingTrack(null);
      setShowTrimmer(false);
    }
  };

  const handleTrimClose = () => {
    setPendingTrack(null);
    setShowTrimmer(false);
  };

  const handleConfirm = () => {
    stop();
    onConfirm();
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  // Mostrar trimmer
  if (showTrimmer && pendingTrack) {
    return (
      <MusicTrimmer
        track={pendingTrack}
        maxDuration={maxTrimDuration}
        onConfirm={handleTrimConfirm}
        onClose={handleTrimClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={handleClose} className="p-1">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <h2 className="font-semibold text-lg">Adicionar Música</h2>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!selectedMusic}
          className="px-4"
        >
          Confirmar
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">
            search
          </span>
          <Input
            placeholder="Buscar músicas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!debouncedSearch.trim() && (
        <div className="border-b border-border">
          <ScrollArea className="w-full">
            <div className="flex gap-2 p-4">
              {MUSIC_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {category.icon}
                  </span>
                  {category.label}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Music List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {(isLoading || isSearching) && (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="w-10 h-10 rounded-full" />
                </div>
              ))}
            </>
          )}

          {!isLoading && !isSearching && displayTracks?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <span className="material-symbols-outlined text-5xl mb-2">
                music_off
              </span>
              <p>Nenhuma música encontrada</p>
            </div>
          )}

          {displayTracks?.map((track) => {
            const isSelected = selectedMusic?.track.id === track.id;
            const isCurrentlyPlaying =
              currentTrack?.id === track.id && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                  isSelected
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                )}
              >
                {/* Cover/Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary" : "bg-muted"
                  )}
                >
                  {track.cover_url ? (
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span
                      className={cn(
                        "material-symbols-outlined text-2xl",
                        isSelected
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      music_note
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artist} · {formatDuration(track.duration_seconds)}
                  </p>
                  {/* Progress bar when playing */}
                  {isCurrentlyPlaying && (
                    <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Play/Pause Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(track);
                  }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isCurrentlyPlaying
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span className="material-symbols-outlined">
                    {isCurrentlyPlaying ? "pause" : "play_arrow"}
                  </span>
                </button>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-foreground text-sm">
                      check
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Selected Music Footer */}
      {selectedMusic && (
        <div className="border-t border-border p-4 bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-foreground">
                music_note
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {selectedMusic.track.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedMusic.track.artist} · {formatDuration(selectedMusic.startSeconds)} - {formatDuration(selectedMusic.endSeconds)}
              </p>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="p-2 hover:bg-muted rounded-full"
            >
              <span className="material-symbols-outlined text-muted-foreground">
                close
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
