import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { useProfileVisitors } from "@/hooks/useProfileVisitors";

interface ProfileVisitorsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileVisitorsSheet = ({ isOpen, onClose }: ProfileVisitorsSheetProps) => {
  const navigate = useNavigate();
  const { data: visitors = [], isLoading } = useProfileVisitors();

  const handleVisitorClick = (username: string) => {
    onClose();
    navigate(`/${username}`);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveModalContent className="max-h-[85vh]">
        <ResponsiveModalHeader className="text-center pb-2">
          <ResponsiveModalTitle className="flex items-center justify-center gap-2">
            <Eye className="h-5 w-5" />
            Quem visitou seu perfil
          </ResponsiveModalTitle>
          {visitors.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {visitors.length} {visitors.length === 1 ? 'pessoa' : 'pessoas'}
            </p>
          )}
        </ResponsiveModalHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : visitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Ninguém visitou seu perfil ainda
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Quando alguém visitar, você verá aqui
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {visitors.map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => handleVisitorClick(visit.visitor.username)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={visit.visitor.avatar_url || undefined} />
                    <AvatarFallback>
                      {visit.visitor.full_name?.[0] || visit.visitor.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {visit.visitor.full_name || visit.visitor.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{visit.visitor.username}
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(visit.viewed_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
