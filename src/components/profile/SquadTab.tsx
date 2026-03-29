import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSquadMembers, usePendingRequests, useUpdateSquadRequest, useRemoveSquadMember } from "@/hooks/useSquadMembers";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface SquadTabProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const POSITION_GROUPS: Record<string, string[]> = {
  "Goleiro": ["Goleiro", "Goleira"],
  "Defesa": ["Zagueiro", "Zagueira", "Lateral Direito", "Lateral Esquerdo", "Lateral Direita", "Lateral Esquerda"],
  "Meio-Campo": ["Volante", "Meia", "Meio-Campista", "Meia Atacante"],
  "Ataque": ["Atacante", "Centroavante", "Ponta Direita", "Ponta Esquerda"],
};

function getPositionGroup(positionName: string | null | undefined): string {
  if (!positionName) return "Outros";
  for (const [group, positions] of Object.entries(POSITION_GROUPS)) {
    if (positions.some(p => positionName.toLowerCase().includes(p.toLowerCase()))) {
      return group;
    }
  }
  return "Outros";
}

export const SquadTab = ({ userId, isOwnProfile }: SquadTabProps) => {
  const navigate = useNavigate();
  const { data: members = [], isLoading } = useSquadMembers(userId);
  const { data: pendingRequests = [] } = usePendingRequests(userId);
  const updateRequest = useUpdateSquadRequest();
  const removeMember = useRemoveSquadMember();
  const [filter, setFilter] = useState<string>("all");

  // Only show members with avatar for the grid
  const membersWithAvatar = members.filter(m => !!m.athlete?.avatar_url);

  const filteredMembers = filter === "all"
    ? membersWithAvatar
    : membersWithAvatar.filter(m => getPositionGroup(m.athlete?.position_name) === filter);

  const availableGroups = [...new Set(membersWithAvatar.map(m => getPositionGroup(m.athlete?.position_name)))];

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      {/* Pending requests - only for team owner */}
      {isOwnProfile && pendingRequests.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
            <span className="material-symbols-outlined text-[20px] text-amber-500">pending</span>
            <h4 className="font-semibold text-sm text-foreground">
              Solicitações pendentes ({pendingRequests.length})
            </h4>
          </div>
          {pendingRequests.map(req => (
            <div key={req.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0">
              <div
                className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => req.athlete && navigate(`/${req.athlete.username}`)}
              >
                {req.athlete?.avatar_url ? (
                  <img src={req.athlete.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-muted-foreground">person</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold text-foreground truncate cursor-pointer hover:underline"
                  onClick={() => req.athlete && navigate(`/${req.athlete.username}`)}
                >
                  {req.athlete?.nickname || req.athlete?.full_name || req.athlete?.username}
                </p>
                <p className="text-xs text-muted-foreground">@{req.athlete?.username}</p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 text-xs"
                  disabled={updateRequest.isPending}
                  onClick={() => updateRequest.mutate({ requestId: req.id, status: "approved", teamProfileId: userId! })}
                >
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  disabled={updateRequest.isPending}
                  onClick={() => updateRequest.mutate({ requestId: req.id, status: "rejected", teamProfileId: userId! })}
                >
                  Recusar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Position filter */}
      {members.length > 0 && availableGroups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todos ({membersWithAvatar.length})
          </button>
          {availableGroups.map(group => {
            const count = membersWithAvatar.filter(m => getPositionGroup(m.athlete?.position_name) === group).length;
            return (
              <button
                key={group}
                onClick={() => setFilter(group)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === group
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {group} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Members list */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="relative aspect-square cursor-pointer group"
              onClick={() => member.athlete && navigate(`/${member.athlete.username}`)}
            >
              <img
                src={member.athlete?.avatar_url!}
                alt={member.athlete?.username || ""}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pb-2 text-center px-1">
                  <p className="text-white text-xs font-semibold truncate">
                    {member.athlete?.nickname || member.athlete?.full_name || member.athlete?.username}
                  </p>
                  {member.athlete?.position_name && (
                    <p className="text-white/70 text-[10px] truncate">{member.athlete.position_name}</p>
                  )}
                </div>
              </div>
              {isOwnProfile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMember.mutate({ memberId: member.id, teamProfileId: userId! });
                  }}
                  disabled={removeMember.isPending}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  title="Remover do elenco"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[40px]">groups</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Elenco</h3>
          <p className="text-sm text-center max-w-xs">
            {isOwnProfile
              ? "Quando atletas solicitarem fazer parte do seu elenco, eles aparecerão aqui."
              : "Nenhum atleta vinculado ao elenco ainda."
            }
          </p>
        </div>
      )}
    </div>
  );
};
