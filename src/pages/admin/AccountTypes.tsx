import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Search, MoreHorizontal, Trash2, Edit, Plus, Users, List, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface AccountType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string | null;
}

export default function AdminAccountTypes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editData, setEditData] = useState<AccountType | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formOrder, setFormOrder] = useState("0");
  const [formActive, setFormActive] = useState(true);
  const queryClient = useQueryClient();

  const { data: accountTypes, isLoading } = useQuery({
    queryKey: ["adminAccountTypes", search],
    queryFn: async () => {
      let query = supabase
        .from("account_types")
        .select("*")
        .order("display_order");

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AccountType[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("account_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAccountTypes"] });
      toast.success("Tipo de conta deletado com sucesso");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao deletar tipo de conta"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim().toLowerCase().replace(/\s+/g, "_"),
        description: formDescription.trim() || null,
        icon: formIcon.trim() || null,
        display_order: Number(formOrder) || 0,
        is_active: formActive,
      };

      if (editData) {
        const { error } = await supabase
          .from("account_types")
          .update(payload)
          .eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("account_types").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAccountTypes"] });
      toast.success(editData ? "Tipo de conta atualizado" : "Tipo de conta criado");
      handleCloseSheet();
    },
    onError: () => toast.error("Erro ao salvar tipo de conta"),
  });

  const handleEdit = (item: AccountType) => {
    setEditData(item);
    setFormName(item.name);
    setFormSlug(item.slug);
    setFormDescription(item.description || "");
    setFormIcon(item.icon || "");
    setFormOrder(item.display_order.toString());
    setFormActive(item.is_active);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditData(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormIcon("");
    setFormOrder("0");
    setFormActive(true);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setEditData(null);
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setFormName(value);
    if (!editData) {
      setFormSlug(
        value
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tipos de Conta</h1>
            <p className="text-muted-foreground">
              Gerencie os tipos de conta disponíveis para cadastro
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{accountTypes?.length || 0}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <List className="h-3 w-3" /> Total
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {accountTypes?.filter((t) => t.is_active).length || 0}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="h-3 w-3" /> Ativos
            </p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : accountTypes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum tipo de conta encontrado
                  </TableCell>
                </TableRow>
              ) : (
                accountTypes?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-medium text-foreground">{item.name}</span>
                      {item.description && (
                        <span className="block text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{item.slug}</code>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.is_active 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {item.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar tipo de conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Usuários com este tipo de conta não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={handleCloseSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editData ? "Editar Tipo de Conta" : "Novo Tipo de Conta"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={formName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex: Atleta" />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="Ex: atleta" />
              <p className="text-xs text-muted-foreground">Identificador único (sem espaços)</p>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição do tipo de conta" />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Input value={formIcon} onChange={(e) => setFormIcon(e.target.value)} placeholder="user, clipboard, shield" />
              <p className="text-xs text-muted-foreground">Nome do ícone (user, clipboard, shield)</p>
            </div>
            <div className="space-y-2">
              <Label>Ordem de exibição</Label>
              <Input type="number" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formName.trim() || !formSlug.trim() || saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editData ? "Salvar Alterações" : "Criar Tipo de Conta"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
