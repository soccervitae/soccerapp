import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Eye,
  Lightbulb,
  AlertTriangle,
  Bug,
  HelpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsCard } from "@/components/admin/StatsCard";

type TicketType = "suggestion" | "complaint" | "bug" | "other";
type TicketStatus = "pending" | "in_progress" | "resolved" | "closed";

interface SupportTicket {
  id: string;
  user_id: string;
  type: TicketType;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const typeLabels: Record<TicketType, { label: string; icon: React.ReactNode }> = {
  suggestion: { label: "Sugestão", icon: <Lightbulb className="h-4 w-4 text-yellow-400" /> },
  complaint: { label: "Reclamação", icon: <AlertTriangle className="h-4 w-4 text-red-400" /> },
  bug: { label: "Bug", icon: <Bug className="h-4 w-4 text-orange-400" /> },
  other: { label: "Outro", icon: <HelpCircle className="h-4 w-4 text-muted-foreground" /> },
};

const statusLabels: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "Em análise", color: "bg-blue-500/20 text-blue-400", icon: <Loader2 className="h-3 w-3" /> },
  resolved: { label: "Resolvido", color: "bg-green-500/20 text-green-400", icon: <CheckCircle className="h-3 w-3" /> },
  closed: { label: "Fechado", color: "bg-muted text-muted-foreground", icon: <AlertCircle className="h-3 w-3" /> },
};

export default function AdminSupport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TicketType | "all">("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState<TicketStatus>("pending");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets", statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as SupportTicket[];
    },
  });

  const respondMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !user?.id) return;

      const isNewResponse = response && response !== selectedTicket.admin_response;

      const { error } = await supabase
        .from("support_tickets")
        .update({
          status: newStatus,
          admin_response: response || null,
          responded_by: response ? user.id : selectedTicket.responded_by,
          responded_at: response ? new Date().toISOString() : selectedTicket.responded_at,
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      // Send notification if there's a new response
      if (isNewResponse) {
        try {
          const { error: notifyError } = await supabase.functions.invoke('notify-support-response', {
            body: {
              ticket_id: selectedTicket.id,
              admin_response: response,
            },
          });

          if (notifyError) {
            console.error("Error sending notification:", notifyError);
            // Don't throw - ticket was updated successfully
          }
        } catch (notifyErr) {
          console.error("Failed to send notification:", notifyErr);
        }
      }
    },
    onSuccess: () => {
      toast.success("Ticket atualizado com sucesso!");
      setSelectedTicket(null);
      setResponse("");
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (error) => {
      console.error("Error updating ticket:", error);
      toast.error("Erro ao atualizar ticket");
    },
  });

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.admin_response || "");
    setNewStatus(ticket.status);
  };

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === "pending").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Suporte</h1>
          <p className="text-muted-foreground">Gerencie mensagens dos usuários</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total" value={stats.total} icon={MessageSquare} />
          <StatsCard title="Pendentes" value={stats.pending} icon={Clock} />
          <StatsCard title="Em análise" value={stats.inProgress} icon={Loader2} />
          <StatsCard title="Resolvidos" value={stats.resolved} icon={CheckCircle} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_progress">Em análise</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TicketType | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="suggestion">Sugestões</SelectItem>
              <SelectItem value="complaint">Reclamações</SelectItem>
              <SelectItem value="bug">Bugs</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum ticket encontrado</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ticket.profiles?.avatar_url || ""} />
                          <AvatarFallback>
                            {ticket.profiles?.username?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">
                            @{ticket.profiles?.username || "Desconhecido"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {typeLabels[ticket.type].icon}
                        <span className="text-sm">{typeLabels[ticket.type].label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-1 max-w-[200px]">{ticket.subject}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`flex items-center gap-1 w-fit ${statusLabels[ticket.status].color}`}>
                        {statusLabels[ticket.status].icon}
                        {statusLabels[ticket.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openTicket(ticket)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Ticket Detail Sheet */}
        <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedTicket && (
              <>
                <SheetHeader className="pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    {typeLabels[selectedTicket.type].icon}
                    {typeLabels[selectedTicket.type].label}
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                  {/* User info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedTicket.profiles?.avatar_url || ""} />
                      <AvatarFallback>
                        {selectedTicket.profiles?.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">@{selectedTicket.profiles?.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <Label className="text-muted-foreground">Assunto</Label>
                    <p className="font-medium">{selectedTicket.subject}</p>
                  </div>

                  {/* Message */}
                  <div>
                    <Label className="text-muted-foreground">Mensagem</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg mt-1">
                      {selectedTicket.message}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TicketStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em análise</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Response */}
                  <div className="space-y-2">
                    <Label>Resposta para o usuário</Label>
                    <Textarea
                      placeholder="Digite sua resposta (opcional)"
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="min-h-[120px] resize-none"
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {response.length}/2000
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => respondMutation.mutate()}
                    disabled={respondMutation.isPending}
                  >
                    {respondMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Atualizar Ticket
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
