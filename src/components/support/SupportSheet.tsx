import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { MessageSquarePlus, Send, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SupportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TicketType = "suggestion" | "complaint" | "bug" | "other";
type TicketStatus = "pending" | "in_progress" | "resolved" | "closed";

interface SupportTicket {
  id: string;
  type: TicketType;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_response: string | null;
  created_at: string;
  responded_at: string | null;
}

const typeLabels: Record<TicketType, string> = {
  suggestion: "Sugestão",
  complaint: "Reclamação",
  bug: "Problema técnico",
  other: "Outro",
};

const statusLabels: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "Em análise", color: "bg-blue-500/20 text-blue-400", icon: <Loader2 className="h-3 w-3" /> },
  resolved: { label: "Resolvido", color: "bg-green-500/20 text-green-400", icon: <CheckCircle className="h-3 w-3" /> },
  closed: { label: "Fechado", color: "bg-muted text-muted-foreground", icon: <AlertCircle className="h-3 w-3" /> },
};

export function SupportSheet({ open, onOpenChange }: SupportSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [type, setType] = useState<TicketType>("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id && open,
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        type,
        subject,
        message,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso!");
      setSubject("");
      setMessage("");
      setType("suggestion");
      setActiveTab("history");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error) => {
      console.error("Error creating ticket:", error);
      toast.error("Erro ao enviar mensagem");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    createTicketMutation.mutate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Central de Suporte
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "new" | "history")}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="new">Nova Mensagem</TabsTrigger>
            <TabsTrigger value="history">
              Histórico
              {tickets.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {tickets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de mensagem</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as TicketType)}
                  className="grid grid-cols-2 gap-2"
                >
                  {(Object.keys(typeLabels) as TicketType[]).map((t) => (
                    <div key={t} className="flex items-center space-x-2">
                      <RadioGroupItem value={t} id={t} />
                      <Label htmlFor={t} className="font-normal cursor-pointer">
                        {typeLabels[t]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  placeholder="Resumo do assunto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Descreva sua sugestão, reclamação ou problema..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[150px] resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/2000
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createTicketMutation.isPending || !subject.trim() || !message.trim()}
              >
                {createTicketMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Mensagem
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ScrollArea className="h-[calc(85vh-180px)]">
              {loadingTickets ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquarePlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mensagem enviada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-lg border bg-card space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {typeLabels[ticket.type]}
                            </Badge>
                            <Badge className={`text-xs flex items-center gap-1 ${statusLabels[ticket.status].color}`}>
                              {statusLabels[ticket.status].icon}
                              {statusLabels[ticket.status].label}
                            </Badge>
                          </div>
                          <h4 className="font-medium mt-1 truncate">{ticket.subject}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.message}
                      </p>

                      {ticket.admin_response && (
                        <div className="mt-2 p-3 rounded-md bg-primary/10 border-l-2 border-primary">
                          <p className="text-xs font-medium text-primary mb-1">
                            Resposta da equipe
                          </p>
                          <p className="text-sm">{ticket.admin_response}</p>
                          {ticket.responded_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(ticket.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
