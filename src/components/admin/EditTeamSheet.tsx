import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditTeamSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string | null;
}

export function EditTeamSheet({ open, onOpenChange, teamId }: EditTeamSheetProps) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [escudoUrl, setEscudoUrl] = useState("");
  const [paisId, setPaisId] = useState<number | null>(null);
  const [estadoId, setEstadoId] = useState<number | null>(null);

  // Fetch team data
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data, error } = await supabase
        .from("times")
        .select("*")
        .eq("id", teamId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId && open,
  });

  // Fetch countries with Brazil first
  const { data: paises } = useQuery({
    queryKey: ["paises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paises")
        .select("id, nome, sigla, bandeira_url")
        .order("nome");
      if (error) throw error;
      
      // Sort with Brazil first
      const sorted = data?.sort((a, b) => {
        if (a.nome === "Brasil") return -1;
        if (b.nome === "Brasil") return 1;
        return a.nome.localeCompare(b.nome);
      });
      
      return sorted;
    },
  });

  // Fetch states based on selected country
  const { data: estados } = useQuery({
    queryKey: ["estados", paisId],
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

  // Update form when team data loads
  useEffect(() => {
    if (team) {
      setNome(team.nome || "");
      setEscudoUrl(team.escudo_url || "");
      setPaisId(team.pais_id || null);
      setEstadoId(team.estado_id || null);
    }
  }, [team]);

  // Reset estado when pais changes (only if user changes it, not on initial load)
  const handlePaisChange = (value: string) => {
    const newPaisId = parseInt(value);
    if (newPaisId !== paisId) {
      setPaisId(newPaisId);
      setEstadoId(null);
    }
  };

  const updateTeamMutation = useMutation({
    mutationFn: async () => {
      if (!teamId) throw new Error("Team ID is required");
      
      const { error } = await supabase
        .from("times")
        .update({
          nome: nome.trim(),
          escudo_url: escudoUrl.trim() || null,
          pais_id: paisId,
          estado_id: estadoId,
        })
        .eq("id", teamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTeams"] });
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      toast.success("Time atualizado com sucesso");
      onOpenChange(false);
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        toast.error("Já existe um time com este nome neste local");
      } else {
        toast.error("Erro ao atualizar time");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast.error("Nome do time é obrigatório");
      return;
    }
    
    updateTeamMutation.mutate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Time</SheetTitle>
          <SheetDescription>
            Atualize as informações do time
          </SheetDescription>
        </SheetHeader>

        {isLoadingTeam ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Team Preview */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={escudoUrl || ""} />
                <AvatarFallback className="text-lg">
                  {nome.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{nome || "Nome do Time"}</p>
                <p className="text-sm text-muted-foreground">
                  {paises?.find(p => p.id === paisId)?.nome || "País"}
                  {estados?.find(e => e.id === estadoId)?.uf && ` - ${estados.find(e => e.id === estadoId)?.uf}`}
                </p>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Time *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Flamengo"
              />
            </div>

            {/* Escudo URL */}
            <div className="space-y-2">
              <Label htmlFor="escudo">URL do Escudo</Label>
              <Input
                id="escudo"
                value={escudoUrl}
                onChange={(e) => setEscudoUrl(e.target.value)}
                placeholder="https://exemplo.com/escudo.png"
              />
            </div>

            {/* País */}
            <div className="space-y-2">
              <Label>País</Label>
              <Select
                value={paisId?.toString() || ""}
                onValueChange={handlePaisChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent>
                  {paises?.map((pais) => (
                    <SelectItem key={pais.id} value={pais.id.toString()}>
                      <div className="flex items-center gap-2">
                        {pais.bandeira_url && (
                          <img src={pais.bandeira_url} alt="" className="w-4 h-3 object-cover rounded" />
                        )}
                        {pais.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={estadoId?.toString() || ""}
                onValueChange={(v) => setEstadoId(v ? parseInt(v) : null)}
                disabled={!paisId || !estados?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!paisId ? "Selecione o país primeiro" : "Selecione o estado"} />
                </SelectTrigger>
                <SelectContent>
                  {estados?.map((estado) => (
                    <SelectItem key={estado.id} value={estado.id.toString()}>
                      <div className="flex items-center gap-2">
                        {estado.bandeira_url && (
                          <img src={estado.bandeira_url} alt="" className="w-4 h-3 object-cover rounded" />
                        )}
                        {estado.nome} ({estado.uf})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateTeamMutation.isPending || !nome.trim()}
              >
                {updateTeamMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
