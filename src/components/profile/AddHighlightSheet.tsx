import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddHighlight } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ImagePlus, X, GripVertical, Play, Film } from "lucide-react";
import { useImageCompression } from "@/hooks/useImageCompression";
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

interface AddHighlightSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MediaPreview {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const SortableMedia = ({ 
  media, 
  onRemove 
}: { 
  media: MediaPreview; 
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-20 h-20 flex-shrink-0 group ${isDragging ? 'opacity-50 z-10' : ''}`}
    >
      {media.type === 'video' ? (
        <>
          <video
            src={media.preview}
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
          src={media.preview}
          alt="Preview"
          className="w-full h-full object-cover rounded-lg border-2 border-border"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3 text-destructive-foreground" />
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

export const AddHighlightSheet = ({ open, onOpenChange }: AddHighlightSheetProps) => {
  const { user } = useAuth();
  const addHighlight = useAddHighlight();
  const { compressImage } = useImageCompression();
  const [title, setTitle] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo) {
        // For videos, create URL directly
        const preview = URL.createObjectURL(file);
        setMediaItems((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview,
            type: 'video',
          },
        ]);
      } else {
        // For images, use FileReader
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaItems((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file,
              preview: reader.result as string,
              type: 'image',
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset input
    e.target.value = "";
  };

  const handleRemoveMedia = (id: string) => {
    const item = mediaItems.find(m => m.id === id);
    if (item?.type === 'video') {
      URL.revokeObjectURL(item.preview);
    }
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMediaItems((prev) => {
        const oldIndex = prev.findIndex((m) => m.id === active.id);
        const newIndex = prev.findIndex((m) => m.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Digite um título para o destaque");
      return;
    }

    if (mediaItems.length === 0) {
      toast.error("Selecione pelo menos uma foto ou vídeo");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsUploading(true);

    try {
      // Upload all media
      const uploadedItems: Array<{ url: string; type: 'image' | 'video' }> = [];
      
      for (const item of mediaItems) {
        const fileExt = item.type === 'image' ? 'jpg' : item.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        // Compress images before upload
        let fileToUpload: Blob = item.file;
        if (item.type === 'image') {
          fileToUpload = await compressImage(item.file);
        }
        
        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(fileName, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("post-media")
          .getPublicUrl(fileName);

        uploadedItems.push({ url: publicUrl, type: item.type });
      }

      // Add highlight with all media URLs
      await addHighlight.mutateAsync({
        title: title.trim(),
        image_url: uploadedItems[0].url, // First item as cover
        media_items: uploadedItems,
      });

      // Cleanup video URLs
      mediaItems.forEach(item => {
        if (item.type === 'video') {
          URL.revokeObjectURL(item.preview);
        }
      });

      // Reset form and close
      setTitle("");
      setMediaItems([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding highlight:", error);
      toast.error("Erro ao adicionar destaque");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Cleanup video URLs
    mediaItems.forEach(item => {
      if (item.type === 'video') {
        URL.revokeObjectURL(item.preview);
      }
    });
    setTitle("");
    setMediaItems([]);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adicionar Destaque</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Gols, Treinos, Prêmios..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Fotos e Vídeos ({mediaItems.length}/10)</Label>
            
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={mediaItems.map((m) => m.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {mediaItems.map((media) => (
                    <SortableMedia
                      key={media.id}
                      media={media}
                      onRemove={() => handleRemoveMedia(media.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {mediaItems.length < 10 && (
                <label className="cursor-pointer flex-shrink-0">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                  <div className="w-20 h-20 rounded-lg bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors">
                    <Film className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Mídia</span>
                  </div>
                </label>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Arraste para reordenar. O primeiro item será a capa.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isUploading || !title.trim() || mediaItems.length === 0}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Destaque"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};