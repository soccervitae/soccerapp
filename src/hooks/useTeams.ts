import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Team {
  id: string;
  nome: string;
  escudo_url: string | null;
  estado_id: number | null;
  pais_id: number | null;
  selected_by_users: string[];
  estado?: {
    id: number;
    nome: string;
    uf: string;
  } | null;
  pais?: {
    id: number;
    nome: string;
    bandeira_url: string | null;
  } | null;
}

interface UseTeamsOptions {
  paisId?: number | null;
  estadoId?: number | null;
  search?: string;
}

export const useTeams = (options: UseTeamsOptions = {}) => {
  const { paisId, estadoId, search } = options;

  return useQuery({
    queryKey: ["teams", paisId, estadoId, search],
    queryFn: async () => {
      let query = supabase
        .from("times")
        .select(`
          id,
          nome,
          escudo_url,
          estado_id,
          pais_id,
          selected_by_users,
          estado:estados(id, nome, uf),
          pais:paises(id, nome, bandeira_url)
        `)
        .order("nome");

      if (paisId) {
        query = query.eq("pais_id", paisId);
      }

      if (estadoId) {
        query = query.eq("estado_id", estadoId);
      }

      if (search && search.trim()) {
        query = query.ilike("nome", `%${search.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Team[];
    },
  });
};

export const useUserTeams = (userId?: string) => {
  return useQuery({
    queryKey: ["user-teams", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("times")
        .select(`
          id,
          nome,
          escudo_url,
          estado_id,
          pais_id,
          selected_by_users,
          estado:estados(id, nome, uf),
          pais:paises(id, nome, bandeira_url)
        `)
        .contains("selected_by_users", [userId])
        .order("nome");

      if (error) throw error;
      return data as Team[];
    },
    enabled: !!userId,
  });
};

export const useAddUserToTeam = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("add_user_to_team", {
        p_team_id: teamId,
        p_user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useRemoveUserFromTeam = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("remove_user_from_team", {
        p_team_id: teamId,
        p_user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};
