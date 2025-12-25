import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchFilters {
  query: string;
  position?: string;
}

export interface SearchProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  position: string | null;
  team: string | null;
  conta_verificada: boolean;
}

export const useSearchProfiles = (filters: SearchFilters, currentUserId?: string) => {
  return useQuery({
    queryKey: ["search-profiles", filters, currentUserId],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, position, team, conta_verificada")
        .order("full_name");

      // Busca por nome, username ou time
      if (filters.query && filters.query.trim()) {
        query = query.or(
          `full_name.ilike.%${filters.query}%,username.ilike.%${filters.query}%,team.ilike.%${filters.query}%`
        );
      }

      // Filtro por posição
      if (filters.position && filters.position !== "Todos") {
        query = query.eq("position", filters.position);
      }

      // Excluir usuário atual
      if (currentUserId) {
        query = query.neq("id", currentUserId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data as SearchProfile[]) || [];
    },
  });
};

export const useFollowingIds = (userId?: string) => {
  return useQuery({
    queryKey: ["following-ids", userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);
      
      if (error) throw error;
      return new Set(data?.map(f => f.following_id) || []);
    },
    enabled: !!userId,
  });
};
