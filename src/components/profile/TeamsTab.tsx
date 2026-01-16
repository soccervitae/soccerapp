import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useUserTeams, useRemoveUserFromTeam, useUpdateTeamOrder, Team } from "@/hooks/useTeams";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { SortableTeamItem } from "@/components/profile/SortableTeamItem";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";

interface TeamsTabProps {
  userId?: string;
  isLoading?: boolean;
}

export const TeamsTab = ({ userId, isLoading = false }: TeamsTabProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: teams = [], isLoading: teamsLoading } = useUserTeams(userId);
  const removeUserFromTeam = useRemoveUserFromTeam();
  const updateTeamOrder = useUpdateTeamOrder();
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

  const isOwnProfile = user?.id === userId;

  // Sync local teams with fetched teams
  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localTeams.findIndex((t) => t.id === active.id);
      const newIndex = localTeams.findIndex((t) => t.id === over.id);

      const newTeams = arrayMove(localTeams, oldIndex, newIndex);
      setLocalTeams(newTeams);

      // Save new order to database
      updateTeamOrder.mutate(newTeams.map((t) => t.id));
    }
  };

  const handleRemoveTeam = async () => {
    if (!deleteTeamId) return;
    try {
      await removeUserFromTeam.mutateAsync(deleteTeamId);
      setDeleteTeamId(null);
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

  if (localTeams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[200px]">
        <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">
          shield
        </span>
        <p className="text-muted-foreground text-sm mt-2">Nenhum time ainda</p>
        {isOwnProfile && (
          <button
            onClick={() => navigate("/select-teams")}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar time
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mb-8">
      {isOwnProfile && (
        <button
          onClick={() => navigate("/select-teams")}
          className="bg-card border border-dashed border-border rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">Adicionar time</span>
        </button>
      )}

      {isOwnProfile ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localTeams.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {localTeams.map((team) => (
              <SortableTeamItem
                key={team.id}
                team={team}
                isOwnProfile={isOwnProfile}
                onRemove={(teamId) => setDeleteTeamId(teamId)}
                isRemoving={removeUserFromTeam.isPending}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        localTeams.map((team) => (
          <div
            key={team.id}
            className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
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
              <p className="font-semibold text-sm text-foreground truncate">
                {team.nome}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {[team.estado?.uf, team.pais?.nome].filter(Boolean).join(" • ")}
              </p>
            </div>
          </div>
        ))
      )}


      {/* Delete Confirmation */}
      <ResponsiveAlertModal
        open={!!deleteTeamId}
        onOpenChange={(open) => !open && setDeleteTeamId(null)}
        title="Remover Time?"
        description="Tem certeza que deseja remover este time do seu perfil?"
        cancelText="Cancelar"
        confirmText="Remover"
        onConfirm={handleRemoveTeam}
        confirmVariant="destructive"
      />
    </div>
  );
};
