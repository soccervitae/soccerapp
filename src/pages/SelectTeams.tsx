import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, Search, X, ChevronLeft, ChevronRight, Plus, Upload, ImageIcon } from "lucide-react";
import { useTeams, useAddUserToTeam, useRemoveUserFromTeam, useCreateTeam, useSearchExistingTeams, useUserTeams, type Team } from "@/hooks/useTeams";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUploadMedia } from "@/hooks/useUploadMedia";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useAuth } from "@/contexts/AuthContext";
import { useIsPWA } from "@/hooks/useIsPWA";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

type Step = "country" | "state" | "teams";

const SelectTeams = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPWA = useIsPWA();
  
  const [step, setStep] = useState<Step>("country");
  const [paisId, setPaisId] = useState<number | null>(null);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  
  // Get current user's teams
  const { data: userTeams = [] } = useUserTeams(user?.id);
  const selectedTeamIds = userTeams.map(t => t.id);
  
  // Local state for batch selection
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Add custom team dialog
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const debouncedNewTeamName = useDebouncedValue(newTeamName, 300);
  const [emblemFile, setEmblemFile] = useState<File | null>(null);
  const [emblemPreview, setEmblemPreview] = useState<string | null>(null);
  const emblemInputRef = useRef<HTMLInputElement>(null);

  const addUserToTeam = useAddUserToTeam();
  const removeUserFromTeam = useRemoveUserFromTeam();
  const createTeam = useCreateTeam();
  const { uploadMedia, isUploading } = useUploadMedia();
  const { compressImage } = useImageCompression();
  
  // Search for existing teams when adding new team
  const { data: existingTeams = [], isLoading: isSearchingExisting } = useSearchExistingTeams(debouncedNewTeamName);

  const handleEmblemSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEmblemFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEmblemPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearEmblem = () => {
    setEmblemFile(null);
    setEmblemPreview(null);
    if (emblemInputRef.current) {
      emblemInputRef.current.value = "";
    }
  };

  // Initialize local selections
  useEffect(() => {
    setLocalSelectedIds(selectedTeamIds);
  }, [selectedTeamIds.join(",")]);

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

  // Sort countries with Brazil first
  const sortedCountries = useMemo(() => {
    const brazil = countries.find(c => c.nome.toLowerCase() === "brasil");
    const otherCountries = countries.filter(c => c.nome.toLowerCase() !== "brasil");
    return brazil ? [brazil, ...otherCountries] : otherCountries;
  }, [countries]);

  // Filter countries by search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return sortedCountries;
    const query = countrySearch.toLowerCase();
    return sortedCountries.filter(c => c.nome.toLowerCase().includes(query));
  }, [sortedCountries, countrySearch]);

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

  // Check if the selected country is Brazil (has states)
  const isBrazil = selectedCountry?.nome === "Brasil";

  const handleCountrySelect = (countryId: number) => {
    setPaisId(countryId);
    const country = countries.find(c => c.id === countryId);
    // If Brazil, go to state selection; otherwise, go directly to teams
    if (country?.nome === "Brasil") {
      setStep("state");
    } else {
      setStep("teams");
    }
  };

  const handleStateSelect = (stateId: number) => {
    setEstadoId(stateId);
    setStep("teams");
  };

  const handleBack = () => {
    if (step === "country") {
      if (hasChanges) {
        setShowDiscardDialog(true);
      } else {
        navigate(-1);
      }
    } else if (step === "state") {
      setStep("country");
      setPaisId(null);
    } else if (step === "teams") {
      // If Brazil, go back to state; otherwise, go back to country
      if (isBrazil && estadoId) {
        setStep("state");
        setEstadoId(null);
      } else {
        setStep("country");
        setPaisId(null);
        setEstadoId(null);
      }
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

      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      toast.success("Times salvos com sucesso!");
      navigate(-1);
    } catch (error) {
      console.error("Error saving teams:", error);
      toast.error("Erro ao salvar times");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    navigate(-1);
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

  // Add team dialog content
  const AddTeamDialogContent = () => (
    <div className="space-y-4 py-4">
      {/* Team name - moved to top for search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome do time</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Digite o nome para buscar..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Existing teams found */}
      {debouncedNewTeamName.trim().length >= 2 && (
        <div className="space-y-2">
          {isSearchingExisting ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : existingTeams.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Times encontrados com esse nome:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {existingTeams.map((team) => {
                  const isAlreadySelected = selectedTeamIds.includes(team.id) || localSelectedIds.includes(team.id);
                  return (
                    <button
                      key={team.id}
                      onClick={() => {
                        if (!isAlreadySelected) {
                          addUserToTeam.mutate(team.id, {
                            onSuccess: () => {
                              toast.success(`${team.nome} adicionado!`);
                              setShowAddTeamDialog(false);
                              setNewTeamName("");
                              queryClient.invalidateQueries({ queryKey: ["user-teams"] });
                            }
                          });
                        }
                      }}
                      disabled={isAlreadySelected || addUserToTeam.isPending}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${
                        isAlreadySelected
                          ? "bg-muted/50 opacity-60 cursor-not-allowed"
                          : "bg-card border border-border hover:bg-muted"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {team.escudo_url ? (
                          <img src={team.escudo_url} alt={team.nome} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="material-symbols-outlined text-xl text-muted-foreground">shield</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{team.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {isAlreadySelected ? "Já selecionado" : [team.estado?.nome, team.pais?.nome].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      {isAlreadySelected && <Check className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Não é nenhum desses? Continue abaixo para criar novo
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum time encontrado. Você pode criar um novo abaixo.
            </p>
          )}
        </div>
      )}

      {/* Emblem upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Escudo do time <span className="text-destructive">*</span></label>
        <div className="flex items-center gap-4">
          <input
            ref={emblemInputRef}
            type="file"
            accept="image/*"
            onChange={handleEmblemSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => emblemInputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center overflow-hidden bg-muted/50 transition-colors"
          >
            {emblemPreview ? (
              <img src={emblemPreview} alt="Preview" className="w-full h-full object-contain p-1" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </button>
          <div className="flex-1 space-y-1">
            <Button type="button" variant="outline" size="sm" onClick={() => emblemInputRef.current?.click()} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {emblemPreview ? "Trocar imagem" : "Escolher imagem"}
            </Button>
            {emblemPreview && (
              <Button type="button" variant="ghost" size="sm" onClick={clearEmblem} className="w-full text-muted-foreground">
                <X className="w-4 h-4 mr-2" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      {selectedCountry && (
        <p className="text-sm text-muted-foreground">
          Será adicionado em: {selectedState ? `${selectedState.nome}, ${selectedCountry.nome}` : selectedCountry.nome}
        </p>
      )}
    </div>
  );

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Digite o nome do time");
      return;
    }
    if (!emblemFile) {
      toast.error("Adicione o escudo do time");
      return;
    }
    try {
      let escudoUrl: string | null = null;
      if (emblemFile) {
        const compressed = await compressImage(emblemFile);
        escudoUrl = await uploadMedia(compressed, "team-emblems", `${Date.now()}.jpg`);
      }
      await createTeam.mutateAsync({
        nome: newTeamName.trim().toUpperCase(),
        estadoId,
        paisId,
        escudoUrl,
      });
      toast.success("Time adicionado com sucesso!");
      setShowAddTeamDialog(false);
      setNewTeamName("");
      clearEmblem();
      setSearchInput("");
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    } catch (error) {
      toast.error("Erro ao adicionar time");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="h-8 w-8 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-center flex-1">{getStepTitle()}</h1>
          {step === "teams" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="h-8 px-3 text-primary font-semibold hover:bg-transparent hover:text-primary/80"
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
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pb-3">
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
      </header>

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
                filteredCountries.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => handleCountrySelect(country.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left"
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left"
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
              {/* Add custom team button - show ABOVE the list when searching */}
              {searchInput.trim() && !teamsLoading && (
                <button
                  onClick={() => {
                    setNewTeamName(searchInput);
                    setShowAddTeamDialog(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors text-left mb-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Não encontrou "{searchInput}"?</p>
                    <p className="text-xs text-muted-foreground">Toque aqui para adicionar</p>
                  </div>
                </button>
              )}

              {teamsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum time encontrado</p>
                  <p className="text-sm mt-1">Tente buscar por outro nome ou adicione um novo acima</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {teams.length} {teams.length === 1 ? 'time encontrado' : 'times encontrados'} • Toque para selecionar
                  </p>
                  {teams.map((team) => {
                    const isAlreadyAdded = selectedTeamIds.includes(team.id);
                    const isNewlySelected = localSelectedIds.includes(team.id) && !isAlreadyAdded;
                    const isSelected = localSelectedIds.includes(team.id);
                    
                    return (
                      <button
                        key={team.id}
                        onClick={() => !isAlreadyAdded && handleTeamToggle(team)}
                        disabled={isSaving || isAlreadyAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                          isAlreadyAdded
                            ? "bg-muted/50 border border-border opacity-60 cursor-not-allowed"
                            : isNewlySelected
                              ? "bg-primary/10 border-2 border-primary"
                              : "bg-card border border-border hover:bg-muted"
                        } disabled:cursor-not-allowed`}
                      >
                        {/* Selection indicator */}
                        <div 
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isAlreadyAdded
                              ? "bg-muted border-muted-foreground/30"
                              : isSelected 
                                ? "bg-primary border-primary" 
                                : "border-muted-foreground/40 bg-transparent"
                          }`}
                        >
                          {(isSelected || isAlreadyAdded) && (
                            <Check className={`w-4 h-4 ${isAlreadyAdded ? "text-muted-foreground" : "text-primary-foreground"}`} />
                          )}
                        </div>

                        {/* Team Logo */}
                        <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 ${isAlreadyAdded ? "grayscale" : ""}`}>
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
                          <p className={`font-medium truncate ${isAlreadyAdded ? "text-muted-foreground" : "text-foreground"}`}>{team.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {isAlreadyAdded 
                              ? "Já adicionado" 
                              : [team.estado?.nome, team.pais?.nome].filter(Boolean).join(" • ")
                            }
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

      {/* Add custom team - Drawer for PWA, Sheet for desktop */}
      {isPWA ? (
        <Drawer open={showAddTeamDialog} onOpenChange={(open) => {
          setShowAddTeamDialog(open);
          if (!open) {
            clearEmblem();
            setNewTeamName("");
          }
        }}>
          <DrawerContent className="px-4 pb-6 max-h-[85dvh]">
            <DrawerHeader className="px-0">
              <DrawerTitle>Adicionar novo time</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="flex-1 -mx-4 px-4">
              <AddTeamDialogContent />
            </ScrollArea>
            <DrawerFooter className="px-0 flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowAddTeamDialog(false);
                clearEmblem();
                setNewTeamName("");
              }}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateTeam}
                disabled={createTeam.isPending || isUploading || !newTeamName.trim() || !emblemFile}
              >
                {(createTeam.isPending || isUploading) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Criar novo time"
                )}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={showAddTeamDialog} onOpenChange={(open) => {
          setShowAddTeamDialog(open);
          if (!open) {
            clearEmblem();
            setNewTeamName("");
          }
        }}>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="px-4 py-4 border-b border-border">
              <SheetTitle>Adicionar novo time</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4">
              <AddTeamDialogContent />
            </ScrollArea>
            <div className="px-4 py-4 border-t border-border flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowAddTeamDialog(false);
                clearEmblem();
                setNewTeamName("");
              }}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateTeam}
                disabled={createTeam.isPending || isUploading || !newTeamName.trim() || !emblemFile}
              >
                {(createTeam.isPending || isUploading) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Criar novo time"
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default SelectTeams;

