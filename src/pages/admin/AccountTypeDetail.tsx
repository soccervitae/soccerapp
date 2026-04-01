import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type TableName = "posicao_masculina" | "posicao_feminina" | "funcaomas" | "funcaofem";

interface ItemRow {
  id: number;
  name: string;
}

const CONFIG: Record<string, {
  title: string;
  label: string;
  tables: { gender: string; table: TableName; itemLabel: string }[];
} | undefined> = {
  atleta: {
    title: "Atleta",
    label: "Posições",
    tables: [
      { gender: "Masculino", table: "posicao_masculina", itemLabel: "posição" },
      { gender: "Feminino", table: "posicao_feminina", itemLabel: "posição" },
    ],
  },
  comissao_tecnica: {
    title: "Comissão Técnica",
    label: "Funções",
    tables: [
      { gender: "Masculino", table: "funcaomas", itemLabel: "função" },
      { gender: "Feminino", table: "funcaofem", itemLabel: "função" },
    ],
  },
};

function GenderTab({ tableName, itemLabel }: { tableName: TableName; itemLabel: string }) {
  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["adminItems", tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("name");
      if (error) throw error;
      return data as ItemRow[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from(tableName).insert({ name } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminItems", tableName] });
      setNewName("");
      toast.success(`${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} adicionada`);
    },
    onError: () => toast.error(`Erro ao adicionar ${itemLabel}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminItems", tableName] });
      toast.success(`${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} removida`);
      setDeleteId(null);
    },
    onError: () => toast.error(`Erro ao remover ${itemLabel}`),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addMutation.mutate(newName.trim());
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder={`Nome da ${itemLabel}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!newName.trim() || addMutation.isPending} size="sm" className="gap-1">
          {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar
        </Button>
      </form>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  Nenhuma {itemLabel} cadastrada
                </TableCell>
              </TableRow>
            ) : (
              items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats */}
      <p className="text-xs text-muted-foreground">
        Total: {items?.length || 0} {items?.length === 1 ? itemLabel : itemLabel + "s"}
      </p>

      {/* Delete dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {itemLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminAccountTypeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const config = slug ? CONFIG[slug] : undefined;

  if (!config) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Tipo de conta não suporta gerenciamento de sexo/posições.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/account-types")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/account-types")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
            <p className="text-muted-foreground text-sm">
              Gerencie {config.label.toLowerCase()} por sexo
            </p>
          </div>
        </div>

        <Tabs defaultValue={config.tables[0].gender}>
          <TabsList className="grid w-full grid-cols-2">
            {config.tables.map((t) => (
              <TabsTrigger key={t.gender} value={t.gender}>
                {t.gender}
              </TabsTrigger>
            ))}
          </TabsList>

          {config.tables.map((t) => (
            <TabsContent key={t.gender} value={t.gender} className="mt-4">
              <GenderTab tableName={t.table} itemLabel={t.itemLabel} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
