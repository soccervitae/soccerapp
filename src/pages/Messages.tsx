import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { useCreateConversation } from "@/hooks/useMessages";
import { useFollowing } from "@/hooks/useFollowList";
import { ConversationItem } from "@/components/messages/ConversationItem";
import { NotificationPermissionButton } from "@/components/notifications/NotificationPermissionButton";
import { OfflineIndicator } from "@/components/messages/OfflineIndicator";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, MessageSquarePlus, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();
  const { createConversation } = useCreateConversation();
  const { data: followingUsers, isLoading: isLoadingFollowing } = useFollowing(user?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filter following users based on search query
  useEffect(() => {
    if (!followingUsers) {
      setFilteredUsers([]);
      return;
    }

    if (searchQuery.length < 2) {
      // Cast to Profile[] since FollowUser has compatible fields
      setFilteredUsers(followingUsers as unknown as Profile[]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = followingUsers.filter(
      (profile) =>
        profile.username?.toLowerCase().includes(query) ||
        profile.full_name?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered as unknown as Profile[]);
  }, [searchQuery, followingUsers]);

  const handleStartConversation = async (userId: string) => {
    setIsCreating(true);
    try {
      const conversationId = await createConversation(userId);
      if (conversationId) {
        setSheetOpen(false);
        navigate(`/messages/${conversationId}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mensagens</h1>
        </div>

        <ResponsiveModal open={sheetOpen} onOpenChange={setSheetOpen}>
          <ResponsiveModalTrigger asChild>
            <Button variant="ghost" size="icon">
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          </ResponsiveModalTrigger>
          <ResponsiveModalContent className="sm:max-w-md h-[80vh] sm:h-[500px] flex flex-col">
            <ResponsiveModalHeader>
              <ResponsiveModalTitle>Nova Conversa</ResponsiveModalTitle>
            </ResponsiveModalHeader>
            <div className="mt-4 space-y-4 flex-1 flex flex-col">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar entre quem você segue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {isLoadingFollowing && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {!isLoadingFollowing && filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <UserPlus className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        {searchQuery.length >= 2 
                          ? "Nenhum usuário encontrado" 
                          : "Você ainda não segue ninguém"}
                      </p>
                      {searchQuery.length < 2 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Siga pessoas para iniciar conversas
                        </p>
                      )}
                    </div>
                  )}

                  {filteredUsers.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleStartConversation(profile.id)}
                      disabled={isCreating}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg disabled:opacity-50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(profile.full_name || profile.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{profile.full_name || profile.username}</p>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </ResponsiveModalContent>
        </ResponsiveModal>
      </div>

      {/* Content */}
      <div className="pt-14 px-2">
        {/* Offline indicator */}
        <div className="p-3">
          <OfflineIndicator />
        </div>

        {/* Notification permission prompt */}
        <div className="px-3 pb-3 flex justify-center">
          <NotificationPermissionButton />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4">
              chat_bubble_outline
            </span>
            <h2 className="text-lg font-medium mb-2">Nenhuma conversa ainda</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Comece uma nova conversa tocando no botão acima
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => navigate(`/messages/${conversation.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Messages;
