import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface OnlineUserAvatarProps {
  user: Profile;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const OnlineUserAvatar = ({
  user,
  onClick,
  disabled,
  isLoading,
}: OnlineUserAvatarProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 min-w-[72px] py-2 px-1 disabled:opacity-50 transition-opacity"
    >
      <div className="relative">
        <Avatar className="h-14 w-14 ring-2 ring-green-500 ring-offset-2 ring-offset-background">
          <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
          <AvatarFallback className="bg-muted text-lg">
            {user.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        
        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      
      <span className="text-xs font-medium text-foreground truncate max-w-[64px]">
        {user.full_name?.split(" ")[0] || user.username}
      </span>
    </button>
  );
};
