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
      </div>

      <AddHighlightSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />

      {/* Fullscreen View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        setViewDialogOpen(open);
        if (!open) setIsEditingTitle(false);
      }}>
        <DialogContent className="max-w-lg p-0 bg-background/95 backdrop-blur-sm border-none">
          <div className="relative flex flex-col items-center">
            {/* Header with counter and close button */}
            <div className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentHighlightIndex + 1} / {displayHighlights.length}
                </span>
                {currentImages.length > 1 && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {currentImageIndex + 1}/{currentImages.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewDialogOpen(false)}
                className="p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Navigation arrows for highlights */}
            {displayHighlights.length > 1 && (
              <>
                <button
                  onClick={handlePrevHighlight}
                  disabled={currentHighlightIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={handleNextHighlight}
                  disabled={currentHighlightIndex === displayHighlights.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </>
            )}
            
            {/* Highlight Carousel (outer) */}
            <div className="w-full overflow-hidden" ref={highlightEmblaRef}>
              <div className="flex">
                {displayHighlights.map((highlight) => {
                  const images = highlight.images && highlight.images.length > 0 
                    ? highlight.images 
                    : [{ id: highlight.id, image_url: highlight.image_url, highlight_id: highlight.id, display_order: 0, created_at: highlight.created_at }];
                  
                  return (
                    <div key={highlight.id} className="flex-[0_0_100%] min-w-0 flex flex-col items-center px-6">
                      {/* Image Carousel (inner) */}
                      <div className="relative w-full max-w-[280px]">
                        <div className="overflow-hidden rounded-2xl" ref={highlight.id === selectedHighlight?.id ? imageEmblaRef : undefined}>
                          <div className="flex">
                            {images.map((image) => (
                              <div key={image.id} className="flex-[0_0_100%] min-w-0">
                                <div className="aspect-square relative">
                                  <img
                                    src={image.image_url}
                                    alt={highlight.title}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* Delete image button */}
                                  {isOwnProfile && images.length > 0 && highlight.id === selectedHighlight?.id && (
                                    <button
                                      onClick={() => {
                                        setSelectedImageToDelete(image);
                                        setDeleteImageDialogOpen(true);
                                      }}
                                      className="absolute top-2 right-2 p-2 rounded-full bg-destructive/80 hover:bg-destructive transition-colors"
                                    >
                                      <X className="w-4 h-4 text-destructive-foreground" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Image navigation arrows */}
                        {images.length > 1 && highlight.id === selectedHighlight?.id && (
                          <>
                            <button
                              onClick={handlePrevImage}
                              disabled={currentImageIndex === 0}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="w-4 h-4 text-foreground" />
                            </button>
                            <button
                              onClick={handleNextImage}
                              disabled={currentImageIndex === images.length - 1}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="w-4 h-4 text-foreground" />
                            </button>
                          </>
                        )}

                        {/* Image dots */}
                        {images.length > 1 && highlight.id === selectedHighlight?.id && (
                          <div className="flex gap-1 justify-center mt-2">
                            {images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => imageEmblaApi?.scrollTo(index)}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  index === currentImageIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Title - editable for own profile */}
            <div className="mt-4 px-6 w-full flex justify-center">
              {isEditingTitle && isOwnProfile ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="text-center text-lg font-semibold max-w-[200px]"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleTitleSave}
                    disabled={updateHighlight.isPending}
                  >
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={handleTitleClick}
                  className={`flex items-center gap-2 group ${isOwnProfile ? 'cursor-pointer hover:text-primary' : 'cursor-default'}`}
                  disabled={!isOwnProfile}
                >
                  <h3 className="text-xl font-semibold text-foreground transition-colors">
                    {selectedHighlight?.title}
                  </h3>
                  {isOwnProfile && (
                    <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              )}
            </div>
            
            {/* Action buttons */}
            {isOwnProfile && (
              <div className="flex gap-2 mt-4 mb-6">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImage}
                    className="hidden"
                    disabled={isAddingImage}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isAddingImage}
                    asChild
                  >
                    <span>
                      {isAddingImage ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4 mr-2" />
                      )}
                      Adicionar foto
                    </span>
                  </Button>
                </label>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover destaque
                </Button>
              </div>
            )}

            {/* Highlight dots indicator */}
            {displayHighlights.length > 1 && (
              <div className="flex gap-1.5 pb-4">
                {displayHighlights.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => highlightEmblaApi?.scrollTo(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentHighlightIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
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