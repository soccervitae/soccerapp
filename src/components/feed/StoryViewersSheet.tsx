import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStoryViewers } from "@/hooks/useStoryInteractions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StoryViewersSheetProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryViewersSheet = ({ storyId, isOpen, onClose }: StoryViewersSheetProps) => {
  const { data: viewers = [], isLoading } = useStoryViewers(storyId);

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveModalContent className="h-[70vh] sm:max-w-lg flex flex-col z-[70]" overlayClassName="z-[70]">
        <ResponsiveModalHeader className="pb-4 border-b border-border">
          <ResponsiveModalTitle className="text-center">
            Visualizações ({viewers.length})
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        
        <div className="py-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="material-symbols-outlined text-4xl mb-2 block">visibility_off</span>
              <p>Nenhuma visualização ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3 px-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={viewer.profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {viewer.profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {viewer.profile.full_name || viewer.profile.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{viewer.profile.username}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(viewer.viewed_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
