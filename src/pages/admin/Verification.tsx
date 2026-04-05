import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Check, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";

const ITEMS_PER_PAGE = 20;

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminVerification() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(0);
  const [actionRequest, setActionRequest] = useState<{ id: string; userId: string; username: string; action: "approve" | "reject" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewRequest, setViewRequest] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verification-requests", filter, page],
    queryFn: async () => {
      let query = supabase
        .from("verification_requests")
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { requests: data || [], total: count || 0 };
    },
  });

  const handleAction = useMutation({
    mutationFn: async ({ requestId, userId, action, reason }: { requestId: string; userId: string; action: "approve" | "reject"; reason?: string }) => {
      const updates: any = {
        status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
      };
      if (action === "reject" && reason) {
        updates.rejection_reason = reason;
      }

      const { error: reqError } = await supabase
        .from("verification_requests")
        .update(updates)
        .eq("id", requestId);
      if (reqError) throw reqError;

      if (action === "approve") {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ is_identity_verified: true })
          .eq("id", userId);
        if (profileError) throw profileError;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] });
      toast.success(vars.action === "approve" ? "Verificação aprovada!" : "Verificação rejeitada.");
      setActionRequest(null);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Erro ao processar verificação");
    },
  });

  const requests = data?.requests || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getDocUrl = (path: string) => {
    const { data } = supabase.storage.from("verification-docs").getPublicUrl(path);
    return data.publicUrl;
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from("verification-docs").createSignedUrl(path, 3600);
    return data?.signedUrl || "";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verificação de Identidade</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as solicitações de verificação dos usuários</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(f); setPage(0); }}
            >
              {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : f === "approved" ? "Aprovados" : "Rejeitados"}
            </Button>
          ))}
        </div>

        {/* Request list */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <span className="material-symbols-outlined text-[48px] mb-2 block">verified</span>
              <p>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            requests.map((req: any) => {
              const profile = req.profiles;
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {req.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{profile?.username} · {format(new Date(req.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === "pending" && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Pendente</Badge>
                    )}
                    {req.status === "approved" && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Aprovado</Badge>
                    )}
                    {req.status === "rejected" && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Rejeitado</Badge>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewRequest(req)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {req.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => setActionRequest({ id: req.id, userId: req.user_id, username: profile?.username, action: "approve" })}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => setActionRequest({ id: req.id, userId: req.user_id, username: profile?.username, action: "reject" })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
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
            <p className="text-sm text-muted-foreground">{total} solicitações</p>
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

      {/* View Request Modal */}
      <ViewRequestModal
        request={viewRequest}
        open={!!viewRequest}
        onOpenChange={(open) => !open && setViewRequest(null)}
      />

      {/* Action Confirmation */}
      {actionRequest?.action === "approve" ? (
        <ResponsiveAlertModal
          open={!!actionRequest}
          onOpenChange={(open) => !open && setActionRequest(null)}
          title="Aprovar Verificação?"
          description={`O usuário @${actionRequest?.username} receberá o selo de verificação no perfil.`}
          cancelText="Cancelar"
          confirmText="Aprovar"
          onConfirm={() => {
            if (actionRequest) {
              handleAction.mutate({ requestId: actionRequest.id, userId: actionRequest.userId, action: "approve" });
            }
          }}
        />
      ) : actionRequest?.action === "reject" ? (
        <ResponsiveModal open={!!actionRequest} onOpenChange={(open) => !open && setActionRequest(null)}>
          <ResponsiveModalContent>
            <ResponsiveModalHeader>
              <ResponsiveModalTitle>Rejeitar Verificação</ResponsiveModalTitle>
            </ResponsiveModalHeader>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Informe o motivo da rejeição para @{actionRequest?.username}
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motivo da rejeição..."
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setActionRequest(null)}>Cancelar</Button>
                <Button
                  variant="destructive"
                  disabled={!rejectionReason.trim()}
                  onClick={() => {
                    if (actionRequest) {
                      handleAction.mutate({
                        requestId: actionRequest.id,
                        userId: actionRequest.userId,
                        action: "reject",
                        reason: rejectionReason.trim(),
                      });
                    }
                  }}
                >
                  Rejeitar
                </Button>
              </div>
            </div>
          </ResponsiveModalContent>
        </ResponsiveModal>
      ) : null}
    </AdminLayout>
  );
}

function ViewRequestModal({ request, open, onOpenChange }: { request: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [docUrl, setDocUrl] = useState<string>("");
  const [selfieUrl, setSelfieUrl] = useState<string>("");

  const loadUrls = async () => {
    if (!request) return;
    const [doc, selfie] = await Promise.all([
      supabase.storage.from("verification-docs").createSignedUrl(request.document_url, 3600),
      supabase.storage.from("verification-docs").createSignedUrl(request.selfie_url, 3600),
    ]);
    setDocUrl(doc.data?.signedUrl || "");
    setSelfieUrl(selfie.data?.signedUrl || "");
  };

  if (open && !docUrl && request) {
    loadUrls();
  }

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => { if (!o) { setDocUrl(""); setSelfieUrl(""); } onOpenChange(o); }}>
      <ResponsiveModalContent className="max-w-lg">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Documentos de Verificação</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Nome completo</p>
            <p className="font-semibold">{request?.full_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Documento</p>
            {docUrl ? (
              <img src={docUrl} alt="Documento" className="w-full h-48 object-contain rounded-lg border border-border bg-muted" />
            ) : (
              <Skeleton className="w-full h-48 rounded-lg" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Selfie com documento</p>
            {selfieUrl ? (
              <img src={selfieUrl} alt="Selfie" className="w-full h-48 object-contain rounded-lg border border-border bg-muted" />
            ) : (
              <Skeleton className="w-full h-48 rounded-lg" />
            )}
          </div>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
