import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";
import { VideoRecorder } from "@/components/feed/VideoRecorder";

interface CreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MediaType = "photo" | "video";
type ViewMode = "default" | "video-recorder";

export const CreatePostSheet = ({ open, onOpenChange }: CreatePostSheetProps) => {
  const [caption, setCaption] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("photo");
  const [viewMode, setViewMode] = useState<ViewMode>("default");

  const { takePhoto, pickFromGallery, isLoading, error } = useDeviceCamera();

  // Mostrar erro do hook
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handlePickFromGallery = async () => {
    const image = await pickFromGallery();
    if (image?.webPath) {
      setSelectedMedia(image.webPath);
      setSelectedMediaType("photo");
      toast.success("Foto selecionada!");
    }
  };

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo?.webPath) {
      setSelectedMedia(photo.webPath);
      setSelectedMediaType("photo");
      toast.success("Foto capturada!");
    }
  };

  const handleRecordVideo = () => {
    setViewMode("video-recorder");
  };

  const handleVideoRecorded = (url: string, _blob: Blob) => {
    setSelectedMedia(url);
    setSelectedMediaType("video");
    setViewMode("default");
    toast.success("Vídeo gravado!");
  };

  const handlePost = () => {
    if (!selectedMedia) {
      toast.error("Selecione uma foto ou vídeo para postar");
      return;
    }
    toast.success("Post publicado com sucesso!");
    setCaption("");
    setSelectedMedia(null);
    setSelectedMediaType("photo");
    onOpenChange(false);
  };

  const handleClose = () => {
    setCaption("");
    setSelectedMedia(null);
    setSelectedMediaType("photo");
    setViewMode("default");
    onOpenChange(false);
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setSelectedMediaType("photo");
  };

  // Renderizar gravador de vídeo
  if (viewMode === "video-recorder") {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-full rounded-t-none p-0">
          <VideoRecorder
            onVideoRecorded={(videoUrl, blob) => handleVideoRecorded(videoUrl, blob)}
            onClose={() => setViewMode("default")}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-full rounded-t-none">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <SheetTitle className="text-base font-bold">Nova Publicação</SheetTitle>
            <Button 
              onClick={handlePost}
              size="sm"
              className="rounded font-semibold text-xs h-8 px-4"
              disabled={!selectedMedia || isLoading}
            >
              Publicar
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4 h-[calc(100%-80px)] overflow-y-auto">
          {/* Media Selection */}
          {!selectedMedia ? (
            <div className="w-full aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-6 p-6">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : (
                <>
                  {/* Botão principal - Galeria */}
                  <button
                    onClick={handlePickFromGallery}
                    className="w-full max-w-[200px] flex flex-col items-center gap-3 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px] text-primary">photo_library</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Escolher da Galeria</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Fotos e vídeos</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 w-full max-w-[200px]">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Botões secundários - Câmera e Vídeo */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleTakePhoto}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px] text-foreground">photo_camera</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">Tirar Foto</span>
                    </button>

                    <button
                      onClick={handleRecordVideo}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px] text-foreground">videocam</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">Gravar Vídeo</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative">
              {selectedMediaType === "video" ? (
                <>
                  <video
                    src={selectedMedia}
                    controls
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-foreground">videocam</span>
                    <span className="text-xs font-medium text-foreground">VÍDEO</span>
                  </div>
                </>
              ) : (
                <img
                  src={selectedMedia}
                  alt="Preview"
                  className="w-full aspect-square object-cover rounded-lg"
                />
              )}
              <button
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-foreground">close</span>
              </button>
            </div>
          )}

          {/* Caption */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-600 p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-muted-foreground">person</span>
              </div>
            </div>
            <Textarea
              placeholder="Escreva uma legenda..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
            />
          </div>

          {/* Options */}
          <div className="border-t border-border pt-4 space-y-1">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-foreground">location_on</span>
                <span className="text-sm text-foreground">Adicionar localização</span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-foreground">person_add</span>
                <span className="text-sm text-foreground">Marcar pessoas</span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-foreground">music_note</span>
                <span className="text-sm text-foreground">Adicionar música</span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};