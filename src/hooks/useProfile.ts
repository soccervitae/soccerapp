import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  conta_verificada: boolean;
  created_at: string;
}

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["profile", targetUserId],
    queryFn: async (): Promise<Profile | null> => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });
};

export const useProfileByUsername = (username: string) => {
  return useQuery({
    queryKey: ["profile", "username", username],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
    },
  });
};

export const useUserPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["user-posts", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });
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
