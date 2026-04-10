import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type ContentType = "post" | "replay" | "highlight";

interface MediaPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ContentType;
}

const MAX_VIDEO_DURATION = 90;

const getVideoDurationFromFile = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);
      resolve(duration && isFinite(duration) ? duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Erro ao carregar vídeo"));
    };
    video.src = URL.createObjectURL(file);
  });
};

const getAccept = (type: ContentType) => "image/*,video/*";

const isMultiple = (type: ContentType) => type === "post" || type === "highlight";

const getRoute = (type: ContentType) => {
  switch (type) {
    case "post": return "/create-post";
    case "replay": return "/create-replay";
    case "highlight": return "/create-highlight";
  }
};

const getTitle = (type: ContentType) => {
  switch (type) {
    case "post": return "Nova Publicação";
    case "replay": return "Novo Replay";
    case "highlight": return "Novo Destaque";
  }
};

export const MediaPickerSheet = ({ open, onOpenChange, type }: MediaPickerSheetProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isValidating, setIsValidating] = useState(false);
  const hasTriggered = useRef(false);

  // Trigger file input when sheet opens
  useEffect(() => {
    if (open && !hasTriggered.current) {
      hasTriggered.current = true;
      // Small delay to let the drawer render
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 300);
    }
    if (!open) {
      hasTriggered.current = false;
    }
  }, [open]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      onOpenChange(false);
      return;
    }

    setIsValidating(true);

    try {
      // Validate video durations
      const validFiles: File[] = [];
      for (const file of files) {
        if (file.type.startsWith("video/")) {
          try {
            const duration = await getVideoDurationFromFile(file);
            if (duration > MAX_VIDEO_DURATION) {
              toast.error(`Vídeo "${file.name}" excede o limite de 90 segundos (${Math.round(duration)}s)`);
              continue;
            }
          } catch {
            toast.error(`Erro ao verificar duração do vídeo "${file.name}"`);
            continue;
          }
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        toast.error("Nenhuma mídia válida selecionada");
        onOpenChange(false);
        return;
      }

      // Navigate to creation page with files
      onOpenChange(false);
      navigate(getRoute(type), {
        state: { preSelectedMedia: validFiles },
      });
    } finally {
      setIsValidating(false);
      e.target.value = "";
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[50vh]">
        <DrawerHeader>
          <DrawerTitle>{getTitle(type)}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Selecione uma mídia da sua galeria para continuar.
          </p>
          <p className="text-xs text-muted-foreground text-center">
            ⏱️ Vídeos devem ter no máximo 90 segundos
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={getAccept(type)}
            multiple={isMultiple(type)}
            onChange={handleFilesSelected}
            className="hidden"
          />

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isValidating}
              className="w-full"
            >
              {isValidating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">photo_library</span>
                  Escolher da Galeria
                </span>
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
