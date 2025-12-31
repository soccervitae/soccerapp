import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHighlightReplies } from "@/hooks/useHighlightInteractions";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HighlightRepliesSheetProps {
  highlightId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const HighlightRepliesSheet = ({ highlightId, isOpen, onClose }: HighlightRepliesSheetProps) => {
  const navigate = useNavigate();
  const { data: replies = [], isLoading } = useHighlightReplies(highlightId);

  const handleProfileClick = (username: string) => {
    onClose();
    navigate(`/${username}`);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveModalContent className="h-[70vh] sm:max-w-lg flex flex-col z-[70]" overlayClassName="z-[70]">
        <ResponsiveModalHeader className="pb-4 border-b border-border">
          <ResponsiveModalTitle className="flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Respostas ({replies.length})
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        
        <ScrollArea className="flex-1 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma resposta ainda</p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-3">
                  <button onClick={() => handleProfileClick(reply.profile.username)}>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={reply.profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {reply.profile.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <button 
                        onClick={() => handleProfileClick(reply.profile.username)}
                        className="font-semibold text-sm hover:underline"
                      >
                        {reply.profile.username}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 break-words">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
