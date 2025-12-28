import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, X, GripVertical, Pencil, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { AddHighlightSheet } from "./AddHighlightSheet";
import { UserHighlight, useDeleteHighlight, useReorderHighlights, useUpdateHighlight } from "@/hooks/useProfile";
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
          style={{ backgroundImage: `url('${highlight.image_url}')` }}
          aria-label={highlight.title}
        />
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
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<UserHighlight | null>(null);
  const [localHighlights, setLocalHighlights] = useState<UserHighlight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  
  const deleteHighlight = useDeleteHighlight();
  const reorderHighlights = useReorderHighlights();
  const updateHighlight = useUpdateHighlight();

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    startIndex: currentIndex,
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

  // Update selected highlight when navigating
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setCurrentIndex(index);
    if (displayHighlights[index]) {
      setSelectedHighlight(displayHighlights[index]);
    }
    setIsEditingTitle(false);
  }, [emblaApi, displayHighlights]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Scroll to selected index when dialog opens
  useEffect(() => {
    if (viewDialogOpen && emblaApi) {
      emblaApi.scrollTo(currentIndex, true);
    }
  }, [viewDialogOpen, emblaApi, currentIndex]);

  const handleHighlightClick = (highlight: UserHighlight) => {
    const index = displayHighlights.findIndex(h => h.id === highlight.id);
    setCurrentIndex(index >= 0 ? index : 0);
    setSelectedHighlight(highlight);
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

  const handlePrev = () => {
    emblaApi?.scrollPrev();
  };

  const handleNext = () => {
    emblaApi?.scrollNext();
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

      {/* Fullscreen View Dialog with Carousel */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        setViewDialogOpen(open);
        if (!open) setIsEditingTitle(false);
      }}>
        <DialogContent className="max-w-lg p-0 bg-background/95 backdrop-blur-sm border-none">
          <div className="relative flex flex-col items-center">
            {/* Header with counter and close button */}
            <div className="w-full flex items-center justify-between p-4">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {displayHighlights.length}
              </span>
              <button
                onClick={() => setViewDialogOpen(false)}
                className="p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Navigation arrows */}
            {displayHighlights.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === displayHighlights.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </>
            )}
            
            {/* Carousel */}
            <div className="w-full overflow-hidden px-6" ref={emblaRef}>
              <div className="flex">
                {displayHighlights.map((highlight) => (
                  <div key={highlight.id} className="flex-[0_0_100%] min-w-0 flex flex-col items-center">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                      <img
                        src={highlight.image_url}
                        alt={highlight.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
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
            
            {/* Delete button */}
            {isOwnProfile && (
              <Button
                variant="destructive"
                size="sm"
                className="mt-6 mb-6"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover destaque
              </Button>
            )}

            {/* Dots indicator */}
            {displayHighlights.length > 1 && (
              <div className="flex gap-1.5 pb-4">
                {displayHighlights.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover destaque?</AlertDialogTitle>
            <AlertDialogDescription>
              O destaque "{selectedHighlight?.title}" será removido permanentemente.
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
    </section>
  );
};
