import { useNavigate } from "react-router-dom";
import { usePostLikes } from "@/hooks/usePostLikes";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClappingHandsIcon } from "@/components/icons/ClappingHandsIcon";

interface LikesSheetProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LikesSheet = ({ postId, open, onOpenChange }: LikesSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: likes, isLoading } = usePostLikes(postId, open);

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
    enabled: !!user && open,
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
    onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl z-[70]" overlayClassName="z-[70]">
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle className="text-center">Aplausos</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-60px)] pt-2">
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
                    key={liker.user_id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <button
                      onClick={() => handleProfileClick(liker.username)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="relative">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={liker.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(liker.full_name || liker.username)}
                          </AvatarFallback>
                        </Avatar>
                        {liker.conta_verificada && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center border-2 border-background">
                            <span className="material-symbols-outlined text-[10px] font-bold">
                              verified
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                          {liker.username}
                        </span>
                        {(liker.nickname || liker.full_name) && (
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {liker.nickname || liker.full_name}
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
                        {isFollowing ? "Seguindo" : "Seguir"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClappingHandsIcon className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum aplauso ainda</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
