import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface FollowingUserItemProps {
  user: Profile;
  isOnline: boolean;
  hasConversation: boolean;
  onClick: () => void;
  disabled: boolean;
  isLoading?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const FollowingUserItem = ({
  user,
  isOnline,
  hasConversation,
  onClick,
  disabled,
  isLoading,
}: FollowingUserItemProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 active:bg-muted transition-colors rounded-lg disabled:opacity-50"
    >
      {/* Avatar com indicador online */}
      <div className="relative">
        <Avatar className="h-12 w-12 border-2 border-border">
          <AvatarImage src={user.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(user.full_name || user.username)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>

      {/* Info do usuário */}
      <div className="flex-1 text-left min-w-0">
        <p className="font-medium truncate">
          {user.full_name || user.username}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          @{user.username}
        </p>
      </div>

      {/* Indicadores */}
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : hasConversation ? (
          <div className="flex items-center gap-1 text-primary">
            <MessageCircle className="h-4 w-4 fill-current" />
          </div>
        ) : null}
      </div>
    </button>
  );
};
