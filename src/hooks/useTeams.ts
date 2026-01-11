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
  user_id: string | null;
  created_by_admin?: boolean;
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
          user_id,
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
      
      // Check if creators are admins
      const teamsWithAdminCheck = await Promise.all(
        (data || []).map(async (team) => {
          if (!team.user_id) return { ...team, created_by_admin: false };
          
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", team.user_id)
            .eq("role", "admin")
            .maybeSingle();
          
          return { ...team, created_by_admin: !!roleData };
        })
      );
      
      return teamsWithAdminCheck as Team[];
    },
  });
};

export const useUserTeams = (userId?: string) => {
  return useQuery({
    queryKey: ["user-teams", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get teams and their order
      const [teamsResult, orderResult] = await Promise.all([
        supabase
          .from("times")
          .select(`
            id,
            nome,
            escudo_url,
            estado_id,
            pais_id,
            selected_by_users,
            user_id,
            estado:estados(id, nome, uf),
            pais:paises(id, nome, bandeira_url)
          `)
          .contains("selected_by_users", [userId]),
        supabase
          .from("user_team_order")
          .select("team_id, display_order")
          .eq("user_id", userId)
      ]);

      if (teamsResult.error) throw teamsResult.error;

      const teams = teamsResult.data as Team[];
      const orderMap = new Map<string, number>();
      
      if (orderResult.data) {
        orderResult.data.forEach((o: { team_id: string; display_order: number }) => {
          orderMap.set(o.team_id, o.display_order);
        });
      }

      // Sort teams by display_order, then by name for unordered teams
      return teams.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 9999;
        const orderB = orderMap.get(b.id) ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.nome.localeCompare(b.nome);
      });
    },
    enabled: !!userId,
  });
};

export const useUpdateTeamOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (teamIds: string[]) => {
      if (!user) throw new Error("User not authenticated");

      // Delete existing order entries for this user
      await supabase
        .from("user_team_order")
        .delete()
        .eq("user_id", user.id);

      // Insert new order entries
      if (teamIds.length > 0) {
        const orderEntries = teamIds.map((teamId, index) => ({
          user_id: user.id,
          team_id: teamId,
          display_order: index,
        }));

        const { error } = await supabase
          .from("user_team_order")
          .insert(orderEntries);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
    },
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

      // Remove from team
      const { error } = await supabase.rpc("remove_user_from_team", {
        p_team_id: teamId,
        p_user_id: user.id,
      });

      if (error) throw error;

      // Also remove from order table
      await supabase
        .from("user_team_order")
        .delete()
        .eq("user_id", user.id)
        .eq("team_id", teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useSearchExistingTeams = (search: string) => {
  return useQuery({
    queryKey: ["search-existing-teams", search],
    queryFn: async () => {
      if (!search || search.trim().length < 2) return [];

      const { data, error } = await supabase
        .from("times")
        .select(`
          id,
          nome,
          escudo_url,
          estado_id,
          pais_id,
          selected_by_users,
          user_id,
          estado:estados(id, nome, uf),
          pais:paises(id, nome, bandeira_url)
        `)
        .ilike("nome", `%${search.trim()}%`)
        .order("nome")
        .limit(10);

      if (error) throw error;
      return data as Team[];
    },
    enabled: search.trim().length >= 2,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ nome, estadoId, paisId, escudoUrl }: { nome: string; estadoId: number | null; paisId: number | null; escudoUrl?: string | null }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("times")
        .insert({
          nome: nome.trim(),
          estado_id: estadoId,
          pais_id: paisId,
          escudo_url: escudoUrl || null,
          selected_by_users: [user.id],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["search-existing-teams"] });
    },
  });
};
