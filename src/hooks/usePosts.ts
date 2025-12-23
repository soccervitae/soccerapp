import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    position: string | null;
    team: string | null;
    conta_verificada: boolean;
  };
  liked_by_user: boolean;
  saved_by_user: boolean;
}

export const usePosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["posts"],
    queryFn: async (): Promise<Post[]> => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select(`
          *,
          profile:profiles!posts_user_id_fkey (
            id,
            username,
            full_name,
            nickname,
            avatar_url,
            position,
            team,
            conta_verificada
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check if posts are liked/saved by current user
      if (user && posts) {
        const postIds = posts.map(p => p.id);
        
        const [likesRes, savedRes] = await Promise.all([
          supabase
            .from("likes")
            .select("post_id")
            .eq("user_id", user.id)
            .in("post_id", postIds),
          supabase
            .from("saved_posts")
            .select("post_id")
            .eq("user_id", user.id)
            .in("post_id", postIds)
        ]);

        const likedPostIds = new Set(likesRes.data?.map(l => l.post_id) || []);
        const savedPostIds = new Set(savedRes.data?.map(s => s.post_id) || []);

        return posts.map(post => ({
          ...post,
          liked_by_user: likedPostIds.has(post.id),
          saved_by_user: savedPostIds.has(post.id),
        }));
      }

      return posts?.map(post => ({
        ...post,
        liked_by_user: false,
        saved_by_user: false,
      })) || [];
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, mediaUrl, mediaType }: { content: string; mediaUrl?: string; mediaType?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post publicado!");
    },
    onError: () => {
      toast.error("Erro ao publicar post");
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

      if (isSaved) {
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_posts")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
  });
};

export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profile:profiles!comments_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("posts")
        .update({ content })
        .eq("id", postId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar post");
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir post");
    },
  });
};
