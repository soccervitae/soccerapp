import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Heart } from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface HighlightLikesSheetProps {
  highlightId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface HighlightLiker {
  id: string;
  user_id: string;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    conta_verificada: boolean;
  };
}

export const HighlightLikesSheet = ({ highlightId, isOpen, onClose }: HighlightLikesSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: likes, isLoading } = useQuery({
    queryKey: ["highlight-likers", highlightId],
    queryFn: async (): Promise<HighlightLiker[]> => {
      const { data, error } = await supabase
        .from("highlight_likes")
        .select(`
          id,
          user_id,
          created_at,
          profile:profiles!highlight_likes_user_id_fkey (
            id,
            username,
            full_name,
            nickname,
            avatar_url,
            conta_verificada
          )
        `)
        .eq("highlight_id", highlightId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as HighlightLiker[];
    },
    enabled: isOpen && !!highlightId,
  });

  // Get following list to check if user follows each liker
  const { data: following } = useQuery({
    queryKey: ["user-following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      if (error) throw error;
      return data.map((f) => f.following_id);
    },
    enabled: !!user && isOpen,
  });

  const followMutation = useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-following", user?.id] });
    },
  });

  const handleProfileClick = (username: string) => {
    onClose();
    navigate(`/${username}`);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveModalContent className="h-[70vh] sm:max-w-lg flex flex-col z-[80]" overlayClassName="z-[80]">
        <ResponsiveModalHeader className="border-b border-border pb-3">
          <ResponsiveModalTitle className="text-center">Curtidas</ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="overflow-y-auto flex-1 pt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : likes && likes.length > 0 ? (
            <div className="space-y-1">
              {likes.map((liker) => {
                const isFollowing = following?.includes(liker.user_id) || false;
                const isCurrentUser = user?.id === liker.user_id;

                return (
                  <div
                    key={liker.id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <button
                      onClick={() => handleProfileClick(liker.profile.username)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="relative">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={liker.profile.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(liker.profile.full_name || liker.profile.username)}
                          </AvatarFallback>
                        </Avatar>
                        {liker.profile.conta_verificada && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center border-2 border-background">
                            <span className="material-symbols-outlined text-[10px] font-bold">
                              verified
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                          {liker.profile.username}
                        </span>
                        {(liker.profile.nickname || liker.profile.full_name) && (
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {liker.profile.nickname || liker.profile.full_name}
                          </span>
                        )}
                      </div>
                    </button>

                    {!isCurrentUser && user && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() =>
                          followMutation.mutate({
                            userId: liker.user_id,
                            isFollowing,
                          })
                        }
                        disabled={followMutation.isPending}
                        className="text-xs h-8"
                      >
                        {isFollowing ? "Torcendo" : "Torcer"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma curtida ainda</p>
            </div>
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
