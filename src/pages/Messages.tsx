import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { useCreateConversation } from "@/hooks/useMessages";
import { useFollowing } from "@/hooks/useFollowList";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { ConversationItem } from "@/components/messages/ConversationItem";
import { FollowingUserItem } from "@/components/messages/FollowingUserItem";
import { OnlineUserAvatar } from "@/components/messages/OnlineUserAvatar";
import { NotificationPermissionButton } from "@/components/notifications/NotificationPermissionButton";
import { OfflineIndicator } from "@/components/messages/OfflineIndicator";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Search, Loader2, UserPlus, Users, Circle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();
  const { createConversation } = useCreateConversation();
  const { data: followingUsers, isLoading: isLoadingFollowing } = useFollowing(user?.id || "");
  const { isUserOnline } = usePresenceContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null);

  // Set de IDs de usuários com conversas existentes
  const existingConversationUserIds = useMemo(() => {
    return new Set(
      conversations
        .filter((c) => c.participant)
        .map((c) => c.participant!.id)
    );
  }, [conversations]);

  // Filtrar usuários baseado na busca
  const filteredUsers = useMemo(() => {
    if (!followingUsers) return [];
    
    const users = followingUsers as unknown as Profile[];
    
    if (searchQuery.length < 2) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (profile) =>
        profile.username?.toLowerCase().includes(query) ||
        profile.full_name?.toLowerCase().includes(query)
    );
  }, [followingUsers, searchQuery]);

  // Separar usuários online e offline
  const { onlineUsers, offlineUsers } = useMemo(() => {
    const online: Profile[] = [];
    const offline: Profile[] = [];

    filteredUsers.forEach((user) => {
      if (isUserOnline(user.id)) {
        online.push(user);
      } else {
        offline.push(user);
      }
    });

    return { onlineUsers: online, offlineUsers: offline };
  }, [filteredUsers, isUserOnline]);

  const handleStartConversation = async (userId: string) => {
    setCreatingUserId(userId);
    try {
      const conversationId = await createConversation(userId);
      if (conversationId) {
        navigate(`/messages/${conversationId}`);
      } else {
        // Toast já é mostrado no hook, mas garantir feedback
        console.log("No conversation ID returned");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Erro ao iniciar conversa. Tente novamente.");
    } finally {
      setCreatingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center">
        <h1 className="text-lg font-semibold">Mensagens</h1>
      </div>

      {/* Content */}
      <div className="pt-14">
        {/* Offline indicator */}
        <div className="px-3 py-2">
          <OfflineIndicator />
        </div>

        {/* Notification permission prompt */}
        <div className="px-3 pb-2 flex justify-center">
          <NotificationPermissionButton />
        </div>

        {/* Campo de busca */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar entre quem você segue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoadingFollowing && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state - não segue ninguém */}
        {!isLoadingFollowing && filteredUsers.length === 0 && searchQuery.length < 2 && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-3" />
            <h2 className="text-lg font-medium mb-1">Você ainda não segue ninguém</h2>
            <p className="text-muted-foreground text-sm">
              Siga pessoas para iniciar conversas
            </p>
          </div>
        )}

        {/* Empty state - busca sem resultados */}
        {!isLoadingFollowing && filteredUsers.length === 0 && searchQuery.length >= 2 && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <Search className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Nenhum usuário encontrado para "{searchQuery}"
            </p>
          </div>
        )}

        {/* Lista de usuários seguidos */}
        {!isLoadingFollowing && filteredUsers.length > 0 && (
          <ScrollArea className="h-[calc(100vh-280px)]">
            {/* Seção Online - Horizontal scroll */}
            {onlineUsers.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-3">
                  <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Online agora ({onlineUsers.length})
                  </h3>
                </div>
                <div className="px-3">
                  <div className="grid grid-flow-col auto-cols-max gap-3 overflow-x-auto pb-2">
                    {onlineUsers.map((userProfile) => (
                      <OnlineUserAvatar
                        key={userProfile.id}
                        user={userProfile}
                        onClick={() => handleStartConversation(userProfile.id)}
                        disabled={creatingUserId !== null}
                        isLoading={creatingUserId === userProfile.id}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Seção Todos/Offline */}
            {offlineUsers.length > 0 && (
              <div className="px-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {onlineUsers.length > 0 ? "Outros" : "Quem você segue"} ({offlineUsers.length})
                  </h3>
                </div>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  {offlineUsers.map((userProfile) => (
                    <FollowingUserItem
                      key={userProfile.id}
                      user={userProfile}
                      isOnline={false}
                      hasConversation={existingConversationUserIds.has(userProfile.id)}
                      onClick={() => handleStartConversation(userProfile.id)}
                      disabled={creatingUserId !== null}
                      isLoading={creatingUserId === userProfile.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção de conversas recentes */}
            {conversations.length > 0 && (
              <div className="px-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Conversas recentes ({conversations.length})
                  </h3>
                </div>
                <div className="bg-muted/30 rounded-lg overflow-hidden divide-y divide-border">
                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      onClick={() => navigate(`/messages/${conversation.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        )}

        {/* Empty conversations state quando há usuários mas nenhuma conversa */}
        {!isLoadingFollowing && !isLoading && filteredUsers.length > 0 && conversations.length === 0 && (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Clique em alguém acima para iniciar uma conversa
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Messages;
