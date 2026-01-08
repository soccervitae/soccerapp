import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Shield, Download, Globe, Check, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface ScrapedTeam {
  nome: string;
  escudo_url: string;
  cidade?: string;
  selected?: boolean;
}

interface ScrapeTeamsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamsImported?: () => void;
}

export const ScrapeTeamsSheet = ({
  open,
  onOpenChange,
  onTeamsImported,
}: ScrapeTeamsSheetProps) => {
  const [url, setUrl] = useState("https://escudosfc.com.br/pe.htm");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [teams, setTeams] = useState<ScrapedTeam[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedPaisId, setSelectedPaisId] = useState<number | null>(null);
  const [selectedEstadoId, setSelectedEstadoId] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; message: string } | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Fetch countries
  const { data: paises } = useQuery({
    queryKey: ["paises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paises")
        .select("id, nome, sigla, bandeira_url")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch states based on selected country
  const { data: estados } = useQuery({
    queryKey: ["estados", selectedPaisId],
    queryFn: async () => {
      if (!selectedPaisId) return [];
      const { data, error } = await supabase
        .from("estados")
        .select("id, nome, uf, bandeira_url")
        .eq("pais_id", selectedPaisId)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPaisId,
  });

  // Reset estado when pais changes
  useEffect(() => {
    setSelectedEstadoId(null);
  }, [selectedPaisId]);

  const handleScrape = async () => {
    if (!url.trim()) {
      setScrapeError("Informe a URL do site");
      return;
    }

    setIsLoading(true);
    setTeams([]);
    setScrapeError(null);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-teams", {
        body: { url, estadoId: selectedEstadoId, paisId: selectedPaisId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Erro ao extrair times");
      }

      const scrapedTeams = data.teams.map((t: ScrapedTeam) => ({
        ...t,
        selected: false,
      }));

      setTeams(scrapedTeams);
    } catch (error) {
      console.error("Scrape error:", error);
      setScrapeError(error instanceof Error ? error.message : "Erro ao extrair times");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTeam = (index: number) => {
    setTeams((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const toggleSelectAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    setTeams((prev) => prev.map((t) => ({ ...t, selected: newValue })));
  };

  const selectedCount = teams.filter((t) => t.selected).length;

  const handleImport = async () => {
    const selectedTeams = teams.filter((t) => t.selected);
    if (selectedTeams.length === 0) {
      setImportResult({ success: false, count: 0, message: "Selecione pelo menos um time" });
      return;
    }

    setIsSaving(true);
    setImportResult(null);

    try {
      const teamsToInsert = selectedTeams.map((t) => ({
        nome: t.nome,
        escudo_url: t.escudo_url,
        estado_id: selectedEstadoId,
        pais_id: selectedPaisId,
        selected_by_users: [],
      }));

      const { error } = await supabase.from("times").insert(teamsToInsert);

      if (error) {
        if (error.code === "23505") {
          setImportResult({ success: false, count: 0, message: "Alguns times já existem no banco de dados" });
        } else {
          throw error;
        }
      } else {
        setImportResult({ 
          success: true, 
          count: selectedTeams.length, 
          message: `${selectedTeams.length} times importados com sucesso!` 
        });
        onTeamsImported?.();
        
        // Auto close after showing success
        setTimeout(() => {
          onOpenChange(false);
          setTeams([]);
          setSelectAll(false);
          setImportResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({ success: false, count: 0, message: "Erro ao importar times" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Importar Times do Site
            </SheetTitle>
            {selectedCount > 0 && (
              <Button
                onClick={handleImport}
                disabled={isSaving}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Importar ({selectedCount})
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* Country & State Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>País</Label>
              <Select
                value={selectedPaisId?.toString() || ""}
                onValueChange={(v) => setSelectedPaisId(v ? parseInt(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent>
                  {paises?.map((pais) => (
                    <SelectItem key={pais.id} value={pais.id.toString()}>
                      <div className="flex items-center gap-2">
                        {pais.bandeira_url && (
                          <img src={pais.bandeira_url} alt="" className="w-4 h-3 object-cover" />
                        )}
                        {pais.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={selectedEstadoId?.toString() || ""}
                onValueChange={(v) => setSelectedEstadoId(v ? parseInt(v) : null)}
                disabled={!selectedPaisId || !estados?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!selectedPaisId ? "Selecione o país" : "Selecione o estado"} />
                </SelectTrigger>
                <SelectContent>
                  {estados?.map((estado) => (
                    <SelectItem key={estado.id} value={estado.id.toString()}>
                      <div className="flex items-center gap-2">
                        {estado.bandeira_url && (
                          <img src={estado.bandeira_url} alt="" className="w-4 h-3 object-cover" />
                        )}
                        {estado.nome} ({estado.uf})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">URL do site</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://escudosfc.com.br/pe.htm"
                className="flex-1"
              />
              <Button onClick={handleScrape} disabled={isLoading || !selectedPaisId}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole a URL de uma página do escudosfc.com.br (ex: pe.htm para Pernambuco)
            </p>
          </div>

          {/* Results */}
          {teams.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label htmlFor="selectAll" className="text-sm">
                    Selecionar todos ({teams.length})
                  </Label>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedCount} selecionados
                </span>
              </div>

              <ScrollArea className="h-[calc(90vh-320px)]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-4">
                  {teams.map((team, index) => (
                    <div
                      key={`${team.nome}-${index}`}
                      onClick={() => toggleTeam(index)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        team.selected
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/30 border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {team.escudo_url ? (
                            <img
                              src={team.escudo_url}
                              alt={team.nome}
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Shield className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        {team.selected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{team.nome}</p>
                        {team.cidade && (
                          <p className="text-xs text-muted-foreground truncate">
                            {team.cidade}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

            </>
          )}

          {/* Success/Error Result Message */}
          <AnimatePresence>
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  importResult.success 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : "bg-destructive/10 border border-destructive/30"
                }`}
              >
                {importResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                )}
                <p className={`text-sm font-medium ${
                  importResult.success ? "text-green-500" : "text-destructive"
                }`}>
                  {importResult.message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrape Error Message */}
          <AnimatePresence>
            {scrapeError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
              >
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                <p className="text-sm font-medium text-destructive">{scrapeError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!isLoading && teams.length === 0 && !scrapeError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Informe a URL e clique em buscar para extrair times
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
