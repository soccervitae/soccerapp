import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showNotification, isGranted } = usePushNotifications();
  const notifiedMessagesRef = useRef<Set<string>>(new Set());

  const handleNewMessage = useCallback(async (payload: any) => {
    const newMessage = payload.new;
    
    // Não notificar mensagens próprias
    if (!user || newMessage.sender_id === user.id) return;
    
    // Verificar se já notificou esta mensagem
    if (notifiedMessagesRef.current.has(newMessage.id)) return;
    notifiedMessagesRef.current.add(newMessage.id);
    
    // Verificar se está na conversa ativa
    const isInConversation = location.pathname.includes(`/messages/${newMessage.conversation_id}`);
    if (isInConversation) return;
    
    // Verificar se o usuário é participante desta conversa
    const { data: isParticipant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", newMessage.conversation_id)
      .eq("user_id", user.id)
      .single();
      
    if (!isParticipant) return;
    
    // Buscar info do remetente
    const { data: sender } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", newMessage.sender_id)
      .single();

    const senderName = sender?.full_name || sender?.username || "Alguém";
    
    // Formatar preview da mensagem
    let messagePreview = newMessage.content || "";
    if (newMessage.media_type === "audio") {
      messagePreview = "🎤 Mensagem de voz";
    } else if (newMessage.media_type === "image") {
      messagePreview = "📷 Foto";
    } else if (newMessage.media_type === "video") {
      messagePreview = "🎥 Vídeo";
    }

    // Mostrar notificação push (se permitido)
    if (isGranted) {
      showNotification(
        senderName,
        messagePreview,
        `/messages/${newMessage.conversation_id}`,
        newMessage.conversation_id
      );
    }
  }, [user, location.pathname, isGranted, showNotification]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("global-message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        handleNewMessage
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleNewMessage]);
};
