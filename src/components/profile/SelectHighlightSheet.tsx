import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Image as ImageIcon, Film } from "lucide-react";
import { UserHighlight } from "@/hooks/useProfile";

interface SelectHighlightSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlights: UserHighlight[];
  onSelectHighlight: (highlight: UserHighlight) => void;
  onCreateNew: () => void;
}

export const SelectHighlightSheet = ({
  open,
  onOpenChange,
  highlights,
  onSelectHighlight,
  onCreateNew,
}: SelectHighlightSheetProps) => {
  const getMediaCount = (highlight: UserHighlight) => {
    return highlight.images?.length || 0;
  };

  const getMediaTypeIcon = (highlight: UserHighlight) => {
    const hasVideo = highlight.images?.some(img => img.media_type === 'video');
    if (hasVideo) return <Film className="h-3 w-3" />;
    return <ImageIcon className="h-3 w-3" />;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="pb-4 border-b border-border">
          <DrawerTitle className="text-center">Adicionar aos Destaques</DrawerTitle>
        </DrawerHeader>

        <div className="py-4 overflow-y-auto max-h-[calc(70vh-100px)]">
          {/* Create New Option */}
          <button
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }}
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
              <div className="mt-4 mb-2 px-3">
                <p className="text-sm font-medium text-muted-foreground">Seus Destaques</p>
              </div>
              
              <div className="space-y-1">
                {highlights.map((highlight) => (
                  <button
                    key={highlight.id}
                    onClick={() => {
                      onOpenChange(false);
                      onSelectHighlight(highlight);
                    }}
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
                        {getMediaTypeIcon(highlight)}
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
      </DrawerContent>
    </Drawer>
  );
};

