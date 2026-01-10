import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
    team: string | null;
    conta_verificada: boolean;
    gender: string | null;
    role: string | null;
    posicaomas: number | null;
    posicaofem: number | null;
    funcao: number | null;
    position_name: string | null;
  };
  liked_by_user: boolean;
  saved_by_user: boolean;
  recent_likes: RecentLike[];
}

export const usePosts = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["posts"],
    refetchOnMount: "always",
    staleTime: 0,
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
            team,
            conta_verificada,
            gender,
            role,
            posicaomas,
            posicaofem,
            funcao
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
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      console.log('[usePosts] Fetched posts:', { postsCount: posts?.length, error });

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

      // Fetch position names for all posts
      const positionNamesMap = new Map<string, string>();
      
      // Collect all unique position IDs by gender
      const malePositionIds = new Set<number>();
      const femalePositionIds = new Set<number>();
      const maleFuncaoIds = new Set<number>();
      const femaleFuncaoIds = new Set<number>();
      
      posts?.forEach(post => {
        const profile = post.profile as any;
        const isMale = profile.gender === 'homem' || profile.gender === 'masculino' || profile.gender === 'male';
        const isFemale = profile.gender === 'mulher' || profile.gender === 'feminino' || profile.gender === 'female';
        const isStaff = profile.role === 'tecnico' || profile.role === 'preparador_fisico' || profile.role === 'auxiliar' || profile.role === 'comissao_tecnica';
        
        if (isStaff && profile.funcao) {
          if (isFemale) {
            femaleFuncaoIds.add(profile.funcao);
          } else {
            maleFuncaoIds.add(profile.funcao);
          }
        } else {
          if (isMale && profile.posicaomas) {
            malePositionIds.add(profile.posicaomas);
          } else if (isFemale && profile.posicaofem) {
            femalePositionIds.add(profile.posicaofem);
          }
        }
      });
      
      // Fetch all position names in parallel
      const [malePositions, femalePositions, maleFuncoes, femaleFuncoes] = await Promise.all([
        malePositionIds.size > 0 
          ? supabase.from('posicao_masculina').select('id, name').in('id', Array.from(malePositionIds))
          : { data: [] },
        femalePositionIds.size > 0
          ? supabase.from('posicao_feminina').select('id, name').in('id', Array.from(femalePositionIds))
          : { data: [] },
        maleFuncaoIds.size > 0
          ? supabase.from('funcaomas').select('id, name').in('id', Array.from(maleFuncaoIds))
          : { data: [] },
        femaleFuncaoIds.size > 0
          ? supabase.from('funcaofem').select('id, name').in('id', Array.from(femaleFuncaoIds))
          : { data: [] },
      ]);
      
      malePositions.data?.forEach(p => positionNamesMap.set(`posicaomas-${p.id}`, p.name));
      femalePositions.data?.forEach(p => positionNamesMap.set(`posicaofem-${p.id}`, p.name));
      maleFuncoes.data?.forEach(p => positionNamesMap.set(`funcaomas-${p.id}`, p.name));
      femaleFuncoes.data?.forEach(p => positionNamesMap.set(`funcaofem-${p.id}`, p.name));
      
      // Helper to get position name for a profile
      const getPositionName = (profile: any): string | null => {
        const isMale = profile.gender === 'homem' || profile.gender === 'masculino' || profile.gender === 'male';
        const isFemale = profile.gender === 'mulher' || profile.gender === 'feminino' || profile.gender === 'female';
        const isStaff = profile.role === 'tecnico' || profile.role === 'preparador_fisico' || profile.role === 'auxiliar' || profile.role === 'comissao_tecnica';
        
        if (isStaff && profile.funcao) {
          if (isFemale) {
            return positionNamesMap.get(`funcaofem-${profile.funcao}`) || null;
          }
          return positionNamesMap.get(`funcaomas-${profile.funcao}`) || null;
        }
        
        if (isMale && profile.posicaomas) {
          return positionNamesMap.get(`posicaomas-${profile.posicaomas}`) || null;
        }
        if (isFemale && profile.posicaofem) {
          return positionNamesMap.get(`posicaofem-${profile.posicaofem}`) || null;
        }
        return null;
      };

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
          profile: {
            ...post.profile,
            position_name: getPositionName(post.profile),
          },
          liked_by_user: likedPostIds.has(post.id),
          saved_by_user: savedPostIds.has(post.id),
          recent_likes: recentLikesByPost[post.id] || [],
        }));
      }

      return posts?.map(post => ({
        ...post,
        profile: {
          ...post.profile,
          position_name: getPositionName(post.profile),
        },
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
      import('@/lib/offlineStorage').then(({ setPostsCacheTimestamp }) => {
        cachePosts(query.data).then(() => {
          setPostsCacheTimestamp();
        }).catch(console.error);
      });
    }
  }, [query.data]);

  // Determine if data is from cache (offline with data)
  const isFromCache = !isOnline() && !!query.data && query.data.length > 0;

  return {
    ...query,
    isFromCache,
  };
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
      scheduledAt,
      isPublished = true,
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
      scheduledAt?: string;
      isPublished?: boolean;
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
          scheduled_at: scheduledAt || null,
          is_published: isPublished,
          published_at: isPublished ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  likes_count: number | null;
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async (): Promise<Comment[]> => {
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
      
      // Organize comments into parent/child structure
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];
      
      // First pass: create map of all comments
      for (const comment of data || []) {
        commentsMap.set(comment.id, { ...comment, replies: [] });
      }
      
      // Second pass: organize into tree structure
      for (const comment of data || []) {
        const commentWithReplies = commentsMap.get(comment.id)!;
        if (comment.parent_id && commentsMap.has(comment.parent_id)) {
          // This is a reply - add to parent's replies
          commentsMap.get(comment.parent_id)!.replies!.push(commentWithReplies);
        } else {
          // This is a root comment
          rootComments.push(commentWithReplies);
        }
      }
      
      return rootComments;
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
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

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, content, postId }: { commentId: string; content: string; postId: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", commentId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, postId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["comments", result.postId] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { commentId, postId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["comments", result.postId] });
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
      return postId;
    },
    // Optimistic update - remove immediately from UI
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      
      const previousPosts = queryClient.getQueryData<Post[]>(["posts"]);
      
      queryClient.setQueryData<Post[]>(["posts"], (old) => 
        old?.filter(post => post.id !== postId) || []
      );
      
      return { previousPosts };
    },
    onSuccess: async (postId) => {
      // Remove from offline cache
      const { removePostFromCache } = await import('@/lib/offlineStorage');
      await removePostFromCache(postId);
      
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (_err, _postId, context) => {
      // Revert on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
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
  });
};
