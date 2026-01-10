import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  cacheProfile, 
  getCachedProfile, 
  getCachedProfileByUsername,
  cacheUserPosts,
  getCachedUserPosts,
  isOnline 
} from "@/lib/offlineStorage";

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  position_name: string | null;
  posicaomas: number | null;
  posicaofem: number | null;
  funcao: number | null;
  team: string | null;
  height: number | null;
  weight: number | null;
  birth_date: string | null;
  preferred_foot: string | null;
  gender: string | null;
  role: string | null;
  nickname: string | null;
  conta_verificada: boolean;
  created_at: string;
  profile_completed?: boolean;
  onboarding_completed?: boolean;
  nationality?: number | null;
  is_official_account?: boolean;
}

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const query = useQuery({
    queryKey: ["profile", targetUserId],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async (): Promise<Profile | null> => {
      if (!targetUserId) return null;

      // If offline, return cached data
      if (!isOnline()) {
        const cached = await getCachedProfile(targetUserId);
        if (cached) {
          return cached as Profile;
        }
        throw new Error("Sem conexão e sem dados em cache");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (error) throw error;
      
      // Fetch position name based on gender and role
      let position_name: string | null = null;
      const isStaff = data.role === 'tecnico' || data.role === 'preparador_fisico' || data.role === 'auxiliar' || data.role === 'comissao_tecnica';
      const isAthlete = data.role === 'atleta' || (!data.role && (data.posicaomas || data.posicaofem));
      const isFemale = data.gender === 'mulher' || data.gender === 'feminino' || data.gender === 'female';
      const isMale = data.gender === 'homem' || data.gender === 'masculino' || data.gender === 'male';
      
      let posData: { name: string } | null = null;
      
      if (isStaff && data.funcao) {
        // Staff: use funcao column based on gender
        if (isFemale) {
          const { data: result } = await supabase.from('funcaofem').select('name').eq('id', data.funcao).single();
          posData = result;
        } else {
          const { data: result } = await supabase.from('funcaomas').select('name').eq('id', data.funcao).single();
          posData = result;
        }
      } else if (isAthlete || !isStaff) {
        // Athletes: use gender-specific position columns
        if (isMale && data.posicaomas) {
          const { data: result } = await supabase.from('posicao_masculina').select('name').eq('id', data.posicaomas).single();
          posData = result;
        } else if (isFemale && data.posicaofem) {
          const { data: result } = await supabase.from('posicao_feminina').select('name').eq('id', data.posicaofem).single();
          posData = result;
        }
      }
      
      position_name = posData?.name || null;
      
      return {
        ...data,
        position_name,
      };
    },
    enabled: !!targetUserId,
    retry: (failureCount) => {
      if (!isOnline()) return false;
      return failureCount < 3;
    },
  });

  // Cache profile when fetched successfully
  useEffect(() => {
    if (query.data && isOnline()) {
      cacheProfile(query.data).catch(console.error);
    }
  }, [query.data]);

  return query;
};

export const useProfileByUsername = (username: string) => {
  const query = useQuery({
    queryKey: ["profile", "username", username],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async (): Promise<Profile | null> => {
      // If offline, return cached data
      if (!isOnline()) {
        const cached = await getCachedProfileByUsername(username);
        if (cached) {
          return cached as Profile;
        }
        throw new Error("Sem conexão e sem dados em cache");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      
      // Fetch position name based on gender and role
      let position_name: string | null = null;
      const isStaff = data.role === 'tecnico' || data.role === 'preparador_fisico' || data.role === 'auxiliar' || data.role === 'comissao_tecnica';
      const isAthlete = data.role === 'atleta' || (!data.role && (data.posicaomas || data.posicaofem));
      const isFemale = data.gender === 'mulher' || data.gender === 'feminino' || data.gender === 'female';
      const isMale = data.gender === 'homem' || data.gender === 'masculino' || data.gender === 'male';
      
      let posData: { name: string } | null = null;
      
      if (isStaff && data.funcao) {
        // Staff: use funcao column based on gender
        if (isFemale) {
          const { data: result } = await supabase.from('funcaofem').select('name').eq('id', data.funcao).single();
          posData = result;
        } else {
          const { data: result } = await supabase.from('funcaomas').select('name').eq('id', data.funcao).single();
          posData = result;
        }
      } else if (isAthlete || !isStaff) {
        // Athletes: use gender-specific position columns
        if (isMale && data.posicaomas) {
          const { data: result } = await supabase.from('posicao_masculina').select('name').eq('id', data.posicaomas).single();
          posData = result;
        } else if (isFemale && data.posicaofem) {
          const { data: result } = await supabase.from('posicao_feminina').select('name').eq('id', data.posicaofem).single();
          posData = result;
        }
      }
      
      position_name = posData?.name || null;
      
      return {
        ...data,
        position_name,
      };
    },
    enabled: !!username,
    retry: (failureCount) => {
      if (!isOnline()) return false;
      return failureCount < 3;
    },
  });

  // Cache profile when fetched successfully
  useEffect(() => {
    if (query.data && isOnline()) {
      cacheProfile(query.data).catch(console.error);
    }
  }, [query.data]);

  return query;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Update cache with new data
      if (data) {
        cacheProfile(data).catch(console.error);
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
    },
  });
};

export interface UserPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  updated_at: string | null;
  liked_by_user?: boolean;
  saved_by_user?: boolean;
}

export const useUserPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const currentUserId = user?.id;

  const query = useQuery({
    queryKey: ["user-posts", targetUserId, currentUserId],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async (): Promise<UserPost[]> => {
      if (!targetUserId) return [];

      // If offline, return cached data
      if (!isOnline()) {
        const cached = await getCachedUserPosts(targetUserId);
        if (cached.length > 0) {
          return cached as UserPost[];
        }
        throw new Error("Sem conexão e sem dados em cache");
      }

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // If current user is logged in, fetch their likes and saves for these posts
      if (currentUserId) {
        const postIds = posts.map(p => p.id);
        
        const [likesResult, savesResult] = await Promise.all([
          supabase
            .from("likes")
            .select("post_id")
            .eq("user_id", currentUserId)
            .in("post_id", postIds),
          supabase
            .from("saved_posts")
            .select("post_id")
            .eq("user_id", currentUserId)
            .in("post_id", postIds)
        ]);

        const likedPostIds = new Set((likesResult.data || []).map(l => l.post_id));
        const savedPostIds = new Set((savesResult.data || []).map(s => s.post_id));

        return posts.map(post => ({
          ...post,
          liked_by_user: likedPostIds.has(post.id),
          saved_by_user: savedPostIds.has(post.id),
        }));
      }

      return posts.map(post => ({
        ...post,
        liked_by_user: false,
        saved_by_user: false,
      }));
    },
    enabled: !!targetUserId,
    retry: (failureCount) => {
      if (!isOnline()) return false;
      return failureCount < 3;
    },
  });

  // Cache user posts when fetched successfully
  useEffect(() => {
    if (targetUserId && query.data && query.data.length > 0 && isOnline()) {
      cacheUserPosts(targetUserId, query.data).catch(console.error);
    }
  }, [targetUserId, query.data]);

  return query;
};

export const useFollowStats = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["follow-stats", targetUserId],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      if (!targetUserId) return { followers: 0, following: 0, isFollowing: false };

      const [followersRes, followingRes, isFollowingRes] = await Promise.all([
        supabase
          .from("follows")
          .select("id", { count: "exact" })
          .eq("following_id", targetUserId),
        supabase
          .from("follows")
          .select("id", { count: "exact" })
          .eq("follower_id", targetUserId),
        user && user.id !== targetUserId
          ? supabase
              .from("follows")
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", targetUserId)
              .single()
          : Promise.resolve({ data: null }),
      ]);

      return {
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
        isFollowing: !!isFollowingRes.data,
      };
    },
    enabled: !!targetUserId,
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

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
          .insert({
            follower_id: user.id,
            following_id: userId,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["follow-stats", userId] });
      queryClient.invalidateQueries({ queryKey: ["follow-stats", user?.id] });
    },
  });
};

export const useProfileView = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileId: string) => {
      if (!user || user.id === profileId) return;

      const { error } = await supabase
        .from("profile_views")
        .insert({
          profile_id: profileId,
          visitor_id: user.id,
        });

      if (error && error.code !== "23505") throw error;
    },
  });
};

// Calculate age from birth date
export const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Fetch user championships
export const useUserChampionships = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["user-championships", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("user_championships")
        .select(`
          *,
          championship:championships(name, logo_url)
        `)
        .eq("user_id", targetUserId)
        .order("year", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });
};

// Fetch user achievements
export const useUserAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["user-achievements", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement_type:achievement_types(name, color, category)
        `)
        .eq("user_id", targetUserId)
        .order("year", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });
};

// Fetch posts where user is tagged
export const useUserTaggedPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["user-tagged-posts", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("post_tags")
        .select(`
          id,
          post:posts(id, media_url, media_type, content)
        `)
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Extract unique posts
      const postsMap = new Map();
      data.forEach(tag => {
        if (tag.post && !postsMap.has(tag.post.id)) {
          postsMap.set(tag.post.id, tag.post);
        }
      });
      
      return Array.from(postsMap.values());
    },
    enabled: !!targetUserId,
  });
};

// Fetch achievement types for dropdown
export const useAchievementTypes = () => {
  return useQuery({
    queryKey: ["achievement-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievement_types")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};

// Add championship
export const useAddChampionship = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (championship: {
      custom_championship_name: string;
      year: number;
      team_name?: string;
      position_achieved?: string;
      games_played?: number;
      goals_scored?: number;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("user_championships")
        .insert({
          user_id: user.id,
          ...championship,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-championships"] });
      toast.success("Campeonato adicionado!");
    },
    onError: () => {
      toast.error("Erro ao adicionar campeonato");
    },
  });
};

// Delete championship
export const useDeleteChampionship = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (championshipId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("user_championships")
        .delete()
        .eq("id", championshipId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-championships"] });
      toast.success("Campeonato removido!");
    },
    onError: () => {
      toast.error("Erro ao remover campeonato");
    },
  });
};

// Update championship
export const useUpdateChampionship = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...championship }: {
      id: string;
      custom_championship_name: string;
      year: number;
      team_name?: string;
      position_achieved?: string;
      games_played?: number;
      goals_scored?: number;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("user_championships")
        .update(championship)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-championships"] });
      toast.success("Campeonato atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar campeonato");
    },
  });
};

// Add achievement
export const useAddAchievement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (achievement: {
      achievement_type_id?: string;
      custom_achievement_name?: string;
      championship_name?: string;
      team_name?: string;
      year: number;
      description?: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          ...achievement,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      toast.success("Conquista adicionada!");
    },
    onError: () => {
      toast.error("Erro ao adicionar conquista");
    },
  });
};

// Delete achievement
export const useDeleteAchievement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("user_achievements")
        .delete()
        .eq("id", achievementId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      toast.success("Conquista removida!");
    },
    onError: () => {
      toast.error("Erro ao remover conquista");
    },
  });
};

// Update achievement
export const useUpdateAchievement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...achievement }: {
      id: string;
      achievement_type_id?: string;
      custom_achievement_name?: string;
      championship_name?: string;
      team_name?: string;
      year: number;
      description?: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("user_achievements")
        .update(achievement)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      toast.success("Conquista atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar conquista");
    },
  });
};

// Highlight image interface
export interface HighlightImage {
  id: string;
  highlight_id: string;
  image_url: string;
  media_type: string;
  display_order: number;
  created_at: string;
}

// Highlight interface
export interface UserHighlight {
  id: string;
  user_id: string;
  title: string;
  image_url: string;
  display_order: number;
  created_at: string;
  images?: HighlightImage[];
  views_seen_at?: string | null;
}

// Fetch user highlights with images
export const useUserHighlights = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["user-highlights", targetUserId],
    queryFn: async (): Promise<UserHighlight[]> => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("user_highlights")
        .select(`
          *,
          images:highlight_images(*)
        `)
        .eq("user_id", targetUserId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      // Sort images by display_order within each highlight
      return (data || []).map(highlight => ({
        ...highlight,
        images: highlight.images?.sort((a: HighlightImage, b: HighlightImage) => a.display_order - b.display_order)
      }));
    },
    enabled: !!targetUserId,
  });
};

// Add highlight with multiple images/videos
export const useAddHighlight = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (highlight: {
      title: string;
      image_url: string;
      display_order?: number;
      media_items?: Array<{ url: string; type: 'image' | 'video' }>;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // First create the highlight
      const { data: highlightData, error: highlightError } = await supabase
        .from("user_highlights")
        .insert({
          user_id: user.id,
          title: highlight.title,
          image_url: highlight.image_url,
          display_order: highlight.display_order,
        })
        .select()
        .single();

      if (highlightError) throw highlightError;

      // Then create the media items
      const mediaItems = highlight.media_items || [{ url: highlight.image_url, type: 'image' as const }];
      const imageInserts = mediaItems.map((item, index) => ({
        highlight_id: highlightData.id,
        image_url: item.url,
        media_type: item.type,
        display_order: index,
      }));

      const { error: imagesError } = await supabase
        .from("highlight_images")
        .insert(imageInserts);

      if (imagesError) throw imagesError;

      return highlightData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
      toast.success("Destaque adicionado!");
    },
    onError: () => {
      toast.error("Erro ao adicionar destaque");
    },
  });
};

// Add media (image or video) to existing highlight
export const useAddHighlightImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ highlightId, imageUrl, mediaType = 'image', displayOrder }: {
      highlightId: string;
      imageUrl: string;
      mediaType?: 'image' | 'video';
      displayOrder?: number;
    }) => {
      // Get current max order if not provided
      let order = displayOrder;
      if (order === undefined) {
        const { data: existing } = await supabase
          .from("highlight_images")
          .select("display_order")
          .eq("highlight_id", highlightId)
          .order("display_order", { ascending: false })
          .limit(1);
        order = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;
      }

      const { data, error } = await supabase
        .from("highlight_images")
        .insert({
          highlight_id: highlightId,
          image_url: imageUrl,
          media_type: mediaType,
          display_order: order,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
    },
    onError: () => {
      toast.error("Erro ao adicionar mídia");
    },
  });
};

// Delete image from highlight
export const useDeleteHighlightImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("highlight_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
    },
    onError: () => {
      toast.error("Erro ao remover imagem");
    },
  });
};

// Reorder images within a highlight
export const useReorderHighlightImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (images: { id: string; display_order: number }[]) => {
      const updates = images.map((img) =>
        supabase
          .from("highlight_images")
          .update({ display_order: img.display_order })
          .eq("id", img.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
    },
    onError: () => {
      toast.error("Erro ao reordenar imagens");
    },
  });
};

// Update highlight
export const useUpdateHighlight = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserHighlight> & { id: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("user_highlights")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar destaque");
    },
  });
};

// Delete highlight
export const useDeleteHighlight = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (highlightId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("user_highlights")
        .delete()
        .eq("id", highlightId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
      toast.success("Destaque removido!");
    },
    onError: () => {
      toast.error("Erro ao remover destaque");
    },
  });
};

export const useReorderHighlights = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (highlights: { id: string; display_order: number }[]) => {
      if (!user) throw new Error("Usuário não autenticado");

      const updates = highlights.map((h) =>
        supabase
          .from("user_highlights")
          .update({ display_order: h.display_order })
          .eq("id", h.id)
          .eq("user_id", user.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
    },
    onError: () => {
      toast.error("Erro ao reordenar destaques");
    },
  });
};

// Hook to fetch saved posts for the current user
export const useUserSavedPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["user-saved-posts", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("saved_posts")
        .select(`
          id,
          created_at,
          post:posts (
            id,
            user_id,
            content,
            media_url,
            media_type,
            likes_count,
            comments_count,
            shares_count,
            created_at,
            location_name,
            location_lat,
            location_lng,
            music_track_id,
            music_start_seconds,
            music_end_seconds,
            profile:profiles!posts_user_id_fkey (
              id,
              username,
              full_name,
              nickname,
              avatar_url,
              conta_verificada,
              gender,
              role,
              posicaomas,
              posicaofem,
              funcao
            )
          )
        `)
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform to Post format with profile data
      return (
        data
          ?.map((item) => {
            if (!item.post) return null;
            const post = item.post as any;
            return {
              id: post.id,
              user_id: post.user_id,
              content: post.content,
              media_url: post.media_url,
              media_type: post.media_type,
              likes_count: post.likes_count,
              comments_count: post.comments_count,
              shares_count: post.shares_count,
              created_at: post.created_at,
              location_name: post.location_name,
              location_lat: post.location_lat,
              location_lng: post.location_lng,
              music_track_id: post.music_track_id,
              music_start_seconds: post.music_start_seconds,
              music_end_seconds: post.music_end_seconds,
              saved_by_user: true,
              liked_by_user: false,
              _profile: post.profile,
            };
          })
          .filter(Boolean) || []
      );
    },
    enabled: !!targetUserId,
  });
};
