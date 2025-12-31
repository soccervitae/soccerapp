import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowing } from "@/hooks/useFollowList";
import { useCreateConversation } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Loader2, Check, MessageCircle, Send } from "lucide-react";

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
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
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

  const toggleUserSelection = (userId: string) => {
    if (sentTo.has(userId)) return;
    
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSendToSelected = async () => {
    if (!user || selectedUsers.size === 0 || isSending) return;
    
    setIsSending(true);
    
    const sharedContent = JSON.stringify({
      type: "shared_content",
      contentType: contentType,
      contentId: contentId,
      url: contentUrl,
      preview: contentPreview || null,
      title: contentTitle || null,
    });

    let successCount = 0;
    let errorCount = 0;
    const newSentTo = new Set(sentTo);

    for (const userId of selectedUsers) {
      try {
        const conversationId = await createConversation(userId);
        
        if (!conversationId) {
          errorCount++;
          continue;
        }

        const { error: messageError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: sharedContent,
            media_url: null,
            media_type: "shared_content",
          });

        if (messageError) {
          errorCount++;
        } else {
          successCount++;
          newSentTo.add(userId);
          
          // Record the share for post content type
          if (contentType === "post" && contentId) {
            await supabase
              .from("post_shares")
              .insert({
                post_id: contentId,
                user_id: user.id,
                shared_to_user_id: userId,
              });
          }
        }
      } catch (error) {
        console.error("Error sharing to user:", userId, error);
        errorCount++;
      }
    }

    setSentTo(newSentTo);
    setSelectedUsers(new Set());

    if (successCount > 0 && errorCount === 0) {
      toast.success(`Enviado para ${successCount} pessoa${successCount > 1 ? "s" : ""}!`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Enviado para ${successCount}, falhou para ${errorCount}`);
    } else {
      toast.error("Erro ao enviar mensagens");
    }

    setIsSending(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedUsers(new Set());
      setSentTo(new Set());
      setIsSending(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="z-[70] h-[70vh] flex flex-col rounded-t-2xl" overlayClassName="z-[70]">
        <SheetHeader className="pb-2">
          <SheetTitle>Compartilhar com...</SheetTitle>
        </SheetHeader>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar torcendo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Following list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFollowing.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum resultado encontrado" : "Você ainda não torce por ninguém"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredFollowing.map((followingUser) => {
                const isSelected = selectedUsers.has(followingUser.id);
                const wasSent = sentTo.has(followingUser.id);

                return (
                  <button
                    key={followingUser.id}
                    onClick={() => toggleUserSelection(followingUser.id)}
                    disabled={wasSent || isSending}
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

                    {wasSent ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed footer with send button */}
        {selectedUsers.size > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <Button
              onClick={handleSendToSelected}
              disabled={isSending}
              className="w-full gap-2"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar para {selectedUsers.size} pessoa{selectedUsers.size > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
