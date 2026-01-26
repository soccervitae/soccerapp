import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, X, GripVertical, Pencil, Check, ChevronLeft, ChevronRight, ImagePlus, Images, Play, Film, Loader2, Eye, ImageOff } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { HighlightFullscreenView } from "./HighlightFullscreenView";
import { UserHighlight, HighlightImage, useDeleteHighlight, useReorderHighlights, useUpdateHighlight, useAddHighlightImage, useDeleteHighlightImage } from "@/hooks/useProfile";
import { useHighlightsNewViews } from "@/hooks/useHighlightInteractions";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateVideoThumbnailWithCache } from "@/hooks/useVideoThumbnail";
import { formatDuration } from "@/hooks/useVideoDuration";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useProfile } from "@/hooks/useProfile";


interface HighlightsSectionProps {
  highlights: UserHighlight[];
  isLoading?: boolean;
  isOwnProfile?: boolean;
  profileUsername?: string;
  profileAvatarUrl?: string;
}

interface SortableHighlightItemProps {
  highlight: UserHighlight;
  isOwnProfile: boolean;
  hasNewViews?: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

// Helper function to check unsupported formats
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

const SortableHighlightItem = ({ highlight, isOwnProfile, hasNewViews, onClick }: SortableHighlightItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: highlight.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const coverImage = highlight.images?.[0]?.image_url || highlight.image_url;
  const coverMediaType = highlight.images?.[0]?.media_type || 'image';
  const isVideo = coverMediaType === 'video' || isVideoUrl(coverImage);
  
  const [imageError, setImageError] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [duration, setDuration] = useState<string>("");
  const hasError = imageError || isUnsupportedFormat(coverImage);

  // Generate thumbnail and get duration for video covers (with caching)
  useEffect(() => {
    if (isVideo && coverImage && !hasError) {
      setIsLoadingThumbnail(true);
      
      // Use cached function that fetches both at once
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-none w-20 flex flex-col gap-2 items-center ${isDragging ? 'opacity-50 scale-105 z-10' : ''}`}
    >
      <div 
        className={`w-16 h-16 rounded-full p-[2px] cursor-pointer transition-colors group relative
          ${hasNewViews && isOwnProfile
            ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-pulse' 
            : 'bg-muted hover:bg-primary/30'
          }`}
        onClick={(e) => onClick(e)}
      >
        {hasError ? (
          <div 
            className="w-full h-full rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"
            aria-label={highlight.title}
          >
            <ImageOff className="w-5 h-5 text-muted-foreground/60" />
          </div>
        ) : isLoadingThumbnail ? (
          <div className="w-full h-full rounded-full border-2 border-background bg-muted flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        ) : displayImage ? (
          <div className="relative w-full h-full">
            <img
              src={displayImage}
              alt={highlight.title}
              className="w-full h-full rounded-full border-2 border-background object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full rounded-full border-2 border-background bg-muted flex items-center justify-center">
            <Film className="w-5 h-5 text-muted-foreground/60" />
          </div>
        )}
        {/* New views indicator */}
        {hasNewViews && isOwnProfile && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Eye className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
        {/* Drag handle - only show when no new views or on hover */}
        {isOwnProfile && !hasNewViews && (
          <div
            {...attributes}
            {...listeners}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
      </div>
      <span className="text-xs text-foreground/80 truncate w-full text-center font-medium">
        {highlight.title}
      </span>
    </div>
  );
};

export const HighlightsSection = ({ 
  highlights = [], 
  isLoading = false, 
  isOwnProfile = false,
  profileUsername,
  profileAvatarUrl,
}: HighlightsSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: currentUserProfile } = useProfile();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<UserHighlight | null>(null);
  const [selectedImageToDelete, setSelectedImageToDelete] = useState<HighlightImage | null>(null);
  const [localHighlights, setLocalHighlights] = useState<UserHighlight[]>([]);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [clickOrigin, setClickOrigin] = useState<DOMRect | null>(null);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [selectedHighlightForMedia, setSelectedHighlightForMedia] = useState<UserHighlight | null>(null);
  const addMediaInputRef = useRef<HTMLInputElement>(null);
  
  const deleteHighlight = useDeleteHighlight();
  const reorderHighlights = useReorderHighlights();
  const updateHighlight = useUpdateHighlight();
  const addHighlightImage = useAddHighlightImage();
  const deleteHighlightImage = useDeleteHighlightImage();
  
  // Fetch new views status for highlights (only for own profile)
  const displayHighlightsForViews = localHighlights.length > 0 ? localHighlights : highlights;
  const { data: newViewsMap = {} } = useHighlightsNewViews(displayHighlightsForViews, isOwnProfile);

  // Carousel for navigating between highlights
  const [highlightEmblaRef, highlightEmblaApi] = useEmblaCarousel({ 
    loop: false,
    startIndex: currentHighlightIndex,
  });

  // Carousel for navigating between images within a highlight
  const [imageEmblaRef, imageEmblaApi] = useEmblaCarousel({ 
    loop: false,
    startIndex: 0,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Sync local state with props
  const displayHighlights = localHighlights.length > 0 ? localHighlights : highlights;

  // Update selected highlight when navigating between highlights
  const onHighlightSelect = useCallback(() => {
    if (!highlightEmblaApi) return;
    const index = highlightEmblaApi.selectedScrollSnap();
    setCurrentHighlightIndex(index);
    if (displayHighlights[index]) {
      setSelectedHighlight(displayHighlights[index]);
      setCurrentImageIndex(0);
      imageEmblaApi?.scrollTo(0, true);
    }
    setIsEditingTitle(false);
  }, [highlightEmblaApi, displayHighlights, imageEmblaApi]);

  // Update current image index when navigating images
  const onImageSelect = useCallback(() => {
    if (!imageEmblaApi) return;
    const index = imageEmblaApi.selectedScrollSnap();
    setCurrentImageIndex(index);
  }, [imageEmblaApi]);

  useEffect(() => {
    if (!highlightEmblaApi) return;
    highlightEmblaApi.on("select", onHighlightSelect);
    return () => {
      highlightEmblaApi.off("select", onHighlightSelect);
    };
  }, [highlightEmblaApi, onHighlightSelect]);

  useEffect(() => {
    if (!imageEmblaApi) return;
    imageEmblaApi.on("select", onImageSelect);
    return () => {
      imageEmblaApi.off("select", onImageSelect);
    };
  }, [imageEmblaApi, onImageSelect]);

  // Scroll to selected index when dialog opens
  useEffect(() => {
    if (viewDialogOpen && highlightEmblaApi) {
      highlightEmblaApi.scrollTo(currentHighlightIndex, true);
    }
  }, [viewDialogOpen, highlightEmblaApi, currentHighlightIndex]);

  // Reset image carousel when highlight changes
  useEffect(() => {
    if (imageEmblaApi && viewDialogOpen) {
      imageEmblaApi.scrollTo(0, true);
      setCurrentImageIndex(0);
    }
  }, [selectedHighlight?.id, imageEmblaApi, viewDialogOpen]);

  const handleHighlightClick = (highlight: UserHighlight, e: React.MouseEvent<HTMLDivElement>) => {
    setClickOrigin(e.currentTarget.getBoundingClientRect());
    const index = displayHighlights.findIndex(h => h.id === highlight.id);
    setCurrentHighlightIndex(index >= 0 ? index : 0);
    setSelectedHighlight(highlight);
    setCurrentImageIndex(0);
    setViewDialogOpen(true);
    setIsEditingTitle(false);
  };

  const handleDelete = async () => {
    if (selectedHighlight) {
      await deleteHighlight.mutateAsync(selectedHighlight.id);
      setDeleteDialogOpen(false);
      setViewDialogOpen(false);
      setSelectedHighlight(null);
    }
  };

  const handleDeleteImage = async () => {
    if (selectedImageToDelete && selectedHighlight) {
      const images = selectedHighlight.images || [];
      
      // If it's the only image, delete the whole highlight
      if (images.length <= 1) {
        await handleDelete();
        return;
      }

      await deleteHighlightImage.mutateAsync(selectedImageToDelete.id);
      setDeleteImageDialogOpen(false);
      setSelectedImageToDelete(null);
      
      // Update local state to reflect deletion
      const updatedImages = images.filter(img => img.id !== selectedImageToDelete.id);
      setSelectedHighlight({
        ...selectedHighlight,
        images: updatedImages,
      });
      
      // Adjust image index if needed
      if (currentImageIndex >= updatedImages.length) {
        setCurrentImageIndex(Math.max(0, updatedImages.length - 1));
      }
    }
  };

  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHighlight || !user) return;

    setIsAddingImage(true);
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(fileName);

      await addHighlightImage.mutateAsync({
        highlightId: selectedHighlight.id,
        imageUrl: publicUrl,
        mediaType,
      });

      // Update local state
      const newImage: HighlightImage = {
        id: `temp-${Date.now()}`,
        highlight_id: selectedHighlight.id,
        image_url: publicUrl,
        media_type: mediaType,
        display_order: (selectedHighlight.images?.length || 0),
        created_at: new Date().toISOString(),
      };

      setSelectedHighlight({
        ...selectedHighlight,
        images: [...(selectedHighlight.images || []), newImage],
      });

      toast.success(isVideo ? "Vídeo adicionado!" : "Foto adicionada!");
    } catch (error) {
      console.error("Error adding media:", error);
      toast.error("Erro ao adicionar mídia");
    } finally {
      setIsAddingImage(false);
      e.target.value = "";
    }
  };

  // Handle adding media to an existing highlight from the selection sheet
  const handleAddMediaToExistingHighlight = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHighlightForMedia || !user) return;

    setIsAddingImage(true);
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(fileName);

      await addHighlightImage.mutateAsync({
        highlightId: selectedHighlightForMedia.id,
        imageUrl: publicUrl,
        mediaType,
      });

      toast.success(isVideo ? "Vídeo adicionado ao destaque!" : "Foto adicionada ao destaque!");
    } catch (error) {
      console.error("Error adding media:", error);
      toast.error("Erro ao adicionar mídia");
    } finally {
      setIsAddingImage(false);
      setSelectedHighlightForMedia(null);
      e.target.value = "";
    }
  };

  const handleSelectExistingHighlight = (highlight: UserHighlight) => {
    setSelectedHighlightForMedia(highlight);
    // Trigger file input
    setTimeout(() => {
      addMediaInputRef.current?.click();
    }, 100);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayHighlights.findIndex((h) => h.id === active.id);
      const newIndex = displayHighlights.findIndex((h) => h.id === over.id);

      const newOrder = arrayMove(displayHighlights, oldIndex, newIndex);
      setLocalHighlights(newOrder);

      // Update the order in the database
      const updates = newOrder.map((h, index) => ({
        id: h.id,
        display_order: index,
      }));

      reorderHighlights.mutate(updates, {
        onSuccess: () => {
          setLocalHighlights([]);
        },
        onError: () => {
          setLocalHighlights([]);
        },
      });
    }
  };

  const handlePrevHighlight = () => {
    highlightEmblaApi?.scrollPrev();
  };

  const handleNextHighlight = () => {
    highlightEmblaApi?.scrollNext();
  };

  const handlePrevImage = () => {
    imageEmblaApi?.scrollPrev();
  };

  const handleNextImage = () => {
    imageEmblaApi?.scrollNext();
  };

  const handleTitleClick = () => {
    if (isOwnProfile && selectedHighlight) {
      setEditedTitle(selectedHighlight.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (selectedHighlight && editedTitle.trim()) {
      updateHighlight.mutate(
        { id: selectedHighlight.id, title: editedTitle.trim() },
        {
          onSuccess: () => {
            setSelectedHighlight({ ...selectedHighlight, title: editedTitle.trim() });
            setIsEditingTitle(false);
          },
        }
      );
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const getCurrentImages = (): HighlightImage[] => {
    if (!selectedHighlight) return [];
    if (selectedHighlight.images && selectedHighlight.images.length > 0) {
      return selectedHighlight.images;
    }
    // Fallback for highlights without images array
    return [{
      id: selectedHighlight.id,
      highlight_id: selectedHighlight.id,
      image_url: selectedHighlight.image_url,
      media_type: 'image',
      display_order: 0,
      created_at: selectedHighlight.created_at,
    }];
  };

  if (isLoading) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Destaques</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-none w-20 flex flex-col gap-2 items-center">
              <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
              <div className="w-12 h-3 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const hasHighlights = displayHighlights.length > 0;
  const canAddMore = displayHighlights.length < 10;

  // Admin users (except official account) cannot add highlights from public profile
  const isOfficialAccount = currentUserProfile?.is_official_account === true;
  const canAddHighlights = isOwnProfile && canAddMore && (!isAdmin || isOfficialAccount);

  if (!hasHighlights && !isOwnProfile) {
    return null;
  }

  const highlightItems = displayHighlights.map((highlight) => (
    <SortableHighlightItem
      key={highlight.id}
      highlight={highlight}
      isOwnProfile={isOwnProfile}
      hasNewViews={newViewsMap[highlight.id] || false}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => handleHighlightClick(highlight, e)}
    />
  ));

  const currentImages = getCurrentImages();

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground mb-3">Destaques</h3>
      
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {canAddHighlights && (
          <div 
            className="flex-none w-20 flex flex-col gap-2 items-center cursor-pointer"
            onClick={() => navigate("/create-highlight")}
          >
            <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center hover:bg-muted/80 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground truncate w-full text-center font-medium">
              Adicionar
            </span>
          </div>
        )}

        {isOwnProfile ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayHighlights.map((h) => h.id)}
              strategy={horizontalListSortingStrategy}
            >
              {highlightItems}
            </SortableContext>
          </DndContext>
        ) : (
          highlightItems
        )}
      </div>

      {/* Hidden input for adding media to existing highlight */}
      <input
        ref={addMediaInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleAddMediaToExistingHighlight}
      />

      {/* Fullscreen View - Story-like with animation and swipe-to-close */}
      <HighlightFullscreenView
        viewDialogOpen={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setIsEditingTitle(false);
        }}
        clickOrigin={clickOrigin}
        currentImages={currentImages}
        currentImageIndex={currentImageIndex}
        currentHighlightIndex={currentHighlightIndex}
        displayHighlights={displayHighlights}
        selectedHighlight={selectedHighlight}
        isOwnProfile={isOwnProfile}
        isEditingTitle={isEditingTitle}
        editedTitle={editedTitle}
        setEditedTitle={setEditedTitle}
        handleTitleKeyDown={handleTitleKeyDown}
        handleTitleSave={handleTitleSave}
        updateHighlight={updateHighlight}
        handleTitleClick={handleTitleClick}
        setDeleteDialogOpen={setDeleteDialogOpen}
        imageEmblaRef={imageEmblaRef}
        imageEmblaApi={imageEmblaApi}
        highlightEmblaApi={highlightEmblaApi}
        handlePrevHighlight={handlePrevHighlight}
        handleNextHighlight={handleNextHighlight}
        setSelectedImageToDelete={setSelectedImageToDelete}
        setDeleteImageDialogOpen={setDeleteImageDialogOpen}
        profileUsername={profileUsername}
        authorAvatarUrl={profileAvatarUrl}
      />

      {/* Delete Highlight Confirmation Sheet */}
      <ResponsiveAlertModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remover destaque?"
        description={`O destaque "${selectedHighlight?.title}" e todas as suas imagens serão removidos permanentemente.`}
        cancelText="Cancelar"
        confirmText="Remover"
        onConfirm={handleDelete}
        confirmVariant="destructive"
        zIndex={70}
      />

      {/* Delete Image Confirmation Sheet */}
      <ResponsiveAlertModal
        open={deleteImageDialogOpen}
        onOpenChange={setDeleteImageDialogOpen}
        title="Remover imagem?"
        description={currentImages.length <= 1 
          ? "Esta é a única imagem do destaque. Remover ela irá deletar o destaque inteiro."
          : "Esta imagem será removida do destaque."}
        cancelText="Cancelar"
        confirmText="Remover"
        onConfirm={handleDeleteImage}
        confirmVariant="destructive"
        zIndex={70}
      />
    </section>
  );
};