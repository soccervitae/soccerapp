import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAddHighlight, useUserHighlights, UserHighlight, HighlightImage, useAddHighlightImage, useDeleteHighlightImage, useReorderHighlightImages, useUpdateHighlight } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, X, GripVertical, Play, Film, Plus, Image as ImageIcon, Pencil, Check, ArrowLeft } from "lucide-react";
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

interface MediaPreview {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

type ViewMode = "select" | "create" | "edit";

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

const SortableExistingMedia = ({ 
  image, 
  onRemove,
  isDeleting 
}: { 
  image: HighlightImage; 
  onRemove: () => void;
  isDeleting: boolean;
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

const CreateHighlight = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: highlights = [] } = useUserHighlights(user?.id);
  const addHighlight = useAddHighlight();
  const addHighlightImage = useAddHighlightImage();
  const deleteHighlightImage = useDeleteHighlightImage();
  const reorderHighlightImages = useReorderHighlightImages();
  const updateHighlight = useUpdateHighlight();
  const { compressImage } = useImageCompression();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("select");
  const [selectedHighlight, setSelectedHighlight] = useState<UserHighlight | null>(null);
  
  // Create mode state
  const [title, setTitle] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Edit mode state
  const [localImages, setLocalImages] = useState<HighlightImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

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

  // Sync local images when editing
  useEffect(() => {
    if (selectedHighlight?.images) {
      setLocalImages([...selectedHighlight.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setEditedTitle(selectedHighlight.title);
    }
  }, [selectedHighlight]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo) {
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
      if (viewMode === "create") {
        setMediaItems((prev) => {
          const oldIndex = prev.findIndex((m) => m.id === active.id);
          const newIndex = prev.findIndex((m) => m.id === over.id);
          return arrayMove(prev, oldIndex, newIndex);
        });
      } else if (viewMode === "edit" && selectedHighlight) {
        const oldIndex = localImages.findIndex((m) => m.id === active.id);
        const newIndex = localImages.findIndex((m) => m.id === over.id);
        const newOrder = arrayMove(localImages, oldIndex, newIndex);
        
        setLocalImages(newOrder);
        
        reorderHighlightImages.mutateAsync(
          newOrder.map((img, index) => ({ id: img.id, display_order: index }))
        ).catch(() => {
          setLocalImages([...selectedHighlight.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
        });
      }
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
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
      const uploadedItems: Array<{ url: string; type: 'image' | 'video' }> = [];
      
      for (const item of mediaItems) {
        const fileExt = item.type === 'image' ? 'jpg' : item.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
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

      await addHighlight.mutateAsync({
        title: title.trim(),
        image_url: uploadedItems[0].url,
        media_items: uploadedItems,
      });

      mediaItems.forEach(item => {
        if (item.type === 'video') {
          URL.revokeObjectURL(item.preview);
        }
      });

      toast.success("Destaque criado com sucesso!");
      navigate(-1);
    } catch (error) {
      console.error("Error adding highlight:", error);
      toast.error("Erro ao adicionar destaque");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedHighlight || !user) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        
        try {
          const isVideo = file.type.startsWith('video/');
          const mediaType = isVideo ? 'video' : 'image';
          const fileExt = isVideo ? file.name.split('.').pop() : 'jpg';
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          
          let fileToUpload: Blob = file;
          if (!isVideo) {
            fileToUpload = await compressImage(file);
          }
          
          const { error: uploadError } = await supabase.storage
            .from("post-media")
            .upload(fileName, fileToUpload);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("post-media")
            .getPublicUrl(fileName);

          await addHighlightImage.mutateAsync({
            highlightId: selectedHighlight.id,
            imageUrl: publicUrl,
            mediaType,
          });

          successCount++;
        } catch (err) {
          console.error("Error uploading file:", err);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ${successCount === 1 ? 'mídia adicionada' : 'mídias adicionadas'}!`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      e.target.value = "";
    }
  };

  const handleRemoveExistingMedia = async (imageId: string) => {
    if (!selectedHighlight) return;
    
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

  const handleSaveTitle = async () => {
    if (!selectedHighlight || !editedTitle.trim()) return;
    
    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle === selectedHighlight.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateHighlight.mutateAsync({ id: selectedHighlight.id, title: trimmedTitle });
      toast.success("Título atualizado");
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Erro ao atualizar título");
    }
  };

  const handleClose = () => {
    mediaItems.forEach(item => {
      if (item.type === 'video') {
        URL.revokeObjectURL(item.preview);
      }
    });
    navigate(-1);
  };

  const handleBack = () => {
    if (viewMode === "select") {
      handleClose();
    } else {
      setViewMode("select");
      setSelectedHighlight(null);
      setTitle("");
      setMediaItems([]);
      setIsEditingTitle(false);
    }
  };

  const handleSelectHighlight = (highlight: UserHighlight) => {
    setSelectedHighlight(highlight);
    setViewMode("edit");
  };

  const getMediaCount = (highlight: UserHighlight) => {
    return highlight.images?.length || 0;
  };

  const progressPercentage = uploadProgress.total > 0 
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <span className="text-base font-semibold">
          {viewMode === "select" && "Destaques"}
          {viewMode === "create" && "Novo Destaque"}
          {viewMode === "edit" && "Editar Destaque"}
        </span>
        
        <div className="w-10" />
      </div>

      <div className="p-4">
        {/* Select Mode */}
        {viewMode === "select" && (
          <div className="space-y-4">
            {/* Create New Option */}
            <button
              onClick={() => setViewMode("create")}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Criar novo destaque</p>
                <p className="text-xs text-muted-foreground">Adicione um novo destaque ao seu perfil</p>
              </div>
            </button>

            {/* Existing Highlights */}
            {highlights.length > 0 && (
              <>
                <div className="mt-4 mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Seus Destaques</p>
                </div>
                
                <div className="space-y-1">
                  {highlights.map((highlight) => (
                    <button
                      key={highlight.id}
                      onClick={() => handleSelectHighlight(highlight)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-14 w-14 border-2 border-border">
                        <AvatarImage 
                          src={highlight.image_url} 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-muted">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left flex-1">
                        <p className="font-semibold">{highlight.title}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Film className="h-3 w-3" />
                          <span>{getMediaCount(highlight)} {getMediaCount(highlight) === 1 ? 'mídia' : 'mídias'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {highlights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Você ainda não tem destaques</p>
                <p className="text-xs">Crie seu primeiro destaque acima</p>
              </div>
            )}
          </div>
        )}

        {/* Create Mode */}
        {viewMode === "create" && (
          <form onSubmit={handleSubmitCreate} className="flex flex-col gap-4">
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
        )}

        {/* Edit Mode */}
        {viewMode === "edit" && selectedHighlight && (
          <div className="flex flex-col gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    maxLength={20}
                    className="h-10"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') {
                        setEditedTitle(selectedHighlight.title);
                        setIsEditingTitle(false);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveTitle}
                    disabled={updateHighlight.isPending || !editedTitle.trim()}
                  >
                    {updateHighlight.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">{selectedHighlight.title}</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

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
                        onRemove={() => handleRemoveExistingMedia(image.id)}
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
                      onChange={handleEditMediaChange}
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
              onClick={handleBack}
              className="w-full"
              disabled={isUploading}
            >
              Concluído
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateHighlight;
