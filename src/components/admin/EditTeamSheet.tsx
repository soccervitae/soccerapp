import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

interface Team {
  id: string;
  nome: string;
  escudo_url: string | null;
  pais_id: number | null;
  estado_id: number | null;
}

interface EditTeamSheetProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamSheet({ team, open, onOpenChange }: EditTeamSheetProps) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [escudoUrl, setEscudoUrl] = useState("");
  const [paisId, setPaisId] = useState<number | null>(null);
  const [estadoId, setEstadoId] = useState<number | null>(null);

  // Update form when team changes
  useEffect(() => {
    if (team) {
      setNome(team.nome);
      setEscudoUrl(team.escudo_url || "");
      setPaisId(team.pais_id);
      setEstadoId(team.estado_id);
    }
  }, [team]);

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
      const sorted = [...(data || [])].sort((a, b) => {
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

  // Reset estado when pais changes
  useEffect(() => {
    if (paisId !== team?.pais_id) {
      setEstadoId(null);
    }
  }, [paisId, team?.pais_id]);

  const updateTeamMutation = useMutation({
    mutationFn: async () => {
      if (!team) return;
      
      const { error } = await supabase
        .from("times")
        .update({
          nome: nome.trim(),
          escudo_url: escudoUrl.trim() || null,
          pais_id: paisId,
          estado_id: estadoId,
        })
        .eq("id", team.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTeams"] });
      toast.success("Time atualizado com sucesso");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar time: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("O nome do time é obrigatório");
      return;
    }
    updateTeamMutation.mutate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Time</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={escudoUrl || ""} />
              <AvatarFallback className="text-lg">
                {nome.charAt(0) || "T"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{nome || "Nome do time"}</p>
              <p className="text-sm text-muted-foreground">
                {paises?.find(p => p.id === paisId)?.nome || "País"} 
                {estados?.find(e => e.id === estadoId)?.uf ? ` - ${estados.find(e => e.id === estadoId)?.uf}` : ""}
              </p>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do time</Label>
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
              placeholder="https://..."
            />
          </div>

          {/* País */}
          <div className="space-y-2">
            <Label>País</Label>
            <Select
              value={paisId?.toString() || ""}
              onValueChange={(v) => setPaisId(v ? parseInt(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                {paises?.map((pais) => (
                  <SelectItem key={pais.id} value={pais.id.toString()}>
                    <div className="flex items-center gap-2">
                      {pais.bandeira_url && (
                        <img
                          src={pais.bandeira_url}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded"
                        />
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
                <SelectValue 
                  placeholder={
                    !paisId 
                      ? "Selecione o país primeiro" 
                      : !estados?.length 
                        ? "Sem estados disponíveis" 
                        : "Selecione o estado"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {estados?.map((estado) => (
                  <SelectItem key={estado.id} value={estado.id.toString()}>
                    <div className="flex items-center gap-2">
                      {estado.bandeira_url && (
                        <img
                          src={estado.bandeira_url}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded"
                        />
                      )}
                      {estado.nome} ({estado.uf})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
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
              disabled={updateTeamMutation.isPending}
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
      </SheetContent>
    </Sheet>
  );
}
