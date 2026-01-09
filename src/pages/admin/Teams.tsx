import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, Trash2, Users, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrapeTeamsSheet } from "@/components/teams/ScrapeTeamsSheet";

const ITEMS_PER_PAGE = 20;

export default function AdminTeams() {
  const [search, setSearch] = useState("");
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedPaisId, setSelectedPaisId] = useState<number | null>(null);
  const [selectedEstadoId, setSelectedEstadoId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

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

  // Reset estado and page when pais changes
  useEffect(() => {
    setSelectedEstadoId(null);
    setCurrentPage(1);
  }, [selectedPaisId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedEstadoId]);

  // Fetch total count for pagination
  const { data: totalCount } = useQuery({
    queryKey: ["adminTeamsCount", search, selectedPaisId, selectedEstadoId],
    queryFn: async () => {
      let query = supabase
        .from("times")
        .select("id", { count: "exact", head: true });

      if (search) {
        query = query.ilike("nome", `%${search}%`);
      }

      if (selectedPaisId) {
        query = query.eq("pais_id", selectedPaisId);
      }

      if (selectedEstadoId) {
        query = query.eq("estado_id", selectedEstadoId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ["adminTeams", search, selectedPaisId, selectedEstadoId, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("times")
        .select(`
          *,
          pais:pais_id(nome, bandeira_url),
          estado:estado_id(nome, uf)
        `)
        .order("nome", { ascending: true })
        .range(from, to);

      if (search) {
        query = query.ilike("nome", `%${search}%`);
      }

      if (selectedPaisId) {
        query = query.eq("pais_id", selectedPaisId);
      }

      if (selectedEstadoId) {
        query = query.eq("estado_id", selectedEstadoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("times").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTeams"] });
      queryClient.invalidateQueries({ queryKey: ["adminTeamsCount"] });
      toast.success("Time deletado com sucesso");
      setDeleteTeamId(null);
    },
    onError: () => {
      toast.error("Erro ao deletar time");
    },
  });

  const clearFilters = () => {
    setSelectedPaisId(null);
    setSelectedEstadoId(null);
    setSearch("");
    setCurrentPage(1);
  };

  const hasFilters = !!selectedPaisId || !!selectedEstadoId || !!search;

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Times</h1>
          <p className="text-muted-foreground">
            Gerencie todos os times cadastrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={selectedPaisId?.toString() || ""}
            onValueChange={(v) => setSelectedPaisId(v ? parseInt(v) : null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por país" />
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

          <Select
            value={selectedEstadoId?.toString() || ""}
            onValueChange={(v) => setSelectedEstadoId(v ? parseInt(v) : null)}
            disabled={!selectedPaisId || !estados?.length}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={!selectedPaisId ? "Selecione o país" : "Filtrar por estado"} />
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

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}

          <Button onClick={() => setShowAddSheet(true)} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Times
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : teams?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum time encontrado
                  </TableCell>
                </TableRow>
              ) : (
                teams?.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={team.escudo_url || ""} />
                          <AvatarFallback>
                            {team.nome.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {team.nome}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {team.pais?.bandeira_url && (
                          <img
                            src={team.pais.bandeira_url}
                            alt={team.pais.nome}
                            className="h-4 w-6 object-cover rounded"
                          />
                        )}
                        <span className="text-muted-foreground">
                          {team.pais?.nome || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {team.estado ? `${team.estado.nome} (${team.estado.uf})` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {team.selected_by_users?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {team.created_at
                        ? format(new Date(team.created_at), "dd MMM yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTeamId(team.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar time
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount || 0)} de {totalCount} times
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!canGoNext}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTeamId} onOpenChange={() => setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar time?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O time será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeamId && deleteTeamMutation.mutate(deleteTeamId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScrapeTeamsSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        onTeamsImported={() => {
          queryClient.invalidateQueries({ queryKey: ["adminTeams"] });
          queryClient.invalidateQueries({ queryKey: ["adminTeamsCount"] });
        }}
      />
    </AdminLayout>
  );
}
