import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CreateReplaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplayCreated?: (replay: { image: string; caption: string }) => void;
}

export const CreateReplaySheet = ({ open, onOpenChange, onReplayCreated }: CreateReplaySheetProps) => {
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelect = () => {
    // Simular seleção de imagem/vídeo
    const mockImages = [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=700&fit=crop",
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=700&fit=crop",
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=700&fit=crop",
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=700&fit=crop",
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=700&fit=crop",
    ];
    setSelectedImage(mockImages[Math.floor(Math.random() * mockImages.length)]);
  };

  const handlePublish = () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem para o replay");
      return;
    }
    
    if (onReplayCreated) {
      onReplayCreated({ image: selectedImage, caption });
    }
    
    toast.success("Replay publicado com sucesso!");
    setCaption("");
    setSelectedImage(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setCaption("");
    setSelectedImage(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <SheetTitle className="text-base font-bold">Novo Replay</SheetTitle>
            <Button 
              onClick={handlePublish}
              size="sm"
              className="rounded font-semibold text-xs h-8 px-4"
              disabled={!selectedImage}
            >
              Publicar
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4 h-[calc(100%-80px)] overflow-y-auto">
          {/* Image Selection */}
          {!selectedImage ? (
            <button
              onClick={handleImageSelect}
              className="w-full aspect-[9/16] max-h-[400px] bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 hover:bg-muted/80 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[40px] text-white">slow_motion_video</span>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">Adicionar replay</p>
                <p className="text-sm text-muted-foreground mt-1">Foto ou vídeo do seu momento</p>
              </div>
            </button>
          ) : (
            <div className="relative aspect-[9/16] max-h-[400px] mx-auto">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-white">close</span>
              </button>
              <button
                onClick={handleImageSelect}
                className="absolute bottom-3 right-3 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-2 hover:bg-black/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-white">refresh</span>
                <span className="text-sm font-medium text-white">Trocar</span>
              </button>
            </div>
          )}

          {/* Caption */}
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-600 p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-muted-foreground">person</span>
              </div>
            </div>
            <Textarea
              placeholder="Adicione um texto ao seu replay..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
            />
          </div>

          {/* Options */}
          <div className="border-t border-border pt-4 space-y-1">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-foreground">music_note</span>
                <span className="text-sm text-foreground">Adicionar música</span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-foreground">text_fields</span>
                <span className="text-sm text-foreground">Adicionar texto</span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-foreground">sticker</span>
                <span className="text-sm text-foreground">Adicionar sticker</span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-foreground">location_on</span>
                <span className="text-sm text-foreground">Adicionar localização</span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
