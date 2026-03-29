import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SquadMember {
  id: string;
  team_profile_id: string;
  athlete_profile_id: string;
  status: string;
  created_at: string;
  athlete?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    nickname: string | null;
    posicaomas: number | null;
    posicaofem: number | null;
    gender: string | null;
    position_name?: string | null;
  };
}

// Fetch approved squad members for a team profile
export const useSquadMembers = (teamProfileId?: string) => {
  return useQuery({
    queryKey: ["squad-members", teamProfileId],
    queryFn: async (): Promise<SquadMember[]> => {
      if (!teamProfileId) return [];

      const { data, error } = await supabase
        .from("squad_members")
        .select("*")
        .eq("team_profile_id", teamProfileId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch athlete profiles
      const athleteIds = (data || []).map((m: any) => m.athlete_profile_id);
      if (athleteIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, nickname, posicaomas, posicaofem, gender")
        .in("id", athleteIds);

      if (profilesError) throw profilesError;

      // Fetch position names
      const malePositionIds = (profiles || []).filter(p => p.posicaomas).map(p => p.posicaomas!);
      const femalePositionIds = (profiles || []).filter(p => p.posicaofem).map(p => p.posicaofem!);

      let malePositions: Record<number, string> = {};
      let femalePositions: Record<number, string> = {};

      if (malePositionIds.length > 0) {
        const { data: mp } = await supabase
          .from("posicao_masculina")
          .select("id, name")
          .in("id", malePositionIds);
        if (mp) malePositions = Object.fromEntries(mp.map(p => [p.id, p.name]));
      }

      if (femalePositionIds.length > 0) {
        const { data: fp } = await supabase
          .from("posicao_feminina")
          .select("id, name")
          .in("id", femalePositionIds);
        if (fp) femalePositions = Object.fromEntries(fp.map(p => [p.id, p.name]));
      }

      const profileMap = Object.fromEntries(
        (profiles || []).map(p => [
          p.id,
          {
            ...p,
            position_name: p.posicaomas
              ? malePositions[p.posicaomas] || null
              : p.posicaofem
              ? femalePositions[p.posicaofem] || null
              : null,
          },
        ])
      );

      return (data || []).map((m: any) => ({
        ...m,
        athlete: profileMap[m.athlete_profile_id] || null,
      }));
    },
    enabled: !!teamProfileId,
  });
};

// Fetch pending requests for a team (only team owner)
export const usePendingRequests = (teamProfileId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["squad-pending", teamProfileId],
    queryFn: async (): Promise<SquadMember[]> => {
      if (!teamProfileId || user?.id !== teamProfileId) return [];

      const { data, error } = await supabase
        .from("squad_members")
        .select("*")
        .eq("team_profile_id", teamProfileId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const athleteIds = (data || []).map((m: any) => m.athlete_profile_id);
      if (athleteIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, nickname, posicaomas, posicaofem, gender")
        .in("id", athleteIds);

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return (data || []).map((m: any) => ({
        ...m,
        athlete: profileMap[m.athlete_profile_id] || null,
      }));
    },
    enabled: !!teamProfileId && user?.id === teamProfileId,
  });
};

// Check current user's request status for a team
export const useMySquadRequest = (teamProfileId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["squad-my-request", teamProfileId, user?.id],
    queryFn: async () => {
      if (!teamProfileId || !user?.id) return null;

      const { data, error } = await supabase
        .from("squad_members")
        .select("id, status")
        .eq("team_profile_id", teamProfileId)
        .eq("athlete_profile_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!teamProfileId && !!user?.id,
  });
};

// Request to join a team squad
export const useRequestJoinSquad = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (teamProfileId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("squad_members")
        .insert({
          team_profile_id: teamProfileId,
          athlete_profile_id: user.id,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: (_, teamProfileId) => {
      queryClient.invalidateQueries({ queryKey: ["squad-my-request", teamProfileId] });
      toast.success("Solicitação enviada!");
    },
    onError: () => {
      toast.error("Erro ao enviar solicitação");
    },
  });
};

// Cancel own pending request
export const useCancelSquadRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, teamProfileId }: { requestId: string; teamProfileId: string }) => {
      const { error } = await supabase
        .from("squad_members")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
      return teamProfileId;
    },
    onSuccess: (teamProfileId) => {
      queryClient.invalidateQueries({ queryKey: ["squad-my-request", teamProfileId] });
      toast.success("Solicitação cancelada");
    },
    onError: () => {
      toast.error("Erro ao cancelar solicitação");
    },
  });
};

// Approve or reject a request (team owner)
export const useUpdateSquadRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status, teamProfileId }: { requestId: string; status: "approved" | "rejected"; teamProfileId: string }) => {
      if (status === "rejected") {
        const { error } = await supabase
          .from("squad_members")
          .delete()
          .eq("id", requestId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("squad_members")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", requestId);
        if (error) throw error;
      }
      return teamProfileId;
    },
    onSuccess: (teamProfileId) => {
      queryClient.invalidateQueries({ queryKey: ["squad-members", teamProfileId] });
      queryClient.invalidateQueries({ queryKey: ["squad-pending", teamProfileId] });
      toast.success("Solicitação atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar solicitação");
    },
  });
};

// Remove a squad member (team owner)
export const useRemoveSquadMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, teamProfileId }: { memberId: string; teamProfileId: string }) => {
      const { error } = await supabase
        .from("squad_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      return teamProfileId;
    },
    onSuccess: (teamProfileId) => {
      queryClient.invalidateQueries({ queryKey: ["squad-members", teamProfileId] });
      toast.success("Atleta removido do elenco");
    },
    onError: () => {
      toast.error("Erro ao remover atleta");
    },
  });
};
