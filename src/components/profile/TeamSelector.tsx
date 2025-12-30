import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTeams, useAddUserToTeam, useRemoveUserFromTeam, type Team } from "@/hooks/useTeams";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Button } from "@/components/ui/button";

interface TeamSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTeamIds: string[];
}

type Step = "country" | "state" | "teams";

export const TeamSelector = ({ open, onOpenChange, selectedTeamIds }: TeamSelectorProps) => {
  const [step, setStep] = useState<Step>("country");
  const [paisId, setPaisId] = useState<number | null>(null);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const addUserToTeam = useAddUserToTeam();
  const removeUserFromTeam = useRemoveUserFromTeam();

  // Reset to first step when sheet closes
  useEffect(() => {
    if (!open) {
      setStep("country");
      setPaisId(null);
      setEstadoId(null);
      setSearchInput("");
    }
  }, [open]);

  // Fetch countries
  const { data: countries = [], isLoading: countriesLoading } = useQuery({
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
  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ["states", paisId],
    queryFn: async () => {
      if (!paisId) return [];
      const { data, error } = await supabase
        .from("estados")
        .select("id, nome, uf, bandeira_url")
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

  const selectedCountry = countries.find((c) => c.id === paisId);
  const selectedState = states.find((s) => s.id === estadoId);

  const handleCountrySelect = (countryId: number) => {
    setPaisId(countryId);
    setStep("state");
  };

  const handleStateSelect = (stateId: number) => {
    setEstadoId(stateId);
    setStep("teams");
  };

  const handleBack = () => {
    if (step === "state") {
      setStep("country");
      setPaisId(null);
    } else if (step === "teams") {
      setStep("state");
      setEstadoId(null);
      setSearchInput("");
    }
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

  const getStepTitle = () => {
    switch (step) {
      case "country":
        return "Selecionar País";
      case "state":
        return "Selecionar Estado";
      case "teams":
        return "Selecionar Time";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            {step !== "country" ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            ) : (
              <div className="w-8" />
            )}
            <SheetTitle className="text-center flex-1">{getStepTitle()}</SheetTitle>
            <div className="w-8" />
          </div>

          {/* Breadcrumb showing selections */}
          {(selectedCountry || selectedState) && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
              {selectedCountry && (
                <div className="flex items-center gap-1">
                  {selectedCountry.bandeira_url && (
                    <img
                      src={selectedCountry.bandeira_url}
                      alt=""
                      className="w-4 h-3 object-cover rounded-sm"
                    />
                  )}
                  <span>{selectedCountry.nome}</span>
                </div>
              )}
              {selectedState && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span>{selectedState.nome}</span>
                </>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Step 1: Country Selection */}
        {step === "country" && (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {countriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                countries.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => handleCountrySelect(country.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-10 h-7 rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {country.bandeira_url ? (
                        <img
                          src={country.bandeira_url}
                          alt={country.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">🏳️</span>
                      )}
                    </div>
                    <span className="font-medium text-foreground flex-1">{country.nome}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {/* Step 2: State Selection */}
        {step === "state" && (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {statesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : states.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum estado encontrado</p>
                </div>
              ) : (
                states.map((state) => (
                  <button
                    key={state.id}
                    onClick={() => handleStateSelect(state.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-left"
                  >
                    {state.bandeira_url && (
                      <div className="w-10 h-7 rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                        <img
                          src={state.bandeira_url}
                          alt={state.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{state.nome}</span>
                      <span className="text-muted-foreground ml-2">({state.uf})</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {/* Step 3: Team Selection */}
        {step === "teams" && (
          <>
            {/* Search */}
            <div className="px-4 py-3 border-b border-border">
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
                    <p className="text-sm mt-1">Tente buscar por outro nome</p>
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
                            {[team.estado?.nome, team.pais?.nome].filter(Boolean).join(" • ")}
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
          </>
        )}

        {/* Selected count */}
        {selectedTeamIds.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/50">
            <p className="text-sm text-center text-muted-foreground">
              {selectedTeamIds.length} time{selectedTeamIds.length !== 1 ? "s" : ""} selecionado
              {selectedTeamIds.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
