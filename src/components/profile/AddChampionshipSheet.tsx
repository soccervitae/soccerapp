import { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddChampionship } from "@/hooks/useProfile";
import { useUserTeams, type Team } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddChampionshipSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTeams: Team[];
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

const positions = [
  "Campeão",
  "Vice-campeão",
  "3º Lugar",
  "4º Lugar",
  "Semifinalista",
  "Quartas de Final",
  "Oitavas de Final",
  "Fase de Grupos",
];

export const AddChampionshipSheet = ({ open, onOpenChange, userTeams }: AddChampionshipSheetProps) => {
  const [name, setName] = useState("");
  const [year, setYear] = useState<string>("");
  const [team, setTeam] = useState("");
  const [position, setPosition] = useState("");
  const [games, setGames] = useState("");
  const [goals, setGoals] = useState("");

  const addChampionship = useAddChampionship();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !year) return;

    await addChampionship.mutateAsync({
      custom_championship_name: name.trim(),
      year: parseInt(year),
      team_name: team || undefined,
      position_achieved: position || undefined,
      games_played: games ? parseInt(games) : undefined,
      goals_scored: goals ? parseInt(goals) : undefined,
    });

    // Reset form
    setName("");
    setYear("");
    setTeam("");
    setPosition("");
    setGames("");
    setGoals("");
    onOpenChange(false);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col">
        <ResponsiveModalHeader className="pb-4">
          <ResponsiveModalTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">emoji_events</span>
            Adicionar Campeonato
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4 pb-8 px-1">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Campeonato *</Label>
              <Input
                id="name"
                placeholder="Ex: Campeonato Brasileiro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano *</Label>
                <Select value={year} onValueChange={setYear} required>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Selecione" />
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
                <Label htmlFor="position">Posição</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="games">Jogos Disputados</Label>
                <Input
                  id="games"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={games}
                  onChange={(e) => setGames(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Gols Marcados</Label>
                <Input
                  id="goals"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={!name.trim() || !year || addChampionship.isPending}
            >
              {addChampionship.isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">save</span>
                  Salvar Campeonato
                </>
              )}
            </Button>
          </form>
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
