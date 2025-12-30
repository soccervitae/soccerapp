import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, Search, X } from "lucide-react";
import { useTeams, useAddUserToTeam, useRemoveUserFromTeam, type Team } from "@/hooks/useTeams";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface TeamSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTeamIds: string[];
}

export const TeamSelector = ({ open, onOpenChange, selectedTeamIds }: TeamSelectorProps) => {
  const [paisId, setPaisId] = useState<number | null>(null);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const addUserToTeam = useAddUserToTeam();
  const removeUserFromTeam = useRemoveUserFromTeam();

  // Fetch countries
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paises")
        .select("id, nome, bandeira_url")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch states based on selected country
  const { data: states = [] } = useQuery({
    queryKey: ["states", paisId],
    queryFn: async () => {
      if (!paisId) return [];
      const { data, error } = await supabase
        .from("estados")
        .select("id, nome, uf")
        .eq("pais_id", paisId)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!paisId,
  });

  // Fetch teams with filters
  const { data: teams = [], isLoading: teamsLoading } = useTeams({
    paisId,
    estadoId,
    search: debouncedSearch,
  });

  const handleCountryChange = (value: string) => {
    const newPaisId = value === "all" ? null : Number(value);
    setPaisId(newPaisId);
    setEstadoId(null); // Reset state when country changes
  };

  const handleStateChange = (value: string) => {
    setEstadoId(value === "all" ? null : Number(value));
  };

  const handleTeamToggle = (team: Team) => {
    const isSelected = selectedTeamIds.includes(team.id);
    if (isSelected) {
      removeUserFromTeam.mutate(team.id);
    } else {
      addUserToTeam.mutate(team.id);
    }
  };

  const isPending = addUserToTeam.isPending || removeUserFromTeam.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-center">Selecionar Times</SheetTitle>
        </SheetHeader>

        {/* Filters */}
        <div className="px-4 space-y-3 pb-3 border-b border-border">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar time..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Country and State filters */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={paisId?.toString() || "all"} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id.toString()}>
                    <div className="flex items-center gap-2">
                      {country.bandeira_url && (
                        <img
                          src={country.bandeira_url}
                          alt=""
                          className="w-4 h-3 object-cover rounded-sm"
                        />
                      )}
                      <span>{country.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={estadoId?.toString() || "all"}
              onValueChange={handleStateChange}
              disabled={!paisId || states.length === 0}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state.id} value={state.id.toString()}>
                    {state.nome} ({state.uf})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Teams List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {teamsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum time encontrado</p>
                <p className="text-sm mt-1">Tente ajustar os filtros</p>
              </div>
            ) : (
              teams.map((team) => {
                const isSelected = selectedTeamIds.includes(team.id);
                return (
                  <button
                    key={team.id}
                    onClick={() => handleTeamToggle(team)}
                    disabled={isPending}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                      isSelected
                        ? "bg-primary/10 border border-primary"
                        : "bg-card border border-border hover:bg-muted"
                    } disabled:opacity-50`}
                  >
                    {/* Team Logo */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {team.escudo_url ? (
                        <img
                          src={team.escudo_url}
                          alt={team.nome}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-2xl text-muted-foreground">
                          shield
                        </span>
                      )}
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{team.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[
                          team.estado?.nome,
                          team.pais?.nome,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Selected count */}
        {selectedTeamIds.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/50">
            <p className="text-sm text-center text-muted-foreground">
              {selectedTeamIds.length} time{selectedTeamIds.length !== 1 ? "s" : ""} selecionado{selectedTeamIds.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
