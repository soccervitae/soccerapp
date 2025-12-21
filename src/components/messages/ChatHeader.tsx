import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ChatHeaderProps {
  participant: Profile | null;
}

export const ChatHeader = ({ participant }: ChatHeaderProps) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-2 h-14 flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={participant?.avatar_url || ""} alt={participant?.username || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(participant?.full_name || participant?.username || "?")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">
            {participant?.full_name || participant?.username || "Usuário"}
          </h1>
          {participant?.username && participant?.full_name && (
            <p className="text-xs text-muted-foreground truncate">@{participant.username}</p>
          )}
        </div>
      </div>
    </div>
  );
};
