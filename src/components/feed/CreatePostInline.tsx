import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CreatePostSheet } from "@/components/feed/CreatePostSheet";
import { CreateReplaySheet } from "@/components/feed/CreateReplaySheet";

export const CreatePostInline = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        {/* Input Area */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(profile?.full_name || profile?.username)}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => setIsPostOpen(true)}
            className="flex-1 text-left px-4 py-3 bg-muted/50 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            Compartilhe suas conquistas, treinos ou insights...
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPostOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-blue-500">
                videocam
              </span>
              <span className="hidden sm:inline">Vídeo</span>
            </button>
            <button
              onClick={() => setIsReplayOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-amber-500">
                slow_motion_video
              </span>
              <span className="hidden sm:inline">Replay</span>
            </button>
            <button
              onClick={() => setIsPostOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-emerald-500">
                bar_chart
              </span>
              <span className="hidden sm:inline">Estatísticas</span>
            </button>
            <button
              onClick={() => setIsPostOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-purple-500">
                event
              </span>
              <span className="hidden sm:inline">Evento</span>
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => setIsPostOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Publicar
          </Button>
        </div>
      </div>

      {/* Sheets */}
      <CreatePostSheet open={isPostOpen} onOpenChange={setIsPostOpen} />
      <CreateReplaySheet open={isReplayOpen} onOpenChange={setIsReplayOpen} />
    </>
  );
};
