import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GuestMessages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["guest-messages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_messages" as any)
        .select("*")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("guest_messages" as any).update({ is_read: true } as any).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-messages"] }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("guest_messages" as any).delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-messages"] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-[50px] flex items-center">
        <button onClick={() => navigate("/settings")} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground ml-2">Mensagens de visitantes</h1>
      </header>

      <div className="pt-[50px] pb-20 px-4 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground/50 mb-3">mail</span>
            <p className="text-muted-foreground">Nenhuma mensagem recebida</p>
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`bg-card rounded-xl border p-4 space-y-2 ${!msg.is_read ? "border-primary/40" : "border-border"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{msg.sender_name}</p>
                    <p className="text-xs text-muted-foreground">{msg.sender_email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>

                {/* Social links */}
                <div className="flex flex-wrap gap-2">
                  {msg.sender_whatsapp && (
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      📱 {msg.sender_whatsapp}
                    </span>
                  )}
                  {msg.sender_facebook && (
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      📘 {msg.sender_facebook}
                    </span>
                  )}
                  {msg.sender_instagram && (
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      📷 {msg.sender_instagram}
                    </span>
                  )}
                </div>

                <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>

                <div className="flex gap-2 pt-1">
                  {!msg.is_read && (
                    <button onClick={() => markAsRead.mutate(msg.id)} className="text-xs text-primary font-medium hover:underline">
                      Marcar como lido
                    </button>
                  )}
                  <button onClick={() => deleteMessage.mutate(msg.id)} className="text-xs text-destructive font-medium hover:underline">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
