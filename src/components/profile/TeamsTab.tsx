import { useUserTeams, type Team } from "@/hooks/useTeams";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamsTabProps {
  userId?: string;
  isLoading?: boolean;
}

export const TeamsTab = ({ userId, isLoading = false }: TeamsTabProps) => {
  const { data: teams = [], isLoading: teamsLoading } = useUserTeams(userId);

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
          className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-muted/50 transition-colors"
        >
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
