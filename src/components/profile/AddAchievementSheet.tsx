import { useState, useEffect } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddAchievement, useUpdateAchievement, useAchievementTypes, useUserChampionships } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { type Team } from "@/hooks/useTeams";
import { ScrollArea } from "@/components/ui/scroll-area";
interface AchievementData {
  id: string;
  year: number;
  team_name: string | null;
  championship_name: string | null;
  custom_achievement_name: string | null;
  description: string | null;
  achievement_type_id?: string | null;
  achievement_type?: {
    id?: string;
    name: string;
    icon: string;
    color: string | null;
    category: string | null;
  } | null;
}

interface AddAchievementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTeams: Team[];
  editData?: AchievementData | null;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

export const AddAchievementSheet = ({ open, onOpenChange, userTeams, editData }: AddAchievementSheetProps) => {
  const [achievementTypeId, setAchievementTypeId] = useState("");
  const [customName, setCustomName] = useState("");
  const [championship, setChampionship] = useState("");
  const [team, setTeam] = useState("");
  const [year, setYear] = useState<string>("");
  const [description, setDescription] = useState("");

  const { user } = useAuth();
  const { data: achievementTypes = [] } = useAchievementTypes();
  const { data: userChampionships = [] } = useUserChampionships(user?.id);
  const addAchievement = useAddAchievement();
  const updateAchievement = useUpdateAchievement();

  const isEditing = !!editData;

  // Populate form when editing
  useEffect(() => {
    if (editData && open) {
      // Try to find the achievement type by name if we have one
      const matchingType = achievementTypes.find(t => t.name === editData.achievement_type?.name);
      setAchievementTypeId(matchingType?.id || editData.achievement_type_id || "");
      setCustomName(editData.custom_achievement_name || "");
      setChampionship(editData.championship_name || "");
      setTeam(editData.team_name || "");
      setYear(editData.year.toString());
      setDescription(editData.description || "");
    } else if (!open) {
      // Reset form when closing
      setAchievementTypeId("");
      setCustomName("");
      setChampionship("");
      setTeam("");
      setYear("");
      setDescription("");
    }
  }, [editData, open, achievementTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!year || (!achievementTypeId && !customName.trim())) return;

    const achievementData = {
      achievement_type_id: achievementTypeId || undefined,
      custom_achievement_name: !achievementTypeId ? customName.trim() : undefined,
      championship_name: championship.trim() || undefined,
      team_name: team || undefined,
      year: parseInt(year),
      description: description.trim() || undefined,
    };

    if (isEditing && editData) {
      await updateAchievement.mutateAsync({
        id: editData.id,
        ...achievementData,
      });
    } else {
      await addAchievement.mutateAsync(achievementData);
    }

    // Reset form
    setAchievementTypeId("");
    setCustomName("");
    setChampionship("");
    setTeam("");
    setYear("");
    setDescription("");
    onOpenChange(false);
  };

  const isValid = year && (achievementTypeId || customName.trim());
  const isPending = addAchievement.isPending || updateAchievement.isPending;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col">
        <ResponsiveModalHeader className="pb-4">
          <ResponsiveModalTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">military_tech</span>
            {isEditing ? "Editar Conquista" : "Adicionar Conquista"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4 pb-8 px-1">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Conquista *</Label>
              <Select value={achievementTypeId} onValueChange={(v) => {
                setAchievementTypeId(v);
                if (v) setCustomName("");
              }}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {achievementTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!achievementTypeId && (
              <div className="space-y-2">
                <Label htmlFor="customName">Ou digite um nome personalizado *</Label>
                <Input
                  id="customName"
                  placeholder="Ex: Melhor em Campo"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Select value={year} onValueChange={setYear} required>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="championship">Campeonato</Label>
              <Select value={championship} onValueChange={setChampionship}>
                <SelectTrigger id="championship">
                  <SelectValue placeholder="Selecione o campeonato" />
                </SelectTrigger>
                <SelectContent>
                  {userChampionships.map((c) => (
                    <SelectItem key={c.id} value={c.championship?.name || c.custom_championship_name || ""}>
                      {c.championship?.name || c.custom_championship_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Time *</Label>
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger id="team">
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  {userTeams.map((t) => (
                    <SelectItem key={t.id} value={t.nome}>
                      <span className="flex items-center gap-2">
                        {t.escudo_url ? (
                          <img src={t.escudo_url} alt={t.nome} className="w-5 h-5 object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px] text-muted-foreground">shield</span>
                        )}
                        {t.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Detalhes sobre a conquista..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={!isValid || isPending}
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">save</span>
                  {isEditing ? "Atualizar Conquista" : "Salvar Conquista"}
                </>
              )}
            </Button>
          </form>
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};