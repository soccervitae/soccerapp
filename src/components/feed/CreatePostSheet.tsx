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

interface CreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePostSheet = ({ open, onOpenChange }: CreatePostSheetProps) => {
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelect = () => {
    // Simular seleção de imagem
    const mockImages = [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop",
    ];
    setSelectedImage(mockImages[Math.floor(Math.random() * mockImages.length)]);
  };

  const handlePost = () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem para postar");
      return;
    }
    toast.success("Post publicado com sucesso!");
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
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
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
              className="w-full aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 hover:bg-muted/80 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-primary">add_photo_alternate</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Adicionar foto</p>
                <p className="text-xs text-muted-foreground mt-1">Toque para selecionar</p>
              </div>
            </button>
          ) : (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full aspect-square object-cover rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-foreground">close</span>
              </button>
              <button
                onClick={handleImageSelect}
                className="absolute bottom-2 right-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-1.5 hover:bg-background transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-foreground">refresh</span>
                <span className="text-xs font-medium text-foreground">Trocar</span>
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
