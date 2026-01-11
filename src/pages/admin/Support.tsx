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
import { Input } from "@/components/ui/input";
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
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsCard } from "@/components/admin/StatsCard";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
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
  const [replyMessage, setReplyMessage] = useState("");
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

  const { data: ticketReplies = [], isLoading: loadingReplies } = useQuery({
    queryKey: ["admin-ticket-replies", selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return [];
      const { data, error } = await supabase
        .from("support_ticket_replies")
        .select("*")
        .eq("ticket_id", selectedTicket.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as TicketReply[];
    },
    enabled: !!selectedTicket?.id,
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !user?.id || !replyMessage.trim()) return;

      // Insert the reply
      const { error: replyError } = await supabase
        .from("support_ticket_replies")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: replyMessage,
          is_admin_reply: true,
        });

      if (replyError) throw replyError;

      // Update ticket status if needed
      const updateData: Record<string, any> = {
        status: newStatus,
      };

      // If this is the first admin response, also update admin_response field
      if (!selectedTicket.admin_response) {
        updateData.admin_response = replyMessage;
        updateData.responded_by = user.id;
        updateData.responded_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", selectedTicket.id);

      if (updateError) throw updateError;

      // Send notification
      try {
        await supabase.functions.invoke('notify-support-response', {
          body: {
            ticket_id: selectedTicket.id,
            admin_response: replyMessage,
          },
        });
      } catch (notifyErr) {
        console.error("Failed to send notification:", notifyErr);
      }
    },
    onSuccess: () => {
      toast.success("Resposta enviada!");
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-replies", selectedTicket?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (error) => {
      console.error("Error sending reply:", error);
      toast.error("Erro ao enviar resposta");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: TicketStatus) => {
      if (!selectedTicket) return;

      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", selectedTicket.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    },
  });

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyMessage("");
    setNewStatus(ticket.status);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }
    replyMutation.mutate();
  };

  const handleStatusChange = (status: TicketStatus) => {
    setNewStatus(status);
    updateStatusMutation.mutate(status);
  };

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === "pending").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  // Count unread replies (user replies after last admin response)
  const getUnreadCount = (ticket: SupportTicket) => {
    // This would require additional query - for now just show indicator if pending
    return ticket.status === "pending" && ticket.admin_response ? 1 : 0;
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
                  <TableRow key={ticket.id} className={ticket.status === "pending" && ticket.admin_response ? "bg-yellow-500/5" : ""}>
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
                      <div className="flex items-center gap-2">
                        <span className="line-clamp-1 max-w-[200px]">{ticket.subject}</span>
                        {ticket.status === "pending" && ticket.admin_response && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                            <MessageCircle className="h-2.5 w-2.5 mr-0.5" />
                            Nova
                          </Badge>
                        )}
                      </div>
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

        {/* Ticket Conversation Sheet */}
        <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
            {selectedTicket && (
              <>
                <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedTicket.profiles?.avatar_url || ""} />
                      <AvatarFallback>
                        {selectedTicket.profiles?.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-left truncate text-base">
                        @{selectedTicket.profiles?.username}
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground truncate">{selectedTicket.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {typeLabels[selectedTicket.type].icon}
                      {typeLabels[selectedTicket.type].label}
                    </Badge>
                    <Select value={newStatus} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
                      <SelectTrigger className="h-7 w-auto text-xs">
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
                </SheetHeader>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {/* Original message from user */}
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-sm bg-muted">
                        <p className="text-sm">{selectedTicket.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(selectedTicket.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {/* First admin response (legacy) */}
                    {selectedTicket.admin_response && (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] p-3 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground">
                          <p className="text-sm">{selectedTicket.admin_response}</p>
                          {selectedTicket.responded_at && (
                            <p className="text-xs opacity-70 mt-1 text-right">
                              {format(new Date(selectedTicket.responded_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Thread replies */}
                    {loadingReplies ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      ticketReplies.map((reply) => (
                        <div key={reply.id} className={`flex ${reply.is_admin_reply ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] p-3 rounded-2xl ${
                              reply.is_admin_reply
                                ? "rounded-tr-sm bg-primary text-primary-foreground"
                                : "rounded-tl-sm bg-muted"
                            }`}
                          >
                            <p className="text-sm">{reply.message}</p>
                            <p className={`text-xs mt-1 ${reply.is_admin_reply ? "opacity-70 text-right" : "text-muted-foreground"}`}>
                              {format(new Date(reply.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Reply input */}
                {selectedTicket.status !== "closed" && (
                  <form onSubmit={handleReplySubmit} className="flex-shrink-0 p-4 border-t flex gap-2">
                    <Input
                      placeholder="Digite sua resposta..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="flex-1"
                      maxLength={2000}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={replyMutation.isPending || !replyMessage.trim()}
                    >
                      {replyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                )}

                {selectedTicket.status === "closed" && (
                  <div className="flex-shrink-0 p-4 border-t">
                    <p className="text-sm text-muted-foreground text-center">
                      Este ticket está fechado.
                    </p>
                  </div>
                )}
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
