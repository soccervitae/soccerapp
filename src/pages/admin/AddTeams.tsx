import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Shield, Download, Globe, Check, CheckCircle2, AlertCircle, Ban, ArrowLeft, Upload, ImagePlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScrapedTeam {
  nome: string;
  escudo_url: string;
  cidade?: string;
  selected?: boolean;
  isDuplicate?: boolean;
}

export default function AdminAddTeams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Scrape mode state
  const [url, setUrl] = useState("https://escudosfc.com.br/pe.htm");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [teams, setTeams] = useState<ScrapedTeam[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedPaisId, setSelectedPaisId] = useState<number | null>(null);
  const [selectedEstadoId, setSelectedEstadoId] = useState<number | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
  // Manual mode state
  const [manualName, setManualName] = useState("");
  const [manualEscudo, setManualEscudo] = useState<File | null>(null);
  const [manualEscudoPreview, setManualEscudoPreview] = useState<string | null>(null);
  const [isUploadingManual, setIsUploadingManual] = useState(false);

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

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || "Erro ao extrair times");

      const teamNames = data.teams.map((t: ScrapedTeam) => t.nome);
      
      let duplicateQuery = supabase
        .from("times")
        .select("nome")
        .in("nome", teamNames);
      
      if (selectedPaisId) {
        duplicateQuery = duplicateQuery.eq("pais_id", selectedPaisId);
      }
      
      if (selectedEstadoId) {
        duplicateQuery = duplicateQuery.eq("estado_id", selectedEstadoId);
      } else {
        duplicateQuery = duplicateQuery.is("estado_id", null);
      }
      
      const { data: existingTeams } = await duplicateQuery;
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
    if (team.isDuplicate) return;
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
    const selectedTeams = teams.filter((t) => t.selected && !t.isDuplicate);
    if (selectedTeams.length === 0) {
      toast.error("Selecione pelo menos um time");
      return;
    }

    if (!user?.id || !selectedPaisId || !selectedEstadoId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSaving(true);
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

      const BATCH_SIZE = 50;
      let insertedCount = 0;
      const totalBatches = Math.ceil(teamsToInsert.length / BATCH_SIZE);

      for (let i = 0; i < teamsToInsert.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const batch = teamsToInsert.slice(i, i + BATCH_SIZE);

        setBatchLogs((prev) => [
          ...prev,
          `Lote ${batchNum}/${totalBatches}: Salvando ${batch.length} times...`,
        ]);
        
        const { data, error } = await supabase
          .from("times")
          .upsert(batch, {
            onConflict: "nome,estado_id,pais_id",
            ignoreDuplicates: true,
          })
          .select("id, nome");

        if (error) {
          setBatchLogs((prev) => [...prev.slice(0, -1), `❌ Lote ${batchNum} erro: ${error.message}`]);
          toast.error(`Erro no lote ${batchNum}: ${error.message}`);
          return;
        }

        const inserted = data?.length ?? 0;
        insertedCount += inserted;
        
        setBatchLogs((prev) => [
          ...prev.slice(0, -1),
          `✅ Lote ${batchNum}/${totalBatches}: ${inserted} times inseridos`,
        ]);
      }

      if (insertedCount > 0) {
        toast.success(`${insertedCount} times importados com sucesso!`);
        navigate("/admin/teams");
      } else {
        toast.warning("Nenhum time novo foi inserido (todos já existiam)");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erro ao importar times");
    } finally {
      setIsSaving(false);
    }
  };

  // Manual team creation
  const handleManualEscudoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setManualEscudo(file);
      setManualEscudoPreview(URL.createObjectURL(file));
    }
  };

  const handleManualCreate = async () => {
    if (!manualName.trim()) {
      toast.error("Informe o nome do time");
      return;
    }
    if (!manualEscudo) {
      toast.error("Adicione o escudo do time");
      return;
    }
    if (!selectedPaisId) {
      toast.error("Selecione o país");
      return;
    }
    if (!user?.id) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsUploadingManual(true);

    try {
      // Upload escudo
      const fileExt = manualEscudo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("team-emblems")
        .upload(fileName, manualEscudo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("team-emblems")
        .getPublicUrl(fileName);

      // Check for duplicates
      const { data: existing } = await supabase
        .from("times")
        .select("id")
        .ilike("nome", manualName.trim().toUpperCase())
        .eq("pais_id", selectedPaisId)
        .eq("estado_id", selectedEstadoId || 0)
        .maybeSingle();

      if (existing) {
        toast.error("Já existe um time com esse nome nesta localização");
        return;
      }

      // Insert team
      const { error: insertError } = await supabase
        .from("times")
        .insert({
          nome: manualName.trim().toUpperCase(),
          escudo_url: publicUrl,
          pais_id: selectedPaisId,
          estado_id: selectedEstadoId,
          selected_by_users: [],
          user_id: user.id,
        });

      if (insertError) throw insertError;

      toast.success("Time criado com sucesso!");
      navigate("/admin/teams");
    } catch (error) {
      console.error("Manual create error:", error);
      toast.error("Erro ao criar time");
    } finally {
      setIsUploadingManual(false);
    }
  };

  const canImport = selectedCount > 0 && selectedPaisId && selectedEstadoId;

  const teamsToDisplay = showOnlySelected 
    ? teams.filter(t => t.selected) 
    : teams;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/teams")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Adicionar Times</h1>
            <p className="text-muted-foreground">
              Importe times de um site ou adicione manualmente
            </p>
          </div>
        </div>

        <Tabs defaultValue="scrape" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="scrape">
              <Globe className="h-4 w-4 mr-2" />
              Importar do Site
            </TabsTrigger>
            <TabsTrigger value="manual">
              <ImagePlus className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          {/* Scrape Tab */}
          <TabsContent value="scrape" className="space-y-4 mt-4">
            {/* Country & State Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País *</Label>
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
                <Label>Estado *</Label>
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
                Cole a URL de uma página do escudosfc.com.br
              </p>
            </div>

            {/* Error */}
            {scrapeError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{scrapeError}</span>
              </div>
            )}

            {/* Results */}
            {teams.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
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
                      {duplicateCount} {duplicateCount === 1 ? "time já existe" : "times já existem"}
                    </span>
                  </div>
                )}

                {/* Select All */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allAvailableSelected}
                      onCheckedChange={toggleSelectAll}
                      id="selectAll"
                    />
                    <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                      Selecionar todos disponíveis
                    </Label>
                  </div>
                  {selectedCount > 0 && (
                    <Button onClick={handleImport} disabled={isSaving || !canImport}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Importar ({selectedCount})
                    </Button>
                  )}
                </div>

                {/* Batch Logs */}
                {batchLogs.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted space-y-1">
                    {batchLogs.map((log, i) => (
                      <p key={i} className="text-xs font-mono">{log}</p>
                    ))}
                  </div>
                )}

                {/* Teams Grid */}
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {teamsToDisplay.map((team, index) => {
                      const originalIndex = teams.indexOf(team);
                      return (
                        <motion.div
                          key={originalIndex}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`
                            relative p-3 rounded-xl border cursor-pointer transition-all
                            ${team.isDuplicate 
                              ? "bg-muted/50 border-border opacity-50 cursor-not-allowed" 
                              : team.selected 
                                ? "bg-primary/10 border-primary" 
                                : "bg-card border-border hover:border-primary/50"
                            }
                          `}
                          onClick={() => toggleTeam(originalIndex)}
                        >
                          {team.selected && !team.isDuplicate && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                          {team.isDuplicate && (
                            <div className="absolute top-2 right-2">
                              <Ban className="w-4 h-4 text-amber-500" />
                            </div>
                          )}
                          <div className="flex flex-col items-center gap-2">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={team.escudo_url} />
                              <AvatarFallback>
                                <Shield className="w-6 h-6 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-center font-medium line-clamp-2">
                              {team.nome}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="max-w-md space-y-4">
              {/* Country & State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>País *</Label>
                  <Select
                    value={selectedPaisId?.toString() || ""}
                    onValueChange={(v) => setSelectedPaisId(v ? parseInt(v) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados?.map((estado) => (
                        <SelectItem key={estado.id} value={estado.id.toString()}>
                          <div className="flex items-center gap-2">
                            {estado.bandeira_url && (
                              <img src={estado.bandeira_url} alt="" className="w-4 h-3 object-cover" />
                            )}
                            {estado.uf}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName">Nome do Time *</Label>
                <Input
                  id="teamName"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value.toUpperCase())}
                  placeholder="NOME DO TIME"
                  className="uppercase"
                />
              </div>

              {/* Escudo Upload */}
              <div className="space-y-2">
                <Label>Escudo *</Label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleManualEscudoChange}
                      className="hidden"
                    />
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center bg-muted/50 overflow-hidden">
                      {manualEscudoPreview ? (
                        <img src={manualEscudoPreview} alt="Escudo" className="w-full h-full object-contain" />
                      ) : (
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  </label>
                  <div className="text-sm text-muted-foreground">
                    <p>Clique para enviar o escudo</p>
                    <p className="text-xs">PNG, JPG ou SVG</p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleManualCreate}
                disabled={isUploadingManual || !manualName.trim() || !manualEscudo || !selectedPaisId}
                className="w-full"
              >
                {isUploadingManual ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Criar Time
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
