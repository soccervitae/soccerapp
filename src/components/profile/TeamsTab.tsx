import { useUserTeams, useRemoveUserFromTeam } from "@/hooks/useTeams";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import { toast } from "sonner";

interface TeamsTabProps {
  userId?: string;
  isLoading?: boolean;
}

export const TeamsTab = ({ userId, isLoading = false }: TeamsTabProps) => {
  const { user } = useAuth();
  const { data: teams = [], isLoading: teamsLoading } = useUserTeams(userId);
  const removeUserFromTeam = useRemoveUserFromTeam();

  const isOwnProfile = user?.id === userId;

  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    try {
      await removeUserFromTeam.mutateAsync(teamId);
      toast.success(`${teamName} removido`);
    } catch (error) {
      toast.error("Erro ao remover time");
    }
  };

  if (isLoading || teamsLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[200px]">
        <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">
          shield
        </span>
        <p className="text-muted-foreground text-sm mt-2">Nenhum time ainda</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      {teams.map((team) => (
        <div
          key={team.id}
          className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-muted/50 transition-colors relative group"
        >
          {/* Remove Button - Only for own profile */}
          {isOwnProfile && (
            <button
              onClick={() => handleRemoveTeam(team.id, team.nome)}
              disabled={removeUserFromTeam.isPending}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Team Logo */}
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
            {team.escudo_url ? (
              <img
                src={team.escudo_url}
                alt={team.nome}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <span className="material-symbols-outlined text-3xl text-muted-foreground">
                shield
              </span>
            )}
          </div>

          {/* Team Info */}
          <div className="text-center w-full">
            <p className="font-semibold text-sm text-foreground truncate">{team.nome}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[team.estado?.uf, team.pais?.nome].filter(Boolean).join(" • ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
