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
import { Loader2, ImagePlus } from "lucide-react";

interface AddHighlightSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddHighlightSheet = ({ open, onOpenChange }: AddHighlightSheetProps) => {
  const { user } = useAuth();
  const addHighlight = useAddHighlight();
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Digite um título para o destaque");
      return;
    }

    if (!imageFile) {
      toast.error("Selecione uma imagem");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsUploading(true);

    try {
      // Upload image to storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(fileName);

      // Add highlight to database
      await addHighlight.mutateAsync({
        title: title.trim(),
        image_url: publicUrl,
      });

      // Reset form and close
      setTitle("");
      setImageFile(null);
      setImagePreview(null);
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
    setImageFile(null);
    setImagePreview(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
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
            <Label>Imagem de Capa</Label>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative w-24 h-24 mx-auto">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-full border-2 border-border"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                    <ImagePlus className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 mx-auto rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </label>
            <p className="text-xs text-muted-foreground text-center">
              Clique para selecionar uma imagem
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isUploading || !title.trim() || !imageFile}
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
