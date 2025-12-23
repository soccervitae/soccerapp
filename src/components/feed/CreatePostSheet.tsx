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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface CreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MediaType = "photo" | "video";
type ViewMode = "default" | "video-recorder";

const MAX_PHOTOS = 10;

export const CreatePostSheet = ({ open, onOpenChange }: CreatePostSheetProps) => {
  const [caption, setCaption] = useState("");
  const [selectedMediaList, setSelectedMediaList] = useState<string[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("photo");
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { takePhoto, pickMultipleFromGallery, isLoading, error } = useDeviceCamera();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

  const handlePickFromGallery = async () => {
    const images = await pickMultipleFromGallery(MAX_PHOTOS);
    if (images.length > 0) {
      const urls = images.map((img) => img.webPath).filter(Boolean) as string[];
      setSelectedMediaList(urls);
      setSelectedMediaType("photo");
      setCurrentIndex(0);
      toast.success(`${urls.length} foto${urls.length > 1 ? "s" : ""} selecionada${urls.length > 1 ? "s" : ""}!`);
    }
  };

  const handleAddMorePhotos = async () => {
    const remaining = MAX_PHOTOS - selectedMediaList.length;
    if (remaining <= 0) { toast.error(`Máximo de ${MAX_PHOTOS} fotos atingido`); return; }
    const images = await pickMultipleFromGallery(remaining);
    if (images.length > 0) {
      const urls = images.map((img) => img.webPath).filter(Boolean) as string[];
      setSelectedMediaList((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} foto${urls.length > 1 ? "s" : ""} adicionada${urls.length > 1 ? "s" : ""}!`);
    }
  };

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo?.webPath) {
      setSelectedMediaList((prev) => {
        if (prev.length >= MAX_PHOTOS) { toast.error(`Máximo de ${MAX_PHOTOS} fotos atingido`); return prev; }
        return [...prev, photo.webPath];
      });
      setSelectedMediaType("photo");
      toast.success("Foto capturada!");
    }
  };

  const handleVideoRecorded = (url: string, _blob: Blob) => {
    setSelectedMediaList([url]);
    setSelectedMediaType("video");
    setViewMode("default");
    toast.success("Vídeo gravado!");
  };

  const handlePost = () => {
    if (selectedMediaList.length === 0) { toast.error("Selecione uma foto ou vídeo para postar"); return; }
    toast.success("Post publicado com sucesso!");
    setCaption(""); setSelectedMediaList([]); setSelectedMediaType("photo"); setCurrentIndex(0);
    onOpenChange(false);
  };

  const handleClose = () => {
    setCaption(""); setSelectedMediaList([]); setSelectedMediaType("photo"); setViewMode("default"); setCurrentIndex(0);
    onOpenChange(false);
  };

  const handleRemoveCurrentMedia = () => {
    if (selectedMediaList.length <= 1) { setSelectedMediaList([]); setCurrentIndex(0); return; }
    setSelectedMediaList((prev) => {
      const newList = prev.filter((_, i) => i !== currentIndex);
      if (currentIndex >= newList.length) { setCurrentIndex(Math.max(0, newList.length - 1)); carouselApi?.scrollTo(Math.max(0, newList.length - 1)); }
      return newList;
    });
  };

  if (viewMode === "video-recorder") {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-full rounded-t-none p-0">
          <VideoRecorder onVideoRecorded={(videoUrl, blob) => handleVideoRecorded(videoUrl, blob)} onClose={() => setViewMode("default")} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-full rounded-t-none">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <button onClick={handleClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <SheetTitle className="text-base font-bold">Nova Publicação</SheetTitle>
            <Button onClick={handlePost} size="sm" className="rounded font-semibold text-xs h-8 px-4" disabled={selectedMediaList.length === 0 || isLoading}>Publicar</Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4 h-[calc(100%-80px)] overflow-y-auto">
          {selectedMediaList.length === 0 ? (
            <div className="w-full aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-6 p-6">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : (
                <>
                  <button onClick={handlePickFromGallery} className="w-full max-w-[200px] flex flex-col items-center gap-3 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px] text-primary">photo_library</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Escolher da Galeria</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Selecione até {MAX_PHOTOS} fotos</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 w-full max-w-[200px]">
                    <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">ou</span><div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleTakePhoto} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><span className="material-symbols-outlined text-[24px] text-foreground">photo_camera</span></div>
                      <span className="text-xs font-medium text-foreground">Tirar Foto</span>
                    </button>
                    <button onClick={() => setViewMode("video-recorder")} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><span className="material-symbols-outlined text-[24px] text-foreground">videocam</span></div>
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
                  <video src={selectedMediaList[0]} controls className="w-full aspect-square object-cover rounded-lg" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-foreground">videocam</span>
                    <span className="text-xs font-medium text-foreground">VÍDEO</span>
                  </div>
                </>
              ) : selectedMediaList.length === 1 ? (
                <img src={selectedMediaList[0]} alt="Preview" className="w-full aspect-square object-cover rounded-lg" />
              ) : (
                <Carousel setApi={setCarouselApi} className="w-full">
                  <CarouselContent>
                    {selectedMediaList.map((media, index) => (
                      <CarouselItem key={index}><img src={media} alt={`Foto ${index + 1}`} className="w-full aspect-square object-cover rounded-lg" /></CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              )}
              {selectedMediaList.length > 1 && selectedMediaType === "photo" && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-foreground">photo_library</span>
                  <span className="text-xs font-medium text-foreground">{currentIndex + 1}/{selectedMediaList.length}</span>
                </div>
              )}
              <button onClick={handleRemoveCurrentMedia} className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors">
                <span className="material-symbols-outlined text-[18px] text-foreground">close</span>
              </button>
              {selectedMediaList.length > 1 && selectedMediaType === "photo" && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {selectedMediaList.map((_, index) => (
                    <button key={index} onClick={() => carouselApi?.scrollTo(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-primary w-4" : "bg-background/60"}`} />
                  ))}
                </div>
              )}
              {selectedMediaType === "photo" && selectedMediaList.length < MAX_PHOTOS && (
                <button onClick={handleAddMorePhotos} disabled={isLoading} className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50">
                  <span className="material-symbols-outlined text-[20px] text-foreground">add_photo_alternate</span>
                  <span className="text-sm font-medium text-foreground">Adicionar mais fotos ({selectedMediaList.length}/{MAX_PHOTOS})</span>
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-600 p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-muted flex items-center justify-center"><span className="material-symbols-outlined text-[18px] text-muted-foreground">person</span></div>
            </div>
            <Textarea placeholder="Escreva uma legenda..." value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0" />
          </div>

          <div className="border-t border-border pt-4 space-y-1">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[22px] text-foreground">location_on</span><span className="text-sm text-foreground">Adicionar localização</span></div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[22px] text-foreground">person_add</span><span className="text-sm text-foreground">Marcar pessoas</span></div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[22px] text-foreground">music_note</span><span className="text-sm text-foreground">Adicionar música</span></div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};