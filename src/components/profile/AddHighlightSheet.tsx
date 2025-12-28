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
import { Loader2, ImagePlus, X, GripVertical } from "lucide-react";
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

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

const SortableImage = ({ 
  image, 
  onRemove 
}: { 
  image: ImagePreview; 
  onRemove: () => void;
}) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-20 h-20 flex-shrink-0 group ${isDragging ? 'opacity-50 z-10' : ''}`}
    >
      <img
        src={image.preview}
        alt="Preview"
        className="w-full h-full object-cover rounded-lg border-2 border-border"
      />
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
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
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

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.findIndex((img) => img.id === active.id);
        const newIndex = prev.findIndex((img) => img.id === over.id);
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

    if (images.length === 0) {
      toast.error("Selecione pelo menos uma imagem");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsUploading(true);

    try {
      // Upload all images
      const uploadedUrls: string[] = [];
      
      for (const image of images) {
        const fileExt = image.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(fileName, image.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("post-media")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Add highlight with all image URLs
      await addHighlight.mutateAsync({
        title: title.trim(),
        image_url: uploadedUrls[0], // First image as cover
        image_urls: uploadedUrls,
      });

      // Reset form and close
      setTitle("");
      setImages([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding highlight:", error);
      toast.error("Erro ao adicionar destaque");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setImages([]);
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
            <Label>Imagens ({images.length}/10)</Label>
            
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {images.map((image) => (
                    <SortableImage
                      key={image.id}
                      image={image}
                      onRemove={() => handleRemoveImage(image.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {images.length < 10 && (
                <label className="cursor-pointer flex-shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="hidden"
                  />
                  <div className="w-20 h-20 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center hover:bg-muted/80 transition-colors">
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </div>
                </label>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Arraste para reordenar. A primeira imagem será a capa.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isUploading || !title.trim() || images.length === 0}
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