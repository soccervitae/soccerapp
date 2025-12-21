import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { ChatHeader } from "@/components/messages/ChatHeader";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { ChatInput } from "@/components/messages/ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { MessageWithSender } from "@/hooks/useMessages";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { messages, isLoading, isSending, sendMessage } = useMessages(conversationId || null);
  const [participant, setParticipant] = useState<Profile | null>(null);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch other participant
  useEffect(() => {
    const fetchParticipant = async () => {
      if (!conversationId || !user) return;

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id)
        .single();

      if (participants) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", participants.user_id)
          .single();
        setParticipant(profile);
      }
    };

    fetchParticipant();
  }, [conversationId, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (
    content: string,
    mediaUrl?: string,
    mediaType?: string,
    replyToMessageId?: string
  ) => {
    await sendMessage(content, mediaUrl, mediaType, replyToMessageId);
  };

  const handleReply = (message: MessageWithSender) => {
    setReplyTo(message);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ChatHeader participant={participant} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pt-16 pb-24 px-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">
              waving_hand
            </span>
            <p className="text-muted-foreground">
              Diga olá para {participant?.full_name || participant?.username}!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <div
                key={message.id}
                onDoubleClick={() => handleReply(message)}
                className="cursor-pointer"
              >
                <MessageBubble message={message} onReply={handleReply} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed input at bottom */}
      <div className="fixed bottom-0 left-0 right-0">
        <ChatInput
          onSend={handleSend}
          isSending={isSending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
};

export default Chat;
