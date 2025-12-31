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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  const [countrySearch, setCountrySearch] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  
  // Local state for batch selection
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addUserToTeam = useAddUserToTeam();
  const removeUserFromTeam = useRemoveUserFromTeam();

  // Initialize local selections when sheet opens or selectedTeamIds change
  useEffect(() => {
    if (open) {
      setLocalSelectedIds(selectedTeamIds);
    }
  }, [open, selectedTeamIds]);

  // Reset to first step when sheet closes
  useEffect(() => {
    if (!open) {
      setStep("country");
      setPaisId(null);
      setEstadoId(null);
      setSearchInput("");
      setCountrySearch("");
    }
  }, [open]);

  // Check if there are pending changes
  const hasChanges = JSON.stringify([...localSelectedIds].sort()) !== 
                     JSON.stringify([...selectedTeamIds].sort());

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

  // Toggle team selection locally (no immediate save)
  const handleTeamToggle = (team: Team) => {
    setLocalSelectedIds(prev => 
      prev.includes(team.id)
        ? prev.filter(id => id !== team.id)
        : [...prev, team.id]
    );
  };

  // Save all changes at once
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const toAdd = localSelectedIds.filter(id => !selectedTeamIds.includes(id));
      const toRemove = selectedTeamIds.filter(id => !localSelectedIds.includes(id));

      await Promise.all([
        ...toAdd.map(id => addUserToTeam.mutateAsync(id)),
        ...toRemove.map(id => removeUserFromTeam.mutateAsync(id))
      ]);

      toast.success("Times atualizados!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao salvar times");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle sheet close with confirmation if there are unsaved changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasChanges) {
      setShowDiscardDialog(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    setLocalSelectedIds(selectedTeamIds);
    onOpenChange(false);
  };

  const handleSaveAndClose = async () => {
    setShowDiscardDialog(false);
    await handleSave();
  };

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
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
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
              {step === "teams" ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="h-8 px-3"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              ) : (
                <div className="w-8" />
              )}
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
            <>
              {/* Country Search */}
              <div className="px-4 py-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar país..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {countrySearch && (
                    <button
                      onClick={() => setCountrySearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {countriesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    countries
                      .filter((country) =>
                        country.nome.toLowerCase().includes(countrySearch.toLowerCase())
                      )
                      .map((country) => (
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
            </>
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
                    <>
                      <p className="text-xs text-muted-foreground text-center mb-3">
                        Toque nos times para selecionar
                      </p>
                      {teams.map((team) => {
                        const isSelected = localSelectedIds.includes(team.id);
                        return (
                          <button
                            key={team.id}
                            onClick={() => handleTeamToggle(team)}
                            disabled={isSaving}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                              isSelected
                                ? "bg-primary/10 border-2 border-primary"
                                : "bg-card border border-border hover:bg-muted"
                            } disabled:opacity-50`}
                          >
                            {/* Selection indicator - always visible */}
                            <div 
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected 
                                  ? "bg-primary border-primary" 
                                  : "border-muted-foreground/40 bg-transparent"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary-foreground" />
                              )}
                            </div>

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
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Selected count */}
          {localSelectedIds.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-muted/50">
              <p className="text-sm text-center text-muted-foreground">
                {localSelectedIds.length} time{localSelectedIds.length !== 1 ? "s" : ""} selecionado
                {localSelectedIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Discard changes confirmation dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem times selecionados que não foram salvos. Deseja descartar essas alterações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndClose}>
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
