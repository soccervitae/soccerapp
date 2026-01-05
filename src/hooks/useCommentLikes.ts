import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useCommentLikes = (commentIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["comment-likes", commentIds.join(","), user?.id],
    queryFn: async () => {
      if (commentIds.length === 0) return { counts: {}, likedByUser: {} };

      // Get counts for each comment
      const { data: likesData, error: likesError } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds);

      if (likesError) throw likesError;

      // Count likes per comment
      const counts: Record<string, number> = {};
      for (const like of likesData || []) {
        counts[like.comment_id] = (counts[like.comment_id] || 0) + 1;
      }

      // Check which comments user has liked
      const likedByUser: Record<string, boolean> = {};
      if (user) {
        const { data: userLikes, error: userLikesError } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .in("comment_id", commentIds)
          .eq("user_id", user.id);

        if (userLikesError) throw userLikesError;

        for (const like of userLikes || []) {
          likedByUser[like.comment_id] = true;
        }
      }

      return { counts, likedByUser };
    },
    enabled: commentIds.length > 0,
  });
};

export const useLikeComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comment-likes"] });
    },
  });
};
