import { useState } from "react";
import { useDeleteChampionship } from "@/hooks/useProfile";
import { useUserTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { AddChampionshipSheet } from "./AddChampionshipSheet";
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

interface Championship {
  id: string;
  year: number;
  team_name: string | null;
  position_achieved: string | null;
  games_played: number | null;
  goals_scored: number | null;
  custom_championship_name: string | null;
  championship: {
    name: string;
    logo_url: string | null;
  } | null;
}

interface ChampionshipsTabProps {
  championships: Championship[];
  isLoading?: boolean;
  isOwnProfile?: boolean;
}

export const ChampionshipsTab = ({ championships, isLoading = false, isOwnProfile = false }: ChampionshipsTabProps) => {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showNoTeamsSheet, setShowNoTeamsSheet] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { data: userTeams = [] } = useUserTeams(user?.id);
  const deleteChampionship = useDeleteChampionship();

  const handleAddClick = () => {
    if (userTeams.length === 0) {
      setShowNoTeamsSheet(true);
    } else {
      setShowAddSheet(true);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteChampionship.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 px-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted rounded-xl p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-muted-foreground/20 rounded-lg" />
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
            Adicionar Campeonato
          </button>
        )}

        {championships.length === 0 && !isOwnProfile ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">emoji_events</span>
            <p className="text-muted-foreground text-sm mt-2">Nenhum campeonato ainda</p>
          </div>
        ) : (
          championships.map((champ) => {
            const champName = champ.championship?.name || champ.custom_championship_name || "Campeonato";
            const teamData = userTeams.find(t => t.nome === champ.team_name);
            
            return (
              <div 
                key={champ.id} 
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex gap-3">
                  {/* Team Logo */}
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {teamData?.escudo_url ? (
                      <img 
                        src={teamData.escudo_url} 
                        alt={champ.team_name || "Time"}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[24px] text-muted-foreground">shield</span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{champName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {champ.team_name && (
                        <>
                          <span className="truncate">{champ.team_name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{champ.year}</span>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex gap-4 mt-2">
                      {champ.games_played !== null && champ.games_played > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="material-symbols-outlined text-[14px] text-muted-foreground">sports_soccer</span>
                          <span className="text-muted-foreground">{champ.games_played} jogos</span>
                        </div>
                      )}
                      {champ.goals_scored !== null && champ.goals_scored > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="material-symbols-outlined text-[14px] text-muted-foreground">target</span>
                          <span className="text-muted-foreground">{champ.goals_scored} gols</span>
                        </div>
                      )}
                    </div>
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
                        <DropdownMenuItem className="gap-2">
                          <Pencil className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(champ.id)}
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

      {/* Add Sheet */}
      <AddChampionshipSheet 
        open={showAddSheet} 
        onOpenChange={setShowAddSheet} 
        userTeams={userTeams}
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
              Para adicionar um campeonato, você precisa ter pelo menos um time no seu perfil. Vá até a aba "Times" e adicione um time.
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
        title="Remover Campeonato?"
        description="Esta ação não pode ser desfeita. O campeonato será removido permanentemente do seu perfil."
        cancelText="Cancelar"
        confirmText="Remover"
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />
    </>
  );
};
