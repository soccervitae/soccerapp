import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { useAddAchievement, useAchievementTypes } from "@/hooks/useProfile";

interface AddAchievementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

export const AddAchievementSheet = ({ open, onOpenChange }: AddAchievementSheetProps) => {
  const [achievementTypeId, setAchievementTypeId] = useState("");
  const [customName, setCustomName] = useState("");
  const [championship, setChampionship] = useState("");
  const [team, setTeam] = useState("");
  const [year, setYear] = useState<string>("");
  const [description, setDescription] = useState("");

  const { data: achievementTypes = [] } = useAchievementTypes();
  const addAchievement = useAddAchievement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!year || (!achievementTypeId && !customName.trim())) return;

    await addAchievement.mutateAsync({
      achievement_type_id: achievementTypeId || undefined,
      custom_achievement_name: !achievementTypeId ? customName.trim() : undefined,
      championship_name: championship.trim() || undefined,
      team_name: team.trim() || undefined,
      year: parseInt(year),
      description: description.trim() || undefined,
    });

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">military_tech</span>
            Adicionar Conquista
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pb-8">
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
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">{type.icon}</span>
                      {type.name}
                    </span>
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
            <Input
              id="championship"
              placeholder="Ex: Copa do Brasil"
              value={championship}
              onChange={(e) => setChampionship(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Time</Label>
            <Input
              id="team"
              placeholder="Ex: Palmeiras"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
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
            disabled={!isValid || addAchievement.isPending}
          >
            {addAchievement.isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                Salvando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">save</span>
                Salvar Conquista
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
