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
  position: string | null;
  team: string | null;
  height: number | null;
  weight: number | null;
  birth_date: string | null;
  preferred_foot: string | null;
  gender: string | null;
  conta_verificada: boolean;
  created_at: string;
}

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const query = useQuery({
    queryKey: ["profile", targetUserId],
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
      return data;
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
      return data;
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
      toast.success("Perfil atualizado!");
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
}

export const useUserPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const query = useQuery({
    queryKey: ["user-posts", targetUserId],
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

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
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
          achievement_type:achievement_types(name, icon, color, category)
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
