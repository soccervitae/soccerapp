import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Shield, Download, Globe, Check, CheckCircle2, AlertCircle, Ban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ScrapedTeam {
  nome: string;
  escudo_url: string;
  cidade?: string;
  selected?: boolean;
  isDuplicate?: boolean;
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
  const { user } = useAuth();
  const [url, setUrl] = useState("https://escudosfc.com.br/pe.htm");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [teams, setTeams] = useState<ScrapedTeam[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedPaisId, setSelectedPaisId] = useState<number | null>(null);
  const [selectedEstadoId, setSelectedEstadoId] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; message: string } | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [successData, setSuccessData] = useState<{ count: number } | null>(null);
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

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

      // Check for duplicates in the database
      const teamNames = data.teams.map((t: ScrapedTeam) => t.nome);
      const { data: existingTeams } = await supabase
        .from("times")
        .select("nome")
        .in("nome", teamNames)
        .eq("pais_id", selectedPaisId)
        .eq("estado_id", selectedEstadoId || -1);

      const existingNames = new Set(existingTeams?.map((t) => t.nome) || []);

      const scrapedTeams = data.teams.map((t: ScrapedTeam) => ({
        ...t,
        selected: false,
        isDuplicate: existingNames.has(t.nome),
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
    const team = teams[index];
    if (team.isDuplicate) return; // Don't allow selecting duplicates
    setTeams((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const availableTeams = teams.filter((t) => !t.isDuplicate);
  const selectedCount = teams.filter((t) => t.selected && !t.isDuplicate).length;
  const duplicateCount = teams.filter((t) => t.isDuplicate).length;
  const availableCount = availableTeams.length;
  const allAvailableSelected = availableCount > 0 && availableTeams.every((t) => t.selected);

  const toggleSelectAll = () => {
    const shouldSelect = !allAvailableSelected;
    setSelectAll(shouldSelect);
    setTeams((prev) => prev.map((t) => ({ 
      ...t, 
      selected: t.isDuplicate ? false : shouldSelect 
    })));
  };

  const handleImport = async () => {
    const selectedTeams = teams.filter((t) => t.selected);
    if (selectedTeams.length === 0) {
      setImportResult({ success: false, count: 0, message: "Selecione pelo menos um time" });
      return;
    }

    if (!user?.id) {
      setImportResult({ success: false, count: 0, message: "Você precisa estar logado para importar times" });
      return;
    }

    setIsSaving(true);
    setImportResult(null);
    setBatchLogs([]);

    try {
      const teamsToInsert = selectedTeams.map((t) => ({
        nome: t.nome,
        escudo_url: t.escudo_url,
        estado_id: selectedEstadoId,
        pais_id: selectedPaisId,
        selected_by_users: [],
        user_id: user.id,
      }));

      // Insert in batches to avoid payload/time limits when importing many teams
      const BATCH_SIZE = 50;
      let insertedCount = 0;
      const totalBatches = Math.ceil(teamsToInsert.length / BATCH_SIZE);

      for (let i = 0; i < teamsToInsert.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const batch = teamsToInsert.slice(i, i + BATCH_SIZE);
        
        setBatchLogs(prev => [...prev, `Lote ${batchNum}/${totalBatches}: Inserindo ${batch.length} times...`]);
        
        const { data, error } = await supabase.from("times").insert(batch).select("id");

        if (error) {
          const errorMsg = `Lote ${batchNum}/${totalBatches} erro: ${error.code ?? ""} ${error.message}`.trim();
          setBatchLogs(prev => [...prev.slice(0, -1), `❌ ${errorMsg}`]);
          
          // Unique constraint violation (duplicate)
          if (error.code === "23505") {
            setImportResult({
              success: false,
              count: insertedCount,
              message: "Alguns times já existem no banco de dados (duplicados)",
            });
            return;
          }

          // Common RLS failure
          if (error.message?.toLowerCase().includes("row-level security")) {
            setImportResult({
              success: false,
              count: insertedCount,
              message: "Permissão negada (RLS). Confirme se você está logado como admin.",
            });
            return;
          }

          setImportResult({
            success: false,
            count: insertedCount,
            message: errorMsg,
          });
          return;
        }

        const inserted = data?.length ?? 0;
        insertedCount += inserted;
        setBatchLogs(prev => [...prev.slice(0, -1), `✅ Lote ${batchNum}/${totalBatches}: ${inserted} times inseridos`]);
      }

      if (insertedCount === 0) {
        setImportResult({
          success: false,
          count: 0,
          message: "Nenhum time foi inserido. Verifique duplicados e permissões.",
        });
        return;
      }

      // Store success data and close main sheet
      setSuccessData({ count: insertedCount });
      onTeamsImported?.();
      onOpenChange(false);
      setTeams([]);
      setSelectAll(false);
      setImportResult(null);

      // Show success confirmation sheet
      setShowSuccessSheet(true);
    } catch (error) {
      console.error("Import error:", error);
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as any).message)
          : "Erro ao importar times";
      setImportResult({ success: false, count: 0, message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
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

            {/* Results Counter */}
            {teams.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">
                      {availableCount} times disponíveis
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-primary">
                      Selecionados: {selectedCount}
                    </span>
                    {selectedCount > 0 && (
                      <Button
                        variant={showOnlySelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOnlySelected(!showOnlySelected)}
                        className="h-7 text-xs"
                      >
                        {showOnlySelected ? "Ver todos" : "Ver selecionados"}
                      </Button>
                    )}
                  </div>
                </div>
                
                {duplicateCount > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <Ban className="w-5 h-5 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      {duplicateCount} {duplicateCount === 1 ? "time já existe" : "times já existem"} e {duplicateCount === 1 ? "será ignorado" : "serão ignorados"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Results Selection */}
            {teams.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAll"
                    checked={allAvailableSelected}
                    onCheckedChange={() => toggleSelectAll()}
                    disabled={availableCount === 0}
                  />
                  <Label htmlFor="selectAll" className="text-sm">
                    Selecionar todos disponíveis
                  </Label>
                </div>

                <ScrollArea className="h-[50vh] flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-4">
                    {teams
                      .map((team, index) => ({ team, index }))
                      .filter(({ team }) => !showOnlySelected || team.selected)
                      .map(({ team, index }) => (
                      <div
                        key={`${team.nome}-${index}`}
                        onClick={() => toggleTeam(index)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                          team.isDuplicate
                            ? "bg-muted/20 border-amber-500/30 opacity-60 cursor-not-allowed"
                            : team.selected
                              ? "bg-primary/10 border-primary cursor-pointer"
                              : "bg-muted/30 border-transparent hover:bg-muted/50 cursor-pointer"
                        }`}
                      >
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden ${
                            team.isDuplicate ? "grayscale" : ""
                          }`}>
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
                          {team.isDuplicate && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                              <Ban className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {team.selected && !team.isDuplicate && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${team.isDuplicate ? "line-through text-muted-foreground" : ""}`}>
                            {team.nome}
                          </p>
                          {team.isDuplicate ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
                              Já existe
                            </p>
                          ) : team.cidade ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {team.cidade}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

              </>
            )}

            {/* Batch Logs */}
            {batchLogs.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 border max-h-32 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2">Log de importação:</p>
                <div className="space-y-1">
                  {batchLogs.map((log, idx) => (
                    <p key={idx} className="text-xs font-mono text-foreground/80">
                      {log}
                    </p>
                  ))}
                </div>
              </div>
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

      {/* Success Confirmation Sheet */}
      <Sheet open={showSuccessSheet} onOpenChange={setShowSuccessSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold mb-2"
            >
              Times importados!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mb-6"
            >
              {successData?.count} {successData?.count === 1 ? "time foi adicionado" : "times foram adicionados"} com sucesso.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button onClick={() => setShowSuccessSheet(false)}>
                Fechar
              </Button>
            </motion.div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
