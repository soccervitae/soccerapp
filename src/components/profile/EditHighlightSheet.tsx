import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserHighlight, HighlightImage, useAddHighlightImage, useDeleteHighlightImage, useReorderHighlightImages } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, X, GripVertical, Play, Film } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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

interface EditHighlightSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlight: UserHighlight | null;
}

interface SortableExistingMediaProps {
  image: HighlightImage;
  onRemove: () => void;
  isDeleting: boolean;
}

const SortableExistingMedia = ({ image, onRemove, isDeleting }: SortableExistingMediaProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isVideo = image.media_type === 'video';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-20 h-20 flex-shrink-0 group ${isDragging ? 'opacity-50 z-10' : ''}`}
    >
      {isVideo ? (
        <>
          <video
            src={image.image_url}
            className="w-full h-full object-cover rounded-lg border-2 border-border"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={image.image_url}
          alt="Highlight media"
          className="w-full h-full object-cover rounded-lg border-2 border-border"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={isDeleting}
        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
      >
        {isDeleting ? (
          <Loader2 className="w-3 h-3 text-destructive-foreground animate-spin" />
        ) : (
          <X className="w-3 h-3 text-destructive-foreground" />
        )}
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-1 right-1 w-5 h-5 rounded bg-background/80 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>
    </div>
  );
};

export const EditHighlightSheet = ({ open, onOpenChange, highlight }: EditHighlightSheetProps) => {
  const { user } = useAuth();
  const addHighlightImage = useAddHighlightImage();
  const deleteHighlightImage = useDeleteHighlightImage();
  const reorderHighlightImages = useReorderHighlightImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [localImages, setLocalImages] = useState<HighlightImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Sync local images with highlight prop
  useEffect(() => {
    if (highlight?.images) {
      setLocalImages([...highlight.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
    } else {
      setLocalImages([]);
    }
  }, [highlight]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !highlight || !user) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        
        try {
          const isVideo = file.type.startsWith('video/');
          const mediaType = isVideo ? 'video' : 'image';
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from("post-media")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("post-media")
            .getPublicUrl(fileName);

          await addHighlightImage.mutateAsync({
            highlightId: highlight.id,
            imageUrl: publicUrl,
            mediaType,
          });

          successCount++;
        } catch (err) {
          console.error("Error uploading file:", err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ${successCount === 1 ? 'mídia adicionada' : 'mídias adicionadas'}!`);
      }
      if (errorCount > 0) {
        toast.error(`Erro ao adicionar ${errorCount} ${errorCount === 1 ? 'mídia' : 'mídias'}`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      e.target.value = "";
    }
  };

  const handleRemoveMedia = async (imageId: string) => {
    if (!highlight) return;
    
    setDeletingIds(prev => new Set(prev).add(imageId));
    
    try {
      await deleteHighlightImage.mutateAsync(imageId);
      setLocalImages(prev => prev.filter(img => img.id !== imageId));
      toast.success("Mídia removida");
    } catch (error) {
      console.error("Error removing media:", error);
      toast.error("Erro ao remover mídia");
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && highlight) {
      const oldIndex = localImages.findIndex((m) => m.id === active.id);
      const newIndex = localImages.findIndex((m) => m.id === over.id);
      const newOrder = arrayMove(localImages, oldIndex, newIndex);
      
      setLocalImages(newOrder);
      
      try {
        await reorderHighlightImages.mutateAsync(
          newOrder.map((img, index) => ({ id: img.id, display_order: index }))
        );
      } catch (error) {
        console.error("Error reordering:", error);
        // Revert on error
        setLocalImages([...highlight.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      }
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!highlight) return null;

  const progressPercentage = uploadProgress.total > 0 
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100) 
    : 0;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar: {highlight.title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label>Fotos e Vídeos ({localImages.length}/10)</Label>
            
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localImages.map((m) => m.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {localImages.map((image) => (
                    <SortableExistingMedia
                      key={image.id}
                      image={image}
                      onRemove={() => handleRemoveMedia(image.id)}
                      isDeleting={deletingIds.has(image.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {localImages.length < 10 && (
                <label className="cursor-pointer flex-shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="w-20 h-20 rounded-lg bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors">
                    <Film className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Adicionar</span>
                  </div>
                </label>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Arraste para reordenar. O primeiro item será a capa.
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="flex flex-col gap-2 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Enviando {uploadProgress.current} de {uploadProgress.total}...
                </span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <Button 
            onClick={handleClose}
            className="w-full"
            disabled={isUploading}
          >
            Concluído
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
