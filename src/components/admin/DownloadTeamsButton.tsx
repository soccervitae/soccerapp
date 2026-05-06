import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Pais {
  id: number;
  nome: string;
  bandeira_url: string | null;
}

interface DownloadTeamsButtonProps {
  paises: Pais[];
}

const BRASIL_NOME = "Brasil";

export function DownloadTeamsButton({ paises }: DownloadTeamsButtonProps) {
  const [open, setOpen] = useState(false);
  const [paisId, setPaisId] = useState<number | null>(null);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const isBrasil = !!paisId && paises.find(p => p.id === paisId)?.nome === BRASIL_NOME;

  const { data: estados } = useQuery({
    queryKey: ["download-estados", paisId],
    queryFn: async () => {
      if (!paisId || !isBrasil) return [];
      const { data, error } = await supabase
        .from("estados")
        .select("id, nome, uf")
        .eq("pais_id", paisId)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!paisId && isBrasil,
  });

  useEffect(() => {
    setEstadoId(null);
  }, [paisId]);

  const handleDownload = async () => {
    setLoading(true);
    const t = toast.loading("Gerando arquivo...");
    try {
      let query = supabase
        .from("times")
        .select(`nome, escudo_url, created_at, selected_by_users, pais:pais_id(nome), estado:estado_id(nome, uf)`)
        .order("nome", { ascending: true });

      if (paisId) query = query.eq("pais_id", paisId);
      if (isBrasil && estadoId) query = query.eq("estado_id", estadoId);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map((r: any) => ({
        Nome: r.nome,
        Pais: r.pais?.nome || "",
        Estado: r.estado ? `${r.estado.nome} (${r.estado.uf})` : "",
        Usuarios: r.selected_by_users?.length || 0,
        Escudo: r.escudo_url || "",
        Cadastro: r.created_at ? format(new Date(r.created_at), "dd/MM/yyyy") : "",
      }));

      const headers = ["Nome", "Pais", "Estado", "Usuarios", "Escudo", "Cadastro"];
      const escape = (v: any) => {
        const s = String(v ?? "");
        return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv =
        "\uFEFF" +
        [
          headers.join(";"),
          ...rows.map(r => headers.map(h => escape((r as any)[h])).join(";")),
        ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const paisNome = paises.find(p => p.id === paisId)?.nome || "todos";
      const estadoUf = estados?.find(e => e.id === estadoId)?.uf;
      const suffix = estadoUf ? `_${paisNome}_${estadoUf}` : `_${paisNome}`;
      a.download = `times${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${rows.length} times exportados`, { id: t });
      setOpen(false);
    } catch (e: any) {
      toast.error("Erro ao exportar: " + e.message, { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Baixar tabela
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Baixar lista de times</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>País</Label>
            <Select
              value={paisId?.toString() || "all"}
              onValueChange={(v) => setPaisId(v === "all" ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                {paises.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    <div className="flex items-center gap-2">
                      {p.bandeira_url && (
                        <img src={p.bandeira_url} alt="" className="w-4 h-3 object-cover rounded" />
                      )}
                      {p.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isBrasil && (
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={estadoId?.toString() || "all"}
                onValueChange={(v) => setEstadoId(v === "all" ? null : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {estados?.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.nome} ({e.uf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleDownload} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Baixar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
