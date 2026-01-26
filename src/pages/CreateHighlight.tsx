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
            className="w-full h-full object-cover rounded-lg border-2 border-white/20"
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
          className="w-full h-full object-cover rounded-lg border-2 border-white/20"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3 text-white" />
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-1 right-1 w-5 h-5 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3 h-3 text-white/60" />
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
            className="w-full h-full object-cover rounded-lg border-2 border-white/20"
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
          className="w-full h-full object-cover rounded-lg border-2 border-white/20"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={isDeleting}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
      >
        {isDeleting ? (
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        ) : (
          <X className="w-3 h-3 text-white" />
        )}
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-1 right-1 w-5 h-5 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3 h-3 text-white/60" />
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

  const canSave = viewMode === "create" && title.trim() && mediaItems.length > 0 && !isUploading;

  return (
    <div className="min-h-screen bg-black">
      {/* Header - Glassmorphism style */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl">
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        
        <span className="text-base font-semibold text-white">
          {viewMode === "select" && "Destaques"}
          {viewMode === "create" && "Novo Destaque"}
          {viewMode === "edit" && "Editar Destaque"}
        </span>
        
        {viewMode === "create" ? (
          <Button 
            onClick={handleSubmitCreate}
            size="sm" 
            className={`rounded-full px-5 font-semibold text-sm transition-all duration-200 ${
              canSave
                ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25' 
                : 'bg-white/10 text-white/40 hover:bg-white/10'
            }`}
            disabled={!canSave}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar"
            )}
          </Button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      <div className="p-4">
        {/* Select Mode */}
        {viewMode === "select" && (
          <div className="space-y-4">
            {/* Create New Option */}
            <button
              onClick={() => setViewMode("create")}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-dashed border-primary/60 shadow-lg shadow-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Criar novo destaque</p>
                <p className="text-xs text-white/60">Adicione um novo destaque ao seu perfil</p>
              </div>
            </button>

            {/* Existing Highlights */}
            {highlights.length > 0 && (
              <>
                <div className="mt-6 mb-3">
                  <p className="text-sm font-medium text-white/60">Seus Destaques</p>
                </div>
                
                <div className="space-y-2">
                  {highlights.map((highlight) => (
                    <button
                      key={highlight.id}
                      onClick={() => handleSelectHighlight(highlight)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-200"
                    >
                      <Avatar className="h-14 w-14 border-2 border-white/20">
                        <AvatarImage 
                          src={highlight.image_url} 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-zinc-800">
                          <ImageIcon className="h-6 w-6 text-white/40" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-white">{highlight.title}</p>
                        <div className="flex items-center gap-1 text-xs text-white/60">
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
              <div className="text-center py-12 text-white/40">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-white/60">Você ainda não tem destaques</p>
                <p className="text-xs">Crie seu primeiro destaque acima</p>
              </div>
            )}
          </div>
        )}

        {/* Create Mode */}
        {viewMode === "create" && (
          <form onSubmit={handleSubmitCreate} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-white/80">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Gols, Treinos, Prêmios..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={20}
                className="bg-zinc-900 border-white/10 text-white placeholder:text-white/40 focus:border-white/30"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-white/80">Fotos e Vídeos ({mediaItems.length}/10)</Label>
              
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
                    <div className="w-20 h-20 rounded-lg bg-zinc-900/80 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:border-white/40 transition-all duration-200 backdrop-blur-sm">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
                        <Film className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-white/60 font-medium">Mídia</span>
                    </div>
                  </label>
                )}
              </div>
              
              <p className="text-xs text-white/40">
                Arraste para reordenar. O primeiro item será a capa.
              </p>
            </div>
          </form>
        )}

        {/* Edit Mode */}
        {viewMode === "edit" && selectedHighlight && (
          <div className="flex flex-col gap-6">
            {/* Title Section */}
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    maxLength={20}
                    className="h-10 bg-zinc-900 border-white/10 text-white placeholder:text-white/40 focus:border-white/30"
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
                    className="hover:bg-white/10 text-white"
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
                  <h2 className="text-lg font-semibold text-white">{selectedHighlight.title}</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-white/10 text-white/60"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-white/80">Fotos e Vídeos ({localImages.length}/10)</Label>
              
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
                    <div className="w-20 h-20 rounded-lg bg-zinc-900/80 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:border-white/40 transition-all duration-200 backdrop-blur-sm">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
                        <Plus className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-white/60 font-medium">Adicionar</span>
                    </div>
                  </label>
                )}
              </div>
              
              <p className="text-xs text-white/40">
                Arraste para reordenar. O primeiro item será a capa.
              </p>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="flex flex-col gap-2 p-4 bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    Enviando {uploadProgress.current} de {uploadProgress.total}...
                  </span>
                  <span className="font-medium text-white">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}

            <Button 
              onClick={handleBack}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
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
