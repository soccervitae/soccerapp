import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStoryReplies } from "@/hooks/useStoryInteractions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StoryRepliesSheetProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryRepliesSheet = ({ storyId, isOpen, onClose }: StoryRepliesSheetProps) => {
  const { data: replies = [], isLoading } = useStoryReplies(storyId);

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveModalContent className="h-[70vh] sm:max-w-lg flex flex-col z-[70]" overlayClassName="z-[70]">
        <ResponsiveModalHeader className="pb-4 border-b border-border">
          <ResponsiveModalTitle className="text-center">
            Respostas ({replies.length})
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        
        <div className="py-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="material-symbols-outlined text-4xl mb-2 block">chat_bubble_outline</span>
              <p>Nenhuma resposta ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="flex gap-3 px-2">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={reply.profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {reply.profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="font-semibold text-sm">
                        {reply.profile.full_name || reply.profile.username}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1 break-words">
                      {reply.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
