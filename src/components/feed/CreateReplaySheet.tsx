import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";

interface CreateReplaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplayCreated?: (replay: { image: string; caption: string }) => void;
}

// Fallback gallery images (used when device gallery is not available)
const fallbackGalleryImages = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=400&fit=crop",
];

export const CreateReplaySheet = ({ open, onOpenChange, onReplayCreated }: CreateReplaySheetProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>(fallbackGalleryImages);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  const { takePhoto, pickFromGallery, pickMultipleFromGallery, isLoading, error, isNative } = useDeviceCamera();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo?.webPath) {
      setCapturedImages(prev => [photo.webPath, ...prev]);
      setSelectedImage(photo.webPath);
      toast.success("Foto capturada!");
    }
  };

  const handlePickFromGallery = async () => {
    if (multiSelect) {
      const photos = await pickMultipleFromGallery(10);
      if (photos.length > 0) {
        const newImages = photos.map(p => p.webPath);
        setCapturedImages(prev => [...newImages, ...prev]);
        setSelectedImages(newImages);
        toast.success(`${photos.length} imagem(ns) selecionada(s)!`);
      }
    } else {
      const photo = await pickFromGallery();
      if (photo?.webPath) {
        setCapturedImages(prev => [photo.webPath, ...prev]);
        setSelectedImage(photo.webPath);
      }
    }
  };

  const handleImageSelect = (image: string) => {
    if (multiSelect) {
      setSelectedImages(prev => 
        prev.includes(image) 
          ? prev.filter(img => img !== image)
          : [...prev, image]
      );
    } else {
      setSelectedImage(image);
    }
  };

  const handlePublish = () => {
    const imageToPublish = multiSelect ? selectedImages[0] : selectedImage;
    
    if (!imageToPublish) {
      toast.error("Selecione uma imagem para o replay");
      return;
    }
    
    if (onReplayCreated) {
      onReplayCreated({ image: imageToPublish, caption: "" });
    }
    
    toast.success("Replay publicado com sucesso!");
    handleClose();
  };

  const handleClose = () => {
    setSelectedImage(null);
    setSelectedImages([]);
    setMultiSelect(false);
    onOpenChange(false);
  };

  const toggleMultiSelect = () => {
    setMultiSelect(!multiSelect);
    if (multiSelect) {
      setSelectedImages([]);
    } else if (selectedImage) {
      setSelectedImages([selectedImage]);
      setSelectedImage(null);
    }
  };

  const hasSelection = multiSelect ? selectedImages.length > 0 : !!selectedImage;
  const allImages = [...capturedImages, ...galleryImages];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button 
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[24px] text-foreground">close</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">Novo Replay</span>
            <span className="material-symbols-outlined text-[20px] text-foreground">keyboard_arrow_down</span>
          </div>
          
          <Button 
            onClick={handlePublish}
            size="sm"
            variant="ghost"
            className="text-primary font-semibold text-sm hover:bg-transparent"
            disabled={!hasSelection || isLoading}
          >
            Avançar
          </Button>
        </div>

        {/* Preview Area */}
        <div className="relative bg-black flex-shrink-0" style={{ height: '45%' }}>
          {selectedImage || (multiSelect && selectedImages.length > 0) ? (
            <img
              src={multiSelect ? selectedImages[selectedImages.length - 1] : selectedImage!}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-[48px] text-white/40">photo_library</span>
                <p className="text-white/60 text-sm mt-2">Selecione uma foto ou vídeo</p>
              </div>
            </div>
          )}
          
          {/* Preview controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-white">aspect_ratio</span>
            </button>
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-white">auto_fix_high</span>
              </button>
              <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-white">music_note</span>
              </button>
            </div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-white text-sm">Carregando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
          {/* Gallery Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button 
              onClick={handlePickFromGallery}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full hover:bg-muted/80 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground">
                {isNative ? 'Galeria' : 'Recentes'}
              </span>
              <span className="material-symbols-outlined text-[18px] text-foreground">keyboard_arrow_down</span>
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleMultiSelect}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  multiSelect ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                title="Selecionar múltiplas"
              >
                <span className="material-symbols-outlined text-[20px]">library_add_check</span>
              </button>
              <button 
                onClick={handleTakePhoto}
                disabled={isLoading}
                className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                title="Tirar foto"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </button>
            </div>
          </div>

          {/* Native device info banner */}
          {isNative && (
            <div className="px-4 py-2 bg-primary/10 border-b border-border">
              <p className="text-xs text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                Acesso à câmera e galeria do dispositivo ativado
              </p>
            </div>
          )}

          {/* Gallery Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-0.5">
              {/* Camera tile - first position */}
              <button
                onClick={handleTakePhoto}
                disabled={isLoading}
                className="relative aspect-square overflow-hidden bg-muted flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px] text-primary">photo_camera</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Câmera</span>
              </button>

              {/* Gallery images */}
              {allImages.map((image, index) => {
                const isSelected = multiSelect 
                  ? selectedImages.includes(image)
                  : selectedImage === image;
                const selectionIndex = multiSelect ? selectedImages.indexOf(image) + 1 : 0;
                const isCaptured = capturedImages.includes(image);
                
                return (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => handleImageSelect(image)}
                    className="relative aspect-square overflow-hidden"
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className={`w-full h-full object-cover transition-all duration-200 ${
                        isSelected ? 'scale-90 rounded-lg' : ''
                      }`}
                    />
                    
                    {/* Captured badge */}
                    {isCaptured && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary rounded text-[10px] font-bold text-primary-foreground">
                        NOVO
                      </div>
                    )}
                    
                    {/* Selection indicator */}
                    {multiSelect && (
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'bg-black/30 border-white/70'
                      }`}>
                        {isSelected && (
                          <span className="text-xs font-bold text-primary-foreground">{selectionIndex}</span>
                        )}
                      </div>
                    )}
                    
                    {!multiSelect && isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-primary-foreground">check</span>
                      </div>
                    )}

                    {/* Video indicator (for some items) */}
                    {!isCaptured && index % 4 === 2 && (
                      <div className="absolute bottom-2 right-2">
                        <span className="material-symbols-outlined text-[18px] text-white drop-shadow-lg">play_circle</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
