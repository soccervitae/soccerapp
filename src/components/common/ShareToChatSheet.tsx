import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowing } from "@/hooks/useFollowList";
import { useCreateConversation } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Loader2, Check, MessageCircle } from "lucide-react";

interface ShareToChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: "post" | "story" | "highlight";
  contentId: string;
  contentUrl: string;
  contentPreview?: string;
  contentTitle?: string;
}

export const ShareToChatSheet = ({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentUrl,
  contentPreview,
  contentTitle,
}: ShareToChatSheetProps) => {
  const { user } = useAuth();
  const { data: following = [], isLoading } = useFollowing(user?.id || "");
  const { createConversation } = useCreateConversation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  const filteredFollowing = useMemo(() => {
    if (!searchQuery.trim()) return following;
    const query = searchQuery.toLowerCase();
    return following.filter(
      (f) =>
        f.username.toLowerCase().includes(query) ||
        (f.full_name && f.full_name.toLowerCase().includes(query))
    );
  }, [following, searchQuery]);

  const getContentLabel = () => {
    switch (contentType) {
      case "post":
        return "publicação";
      case "story":
        return "replay";
      case "highlight":
        return "destaque";
      default:
        return "conteúdo";
    }
  };

  const handleSendTo = async (userId: string) => {
    if (!user || sendingTo) return;
    
    setSendingTo(userId);
    
    try {
      // Create or get existing conversation
      const conversationId = await createConversation(userId);
      
      if (!conversationId) {
        throw new Error("Não foi possível criar a conversa");
      }

      // Create the shared message
      const messageContent = contentTitle
        ? `📸 Compartilhei um(a) ${getContentLabel()}: "${contentTitle}"\n${contentUrl}`
        : `📸 Compartilhei um(a) ${getContentLabel()}\n${contentUrl}`;

      // Send the message
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent,
          media_url: contentPreview || null,
          media_type: contentPreview ? "image" : null,
        });

      if (messageError) throw messageError;

      // Mark as sent
      setSentTo((prev) => new Set([...prev, userId]));
      toast.success("Enviado com sucesso!");
    } catch (error) {
      console.error("Error sharing to chat:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSendingTo(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Reset sent state when sheet closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchQuery("");
      setSentTo(new Set());
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="z-[70] h-[70vh] flex flex-col rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>Compartilhar com...</SheetTitle>
        </SheetHeader>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar seguindo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Following list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFollowing.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum resultado encontrado" : "Você ainda não segue ninguém"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredFollowing.map((followingUser) => {
                const isSending = sendingTo === followingUser.id;
                const wasSent = sentTo.has(followingUser.id);

                return (
                  <button
                    key={followingUser.id}
                    onClick={() => handleSendTo(followingUser.id)}
                    disabled={isSending || wasSent}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={followingUser.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(followingUser.full_name || followingUser.username)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">
                          {followingUser.full_name || followingUser.username}
                        </span>
                        {followingUser.conta_verificada && (
                          <span className="material-symbols-outlined text-[14px] text-emerald-500">
                            verified
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        @{followingUser.username}
                      </span>
                    </div>

                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : wasSent ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px] text-primary-foreground">
                          send
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
