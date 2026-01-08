import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Team } from "@/hooks/useTeams";

interface SortableTeamItemProps {
  team: Team;
  isOwnProfile: boolean;
  onRemove: (teamId: string) => void;
  isRemoving: boolean;
}

export const SortableTeamItem = ({
  team,
  isOwnProfile,
  onRemove,
  isRemoving,
}: SortableTeamItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors group ${
        isDragging ? "shadow-lg" : "hover:bg-muted/50"
      }`}
    >
      {/* Drag Handle - Only for own profile */}
      {isOwnProfile && (
        <button
          {...attributes}
          {...listeners}
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Team Logo */}
      <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
        {team.escudo_url ? (
          <img
            src={team.escudo_url}
            alt={team.nome}
            className="w-full h-full object-contain p-1.5"
            draggable={false}
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

      {/* Remove Button - Only for own profile */}
      {isOwnProfile && (
        <button
          onClick={() => onRemove(team.id)}
          disabled={isRemoving}
          className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
