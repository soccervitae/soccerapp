import { useUserTeams, useRemoveUserFromTeam } from "@/hooks/useTeams";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";

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
    } catch (error) {
      console.error("Error removing team:", error);
    }
  };

  if (isLoading || teamsLoading) {
    return (
      <div className="flex flex-col gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
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
    <div className="flex flex-col gap-2 mb-8">
      {teams.map((team) => (
        <div
          key={team.id}
          className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors group"
        >
          {/* Team Logo */}
          <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
            {team.escudo_url ? (
              <img
                src={team.escudo_url}
                alt={team.nome}
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <span className="material-symbols-outlined text-2xl text-muted-foreground">
                shield
              </span>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{team.nome}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[team.estado?.uf, team.pais?.nome].filter(Boolean).join(" • ")}
            </p>
          </div>

          {/* Remove Button - Only for own profile */}
          {isOwnProfile && (
            <button
              onClick={() => handleRemoveTeam(team.id, team.nome)}
              disabled={removeUserFromTeam.isPending}
              className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
