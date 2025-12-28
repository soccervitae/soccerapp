import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, X, GripVertical, Pencil, Check, ChevronLeft, ChevronRight, ImagePlus, Images } from "lucide-react";
import { AddHighlightSheet } from "./AddHighlightSheet";
import { UserHighlight, HighlightImage, useDeleteHighlight, useReorderHighlights, useUpdateHighlight, useAddHighlightImage, useDeleteHighlightImage } from "@/hooks/useProfile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";

interface HighlightsSectionProps {
  highlights: UserHighlight[];
  isLoading?: boolean;
  isOwnProfile?: boolean;
}

interface SortableHighlightItemProps {
  highlight: UserHighlight;
  isOwnProfile: boolean;
  onClick: () => void;
}

const SortableHighlightItem = ({ highlight, isOwnProfile, onClick }: SortableHighlightItemProps) => {
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

  const imageCount = highlight.images?.length || 1;
  const coverImage = highlight.images?.[0]?.image_url || highlight.image_url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-none w-20 flex flex-col gap-2 items-center ${isDragging ? 'opacity-50 scale-105 z-10' : ''}`}
    >
      <div 
        className={`w-16 h-16 rounded-full p-[2px] bg-muted cursor-pointer hover:bg-primary/30 transition-colors group relative`}
        onClick={onClick}
      >
        <div 
          className="w-full h-full rounded-full bg-cover bg-center border-2 border-background"
          style={{ backgroundImage: `url('${coverImage}')` }}
          aria-label={highlight.title}
        />
        {imageCount > 1 && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            {imageCount}
          </div>
        )}
        {isOwnProfile && (
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
  isOwnProfile = false 
}: HighlightsSectionProps) => {
  const { user } = useAuth();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
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
  const [isAddingImage, setIsAddingImage] = useState(false);
  
  const deleteHighlight = useDeleteHighlight();
  const reorderHighlights = useReorderHighlights();
  const updateHighlight = useUpdateHighlight();
  const addHighlightImage = useAddHighlightImage();
  const deleteHighlightImage = useDeleteHighlightImage();

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

  const handleHighlightClick = (highlight: UserHighlight) => {
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

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHighlight || !user) return;

    setIsAddingImage(true);

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
      });

      // Update local state
      const newImage: HighlightImage = {
        id: `temp-${Date.now()}`,
        highlight_id: selectedHighlight.id,
        image_url: publicUrl,
        display_order: (selectedHighlight.images?.length || 0),
        created_at: new Date().toISOString(),
      };

      setSelectedHighlight({
        ...selectedHighlight,
        images: [...(selectedHighlight.images || []), newImage],
      });

      toast.success("Imagem adicionada!");
    } catch (error) {
      console.error("Error adding image:", error);
      toast.error("Erro ao adicionar imagem");
    } finally {
      setIsAddingImage(false);
      e.target.value = "";
    }
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

  if (!hasHighlights && !isOwnProfile) {
    return null;
  }

  const highlightItems = displayHighlights.map((highlight) => (
    <SortableHighlightItem
      key={highlight.id}
      highlight={highlight}
      isOwnProfile={isOwnProfile}
      onClick={() => handleHighlightClick(highlight)}
    />
  ));

  const currentImages = getCurrentImages();

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground mb-3">Destaques</h3>
      
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {isOwnProfile && canAddMore && (
          <div 
            className="flex-none w-20 flex flex-col gap-2 items-center cursor-pointer"
            onClick={() => setAddSheetOpen(true)}
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

      <AddHighlightSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />

      {/* Fullscreen View Dialog - Story-like */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        setViewDialogOpen(open);
        if (!open) setIsEditingTitle(false);
      }}>
        <DialogContent className="max-w-md w-full h-[100dvh] max-h-[100dvh] p-0 border-0 bg-black rounded-none sm:rounded-2xl sm:h-[90vh] sm:max-h-[800px]">
          <div className="relative w-full h-full flex flex-col overflow-hidden">
            {/* Progress bars for images */}
            {currentImages.length > 1 && (
              <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-4">
                {currentImages.map((_, index) => (
                  <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-200"
                      style={{ 
                        width: index < currentImageIndex ? '100%' : index === currentImageIndex ? '100%' : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Header */}
            <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-400">
                  <div 
                    className="w-full h-full rounded-full border-2 border-black bg-cover bg-center"
                    style={{ backgroundImage: `url('${selectedHighlight?.image_url}')` }}
                  />
                </div>
                <div>
                  {isEditingTitle && isOwnProfile ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        className="text-sm font-semibold max-w-[150px] h-7 bg-white/10 border-white/20 text-white"
                        autoFocus
                      />
                      <button
                        onClick={handleTitleSave}
                        disabled={updateHighlight.isPending}
                        className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleTitleClick}
                      className={`flex items-center gap-1 group ${isOwnProfile ? 'cursor-pointer' : 'cursor-default'}`}
                      disabled={!isOwnProfile}
                    >
                      <p className="text-white text-sm font-semibold">{selectedHighlight?.title}</p>
                      {isOwnProfile && (
                        <Pencil className="w-3 h-3 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  )}
                  <p className="text-white/60 text-xs">
                    {currentImages.length > 1 && `${currentImageIndex + 1}/${currentImages.length} • `}
                    {currentHighlightIndex + 1}/{displayHighlights.length} destaques
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isOwnProfile && (
                  <button 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setViewDialogOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Display */}
            <div className="flex-1 flex items-center justify-center bg-black relative">
              {currentImages[currentImageIndex] && (
                <img
                  src={currentImages[currentImageIndex].image_url}
                  alt={selectedHighlight?.title || 'Destaque'}
                  className="w-full h-full object-contain transition-all duration-300 ease-out"
                />
              )}
            </div>

            {/* Navigation areas (invisible touch zones) */}
            <div className="absolute inset-0 flex z-10">
              <button 
                onClick={() => {
                  if (currentImageIndex > 0) {
                    imageEmblaApi?.scrollPrev();
                    setCurrentImageIndex(prev => prev - 1);
                  } else if (currentHighlightIndex > 0) {
                    handlePrevHighlight();
                  }
                }}
                className="w-1/3 h-full focus:outline-none"
                aria-label="Anterior"
              />
              <div className="w-1/3" />
              <button 
                onClick={() => {
                  if (currentImageIndex < currentImages.length - 1) {
                    imageEmblaApi?.scrollNext();
                    setCurrentImageIndex(prev => prev + 1);
                  } else if (currentHighlightIndex < displayHighlights.length - 1) {
                    handleNextHighlight();
                  } else {
                    setViewDialogOpen(false);
                  }
                }}
                className="w-1/3 h-full focus:outline-none"
                aria-label="Próximo"
              />
            </div>

            {/* Footer with gradient */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-gradient-to-t from-black/60 to-transparent">
              {isOwnProfile ? (
                // Owner footer: action buttons
                <div className="flex items-center justify-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAddImage}
                      className="hidden"
                      disabled={isAddingImage}
                    />
                    <span className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors cursor-pointer">
                      {isAddingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ImagePlus className="w-5 h-5" />
                      )}
                      <span className="text-sm font-medium">Adicionar foto</span>
                    </span>
                  </label>
                  {currentImages.length > 1 && (
                    <button 
                      onClick={() => {
                        setSelectedImageToDelete(currentImages[currentImageIndex]);
                        setDeleteImageDialogOpen(true);
                      }}
                      className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                      <span className="text-sm font-medium">Remover foto</span>
                    </button>
                  )}
                </div>
              ) : (
                // Visitor footer: highlight dots
                <div className="flex justify-center">
                  {displayHighlights.length > 1 && (
                    <div className="flex gap-2">
                      {displayHighlights.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => highlightEmblaApi?.scrollTo(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentHighlightIndex ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Highlight dots for owner too */}
            {isOwnProfile && displayHighlights.length > 1 && (
              <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center">
                <div className="flex gap-2">
                  {displayHighlights.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => highlightEmblaApi?.scrollTo(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentHighlightIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Highlight Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover destaque?</AlertDialogTitle>
            <AlertDialogDescription>
              O destaque "{selectedHighlight?.title}" e todas as suas imagens serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog open={deleteImageDialogOpen} onOpenChange={setDeleteImageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentImages.length <= 1 
                ? "Esta é a única imagem do destaque. Remover ela irá deletar o destaque inteiro."
                : "Esta imagem será removida do destaque."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};