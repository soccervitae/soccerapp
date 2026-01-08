import { useState } from "react";
import { useDeleteAchievement } from "@/hooks/useProfile";
import { useUserTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { AddAchievementSheet } from "./AddAchievementSheet";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Achievement {
  id: string;
  year: number;
  team_name: string | null;
  championship_name: string | null;
  custom_achievement_name: string | null;
  description: string | null;
  achievement_type: {
    name: string;
    icon: string;
    color: string | null;
    category: string | null;
  } | null;
}

interface AchievementsTabProps {
  achievements: Achievement[];
  isLoading?: boolean;
  isOwnProfile?: boolean;
  userId?: string;
}

export const AchievementsTab = ({ achievements, isLoading = false, isOwnProfile = false, userId }: AchievementsTabProps) => {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showNoTeamsSheet, setShowNoTeamsSheet] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Achievement | null>(null);
  
  const { user } = useAuth();
  const { data: userTeams = [] } = useUserTeams(userId || user?.id);
  const deleteAchievement = useDeleteAchievement();

  const handleAddClick = () => {
    if (userTeams.length === 0) {
      setShowNoTeamsSheet(true);
    } else {
      setEditData(null);
      setShowAddSheet(true);
    }
  };

  const handleEditClick = (achievement: Achievement) => {
    setEditData(achievement);
    setShowAddSheet(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAchievement.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleSheetClose = (open: boolean) => {
    setShowAddSheet(open);
    if (!open) {
      setEditData(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 px-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted rounded-xl p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-muted-foreground/20 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 px-1 pb-8">
        {/* Add button for own profile */}
        {isOwnProfile && (
          <button
            onClick={handleAddClick}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Adicionar Conquista
          </button>
        )}

        {achievements.length === 0 && !isOwnProfile ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">military_tech</span>
            <p className="text-muted-foreground text-sm mt-2">Nenhuma conquista ainda</p>
          </div>
        ) : (
          achievements.map((achievement) => {
            const achievementName = achievement.achievement_type?.name || achievement.custom_achievement_name || "Conquista";
            const teamData = userTeams.find(t => t.nome === achievement.team_name);
            
            return (
              <div 
                key={achievement.id} 
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex gap-3">
                  {/* Team Logo */}
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {teamData?.escudo_url ? (
                      <img 
                        src={teamData.escudo_url} 
                        alt={achievement.team_name || "Time"}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[24px] text-muted-foreground">shield</span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{achievementName}</h3>
                      {achievement.championship_name && (
                        <span className="text-sm text-muted-foreground truncate">
                          • {achievement.championship_name}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      {achievement.team_name && (
                        <>
                          <span className="truncate">{achievement.team_name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{achievement.year}</span>
                    </div>
                    
                    {achievement.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {achievement.description}
                      </p>
                    )}
                  </div>

                  {/* Options menu */}
                  {isOwnProfile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem 
                          onClick={() => handleEditClick(achievement)}
                          className="gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(achievement.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Sheet */}
      <AddAchievementSheet 
        open={showAddSheet} 
        onOpenChange={handleSheetClose} 
        userTeams={userTeams}
        editData={editData}
      />

      {/* No Teams Warning Sheet */}
      <ResponsiveModal open={showNoTeamsSheet} onOpenChange={setShowNoTeamsSheet}>
        <ResponsiveModalContent className="sm:max-w-sm">
          <ResponsiveModalHeader className="pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] text-muted-foreground">shield</span>
            </div>
            <ResponsiveModalTitle className="text-center">
              Adicione um time primeiro
            </ResponsiveModalTitle>
            <ResponsiveModalDescription className="text-center">
              Para adicionar uma conquista, você precisa ter pelo menos um time no seu perfil. Vá até a aba "Times" e adicione um time.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          <Button 
            className="w-full" 
            onClick={() => setShowNoTeamsSheet(false)}
          >
            Entendi
          </Button>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Delete Confirmation - Responsive */}
      <ResponsiveAlertModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Conquista?"
        description="Esta ação não pode ser desfeita. A conquista será removida permanentemente do seu perfil."
        cancelText="Cancelar"
        confirmText="Remover"
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />
    </>
  );
};