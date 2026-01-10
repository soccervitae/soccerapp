import { useState, useEffect, useCallback } from "react";
import { Play, ChevronLeft, ChevronRight, ImageOff, Loader2, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HighlightFullscreenView } from "./HighlightFullscreenView";
import { UserHighlight, HighlightImage } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import useEmblaCarousel from "embla-carousel-react";
import { generateVideoThumbnailWithCache } from "@/hooks/useVideoThumbnail";
import { formatDuration } from "@/hooks/useVideoDuration";

interface OfficialHighlightsSectionProps {
  highlights: UserHighlight[];
  isLoading?: boolean;
  profileUsername?: string;
  profileAvatarUrl?: string;
}

const UNSUPPORTED_FORMATS = ['.dng', '.raw', '.cr2', '.nef', '.arw', '.orf', '.rw2'];
const isUnsupportedFormat = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return UNSUPPORTED_FORMATS.some(ext => lowerUrl.endsWith(ext));
};

const isVideoUrl = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || 
         lowerUrl.includes('.mov') || 
         lowerUrl.includes('.webm') || 
         lowerUrl.includes('.avi') ||
         lowerUrl.includes('video');
};

interface HighlightCardProps {
  highlight: UserHighlight;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const HighlightCard = ({ highlight, onClick }: HighlightCardProps) => {
  const coverImage = highlight.images?.[0]?.image_url || highlight.image_url;
  const coverMediaType = highlight.images?.[0]?.media_type || 'image';
  const isVideo = coverMediaType === 'video' || isVideoUrl(coverImage);
  
  const [imageError, setImageError] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [duration, setDuration] = useState<string>("");
  const hasError = imageError || isUnsupportedFormat(coverImage);

  useEffect(() => {
    if (isVideo && coverImage && !hasError) {
      setIsLoadingThumbnail(true);
      generateVideoThumbnailWithCache(coverImage, 1).then((result) => {
        if (result.thumbnail) {
          setThumbnailUrl(result.thumbnail);
        }
        if (result.duration) {
          setDuration(formatDuration(result.duration));
        }
        setIsLoadingThumbnail(false);
      });
    }
  }, [isVideo, coverImage, hasError]);

  const displayImage = isVideo ? (thumbnailUrl || null) : coverImage;
  const mediaCount = highlight.images?.length || 1;

  return (
    <motion.div
      className="flex-none w-44 cursor-pointer group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg">
        {hasError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-8 h-8 text-muted-foreground/60" />
          </div>
        ) : isLoadingThumbnail ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : displayImage ? (
          <img
            src={displayImage}
            alt={highlight.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Film className="w-8 h-8 text-muted-foreground/60" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Play icon for videos */}
        {isVideo && !hasError && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        )}
        
        {/* Media count badge */}
        {mediaCount > 1 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-white text-[14px]">photo_library</span>
            <span className="text-white text-xs font-medium">{mediaCount}</span>
          </div>
        )}
        
        {/* Duration badge */}
        {isVideo && duration && (
          <div className="absolute bottom-12 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            <span className="text-white text-xs font-medium">{duration}</span>
          </div>
        )}
        
        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg">
            {highlight.title}
          </h3>
        </div>
        
        {/* Premium border glow effect */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-primary/30 transition-all" />
      </div>
    </motion.div>
  );
};

export const OfficialHighlightsSection = ({ 
  highlights = [], 
  isLoading = false,
  profileUsername,
  profileAvatarUrl,
}: OfficialHighlightsSectionProps) => {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<UserHighlight | null>(null);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [clickOrigin, setClickOrigin] = useState<DOMRect | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  // Image carousel for fullscreen view
  const [imageEmblaRef, imageEmblaApi] = useEmblaCarousel({ 
    loop: false,
    startIndex: 0,
  });

  // Highlight carousel for fullscreen view
  const [highlightEmblaRef, highlightEmblaApi] = useEmblaCarousel({ 
    loop: false,
    startIndex: currentHighlightIndex,
  });

  useEffect(() => {
    if (!emblaApi) return;
    
    const updateScrollButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', updateScrollButtons);
    emblaApi.on('reInit', updateScrollButtons);
    updateScrollButtons();

    return () => {
      emblaApi.off('select', updateScrollButtons);
      emblaApi.off('reInit', updateScrollButtons);
    };
  }, [emblaApi]);

  const onImageSelect = useCallback(() => {
    if (!imageEmblaApi) return;
    const index = imageEmblaApi.selectedScrollSnap();
    setCurrentImageIndex(index);
  }, [imageEmblaApi]);

  useEffect(() => {
    if (!imageEmblaApi) return;
    imageEmblaApi.on("select", onImageSelect);
    return () => {
      imageEmblaApi.off("select", onImageSelect);
    };
  }, [imageEmblaApi, onImageSelect]);

  const handleHighlightClick = (highlight: UserHighlight, e: React.MouseEvent<HTMLDivElement>) => {
    setClickOrigin(e.currentTarget.getBoundingClientRect());
    const index = highlights.findIndex(h => h.id === highlight.id);
    setCurrentHighlightIndex(index >= 0 ? index : 0);
    setSelectedHighlight(highlight);
    setCurrentImageIndex(0);
    setViewDialogOpen(true);
  };

  const handlePrevHighlight = () => {
    if (currentHighlightIndex > 0) {
      const newIndex = currentHighlightIndex - 1;
      setCurrentHighlightIndex(newIndex);
      setSelectedHighlight(highlights[newIndex]);
      setCurrentImageIndex(0);
      imageEmblaApi?.scrollTo(0, true);
    }
  };

  const handleNextHighlight = () => {
    if (currentHighlightIndex < highlights.length - 1) {
      const newIndex = currentHighlightIndex + 1;
      setCurrentHighlightIndex(newIndex);
      setSelectedHighlight(highlights[newIndex]);
      setCurrentImageIndex(0);
      imageEmblaApi?.scrollTo(0, true);
    }
  };

  const currentImages: HighlightImage[] = selectedHighlight?.images || 
    (selectedHighlight ? [{
      id: selectedHighlight.id,
      highlight_id: selectedHighlight.id,
      image_url: selectedHighlight.image_url,
      media_type: 'image',
      display_order: 0,
      created_at: selectedHighlight.created_at || '',
    }] : []);

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3 px-4">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex gap-3 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="flex-none w-44 aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
            <h2 className="text-base font-semibold text-foreground">Destaques</h2>
          </div>
          {highlights.length > 2 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-3 px-4">
            {highlights.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                highlight={highlight}
                onClick={(e) => handleHighlightClick(highlight, e)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {viewDialogOpen && selectedHighlight && (
          <HighlightFullscreenView
            viewDialogOpen={viewDialogOpen}
            onClose={() => setViewDialogOpen(false)}
            clickOrigin={clickOrigin}
            currentImages={currentImages}
            currentImageIndex={currentImageIndex}
            currentHighlightIndex={currentHighlightIndex}
            displayHighlights={highlights}
            selectedHighlight={selectedHighlight}
            isOwnProfile={false}
            isEditingTitle={false}
            editedTitle=""
            setEditedTitle={() => {}}
            handleTitleKeyDown={() => {}}
            handleTitleSave={() => {}}
            updateHighlight={{ isPending: false }}
            handleTitleClick={() => {}}
            setDeleteDialogOpen={() => {}}
            imageEmblaRef={imageEmblaRef}
            imageEmblaApi={imageEmblaApi}
            highlightEmblaApi={highlightEmblaApi}
            handlePrevHighlight={handlePrevHighlight}
            handleNextHighlight={handleNextHighlight}
            setSelectedImageToDelete={() => {}}
            setDeleteImageDialogOpen={() => {}}
            profileUsername={profileUsername}
            authorAvatarUrl={profileAvatarUrl}
          />
        )}
      </AnimatePresence>
    </>
  );
};
