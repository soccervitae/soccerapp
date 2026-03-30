import { useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Verified, UserCheck, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";

const ITEMS_PER_PAGE = 20;

type PremiumFilter = "all" | "active" | "expired" | "none";

export default function AdminPremium() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PremiumFilter>("all");
  const [page, setPage] = useState(0);
  const [confirmUser, setConfirmUser] = useState<{ id: string; username: string; action: "grant" | "revoke" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-premium-users", search, filter, page],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, account_type, is_verified_premium, verified_premium_at, verified_premium_expires_at", { count: "exact" })
        .order("full_name", { ascending: true })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (search) {
        query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      if (filter === "active") {
        query = query.eq("is_verified_premium", true).gte("verified_premium_expires_at", new Date().toISOString());
      } else if (filter === "expired") {
        query = query.eq("is_verified_premium", true).lt("verified_premium_expires_at", new Date().toISOString());
      } else if (filter === "none") {
        query = query.or("is_verified_premium.is.null,is_verified_premium.eq.false");
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { users: data || [], total: count || 0 };
    },
  });

  const togglePremium = useMutation({
    mutationFn: async ({ userId, grant }: { userId: string; grant: boolean }) => {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const updates = grant
        ? {
            is_verified_premium: true,
            verified_premium_at: now.toISOString(),
            verified_premium_expires_at: expiresAt.toISOString(),
          }
        : {
            is_verified_premium: false,
            verified_premium_at: null,
            verified_premium_expires_at: null,
          };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-premium-users"] });
      toast.success(vars.grant ? "Verificação Premium concedida!" : "Verificação Premium removida.");
      setConfirmUser(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar verificação");
    },
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getPremiumStatus = (user: any) => {
    if (!user.is_verified_premium) return "none";
    if (user.verified_premium_expires_at && new Date(user.verified_premium_expires_at) < new Date()) return "expired";
    return "active";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários Premium</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie a verificação premium dos usuários</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou username..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "expired", "none"] as PremiumFilter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => { setFilter(f); setPage(0); }}
              >
                {f === "all" ? "Todos" : f === "active" ? "Ativos" : f === "expired" ? "Expirados" : "Sem Premium"}
              </Button>
            ))}
          </div>
        </div>

        {/* User list */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <span className="material-symbols-outlined text-[48px] mb-2 block">person_off</span>
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            users.map((user: any) => {
              const status = getPremiumStatus(user);
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {user.full_name || user.username}
                      </p>
                      {status === "active" && (
                        <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {status === "active" && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        Premium
                      </Badge>
                    )}
                    {status === "expired" && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                        Expirado
                      </Badge>
                    )}

                    {status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setConfirmUser({ id: user.id, username: user.username, action: "revoke" })}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => setConfirmUser({ id: user.id, username: user.username, action: "grant" })}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Verificar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{total} usuários</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ResponsiveAlertModal
        open={!!confirmUser}
        onOpenChange={(open) => !open && setConfirmUser(null)}
        title={confirmUser?.action === "grant" ? "Conceder Verificação Premium?" : "Remover Verificação Premium?"}
        description={
          confirmUser?.action === "grant"
            ? `O usuário @${confirmUser?.username} receberá o selo de verificação e poderá alterar o nome de usuário por 1 ano.`
            : `O usuário @${confirmUser?.username} perderá o selo de verificação e não poderá mais alterar o nome de usuário.`
        }
        cancelText="Cancelar"
        confirmText={confirmUser?.action === "grant" ? "Conceder" : "Remover"}
        onConfirm={() => {
          if (confirmUser) {
            togglePremium.mutate({ userId: confirmUser.id, grant: confirmUser.action === "grant" });
          }
        }}
        confirmVariant={confirmUser?.action === "revoke" ? "destructive" : "default"}
      />
    </AdminLayout>
  );
}
