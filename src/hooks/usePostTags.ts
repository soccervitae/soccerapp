import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PhotoTag {
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  xPosition: number;
  yPosition: number;
  photoIndex: number;
}

export interface PostTag {
  id: string;
  post_id: string;
  user_id: string;
  x_position: number;
  y_position: number;
  photo_index: number;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const usePostTags = (postId: string) => {
  return useQuery({
    queryKey: ["post-tags", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_tags")
        .select(`
          id,
          post_id,
          user_id,
          x_position,
          y_position,
          photo_index,
          created_at,
          profile:profiles!post_tags_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq("post_id", postId);

      if (error) throw error;
      return (data || []) as PostTag[];
    },
    enabled: !!postId,
  });
};

export const useCreatePostTags = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, tags }: { postId: string; tags: PhotoTag[] }) => {
      if (!user) throw new Error("User not authenticated");

      const tagsToInsert = tags.map((tag) => ({
        post_id: postId,
        user_id: tag.userId,
        x_position: tag.xPosition,
        y_position: tag.yPosition,
        photo_index: tag.photoIndex,
      }));

      const { error } = await supabase.from("post_tags").insert(tagsToInsert);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-tags", variables.postId] });
    },
  });
};

export const useSearchUsers = () => {
  return useMutation({
    mutationFn: async (query: string) => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });
};
