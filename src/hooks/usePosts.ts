import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cachePosts, getCachedPosts, isOnline } from "@/lib/offlineStorage";

export interface RecentLike {
  user_id: string;
  username: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  conta_verificada: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  music_track_id: string | null;
  music_start_seconds: number | null;
  music_end_seconds: number | null;
  music_track: {
    id: string;
    title: string;
    artist: string;
    audio_url: string;
    duration_seconds: number;
    cover_url: string | null;
  } | null;
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
  recent_likes: RecentLike[];
}

export const usePosts = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["posts"],
    queryFn: async (): Promise<Post[]> => {
      // If offline, return cached data
      if (!isOnline()) {
        const cached = await getCachedPosts();
        if (cached.length > 0) {
          return cached as Post[];
        }
        throw new Error("Sem conexão e sem dados em cache");
      }

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
          ),
          music_track:music_tracks (
            id,
            title,
            artist,
            audio_url,
            duration_seconds,
            cover_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get post IDs for batch queries
      const postIds = posts?.map(p => p.id) || [];

      // Fetch recent likes for all posts (get the 3 most recent per post)
      const recentLikesRes = await supabase
        .from("likes")
        .select(`
          post_id,
          user_id,
          created_at,
          profile:profiles!likes_user_id_fkey (
            id,
            username,
            full_name,
            nickname,
            avatar_url,
            conta_verificada
          )
        `)
        .in("post_id", postIds)
        .order("created_at", { ascending: false });

      // Group recent likes by post_id (max 3 per post)
      const recentLikesByPost: Record<string, RecentLike[]> = {};
      for (const like of recentLikesRes.data || []) {
        if (!recentLikesByPost[like.post_id]) {
          recentLikesByPost[like.post_id] = [];
        }
        if (recentLikesByPost[like.post_id].length < 3) {
          recentLikesByPost[like.post_id].push({
            user_id: like.user_id,
            username: (like.profile as any)?.username || "",
            full_name: (like.profile as any)?.full_name || null,
            nickname: (like.profile as any)?.nickname || null,
            avatar_url: (like.profile as any)?.avatar_url || null,
            conta_verificada: (like.profile as any)?.conta_verificada || false,
          });
        }
      }

      // Check if posts are liked/saved by current user
      if (user && posts) {
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
          recent_likes: recentLikesByPost[post.id] || [],
        }));
      }

      return posts?.map(post => ({
        ...post,
        liked_by_user: false,
        saved_by_user: false,
        recent_likes: recentLikesByPost[post.id] || [],
      })) || [];
    },
    retry: (failureCount, error) => {
      // Don't retry if offline
      if (!isOnline()) return false;
      return failureCount < 3;
    },
  });

  // Cache posts when they're fetched successfully
  useEffect(() => {
    if (query.data && query.data.length > 0 && isOnline()) {
      cachePosts(query.data).catch(console.error);
    }
  }, [query.data]);

  return query;
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      content, 
      mediaUrl, 
      mediaType,
      locationName,
      locationLat,
      locationLng,
      musicTrackId,
      musicStartSeconds,
      musicEndSeconds,
    }: { 
      content: string; 
      mediaUrl?: string; 
      mediaType?: string;
      locationName?: string;
      locationLat?: number;
      locationLng?: number;
      musicTrackId?: string;
      musicStartSeconds?: number;
      musicEndSeconds?: number;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          location_name: locationName || null,
          location_lat: locationLat || null,
          location_lng: locationLng || null,
          music_track_id: musicTrackId || null,
          music_start_seconds: musicStartSeconds ?? null,
          music_end_seconds: musicEndSeconds ?? null,
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

export const useReportPost = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, reason, description }: { postId: string; reason: string; description?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          post_id: postId,
          reason,
          description: description || null,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Você já denunciou esta publicação");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Denúncia enviada. Obrigado pelo feedback!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar denúncia");
    },
  });
};
