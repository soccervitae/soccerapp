import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X, Eye, Loader2 } from "lucide-react";
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
const DOC_TYPE_LABELS: Record<string, string> = {
  rg: "RG",
  cpf: "CPF",
  cnh: "CNH",
  passaporte: "Passaporte",
};

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
    mutationFn: async ({ requestId, userId, action, reason, documentType }: { requestId: string; userId: string; action: "approve" | "reject"; reason?: string; documentType?: string }) => {
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
        const profileUpdate: any = { is_identity_verified: true };
        if (documentType) {
          profileUpdate.identity_document_type = documentType;
        }
        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdate)
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
              const aiResult = req.ai_validation_result;
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>@{profile?.username}</span>
                      <span>·</span>
                      <span>{DOC_TYPE_LABELS[req.document_type] || req.document_type || "RG"}</span>
                      <span>·</span>
                      <span>{format(new Date(req.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                    {/* AI badge */}
                    {req.ai_validated && aiResult && (
                      <div className="mt-1">
                        {aiResult.overall_valid ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
                            <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                            IA: Válido ({aiResult.confidence}%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                            <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                            IA: Inválido
                          </Badge>
                        )}
                      </div>
                    )}
                    {!req.ai_validated && req.status === "pending" && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Aguardando IA...
                        </Badge>
                      </div>
                    )}
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
              // Find the request to get document_type
              const req = requests.find((r: any) => r.id === actionRequest.id);
              handleAction.mutate({
                requestId: actionRequest.id,
                userId: actionRequest.userId,
                action: "approve",
                documentType: req?.document_type,
              });
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
  const [revalidating, setRevalidating] = useState(false);
  const queryClient = useQueryClient();

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

  const handleRevalidate = async () => {
    if (!request?.id) return;
    setRevalidating(true);
    try {
      const { error } = await supabase.functions.invoke("validate-document", {
        body: { requestId: request.id },
      });
      if (error) throw error;
      toast.success("Reanálise pela IA iniciada!");
      queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] });
    } catch (err) {
      toast.error("Erro ao revalidar documento");
      console.error(err);
    } finally {
      setRevalidating(false);
    }
  };

  const aiResult = request?.ai_validation_result;

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => { if (!o) { setDocUrl(""); setSelfieUrl(""); } onOpenChange(o); }}>
      <ResponsiveModalContent className="max-w-lg">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Documentos de Verificação</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Nome completo</p>
              <p className="font-semibold text-sm">{request?.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Tipo de documento</p>
              <p className="font-semibold text-sm">{DOC_TYPE_LABELS[request?.document_type] || request?.document_type || "RG"}</p>
            </div>
          </div>

          {/* AI Analysis Result */}
          {aiResult && (
            <div className={`rounded-xl border p-3 ${aiResult.overall_valid ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                <span className="font-semibold text-sm">Análise da IA</span>
                <Badge className={`ml-auto text-[10px] ${aiResult.overall_valid ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                  {aiResult.overall_valid ? "Válido" : "Inválido"} · {aiResult.confidence}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs mb-2">
                <CheckItem label="Documento válido" ok={aiResult.is_valid_document} />
                <CheckItem label="Legível" ok={aiResult.document_readable} />
                <CheckItem label="Selfie com documento" ok={aiResult.selfie_has_document} />
                <CheckItem label="Rostos compatíveis" ok={aiResult.faces_match} />
                <CheckItem label="Nome compatível" ok={aiResult.name_matches} />
              </div>
              {aiResult.summary && (
                <p className="text-xs text-muted-foreground mt-1">{aiResult.summary}</p>
              )}
              {aiResult.issues?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-destructive">Problemas:</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 mt-1">
                    {aiResult.issues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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

          {request?.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleRevalidate}
              disabled={revalidating}
            >
              {revalidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="material-symbols-outlined text-[16px]">smart_toy</span>}
              {revalidating ? "Analisando..." : "Reanalisar com IA"}
            </Button>
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`material-symbols-outlined text-[14px] ${ok ? 'text-primary' : 'text-destructive'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {ok ? "check_circle" : "cancel"}
      </span>
      <span className={ok ? "text-foreground" : "text-destructive"}>{label}</span>
    </div>
  );
}
