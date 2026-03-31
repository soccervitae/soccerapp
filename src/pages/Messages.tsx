import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useConversationsContext } from "@/contexts/ConversationsContext";
import { useCreateConversation } from "@/hooks/useMessages";
import { useFollowing } from "@/hooks/useFollowList";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { ConversationItem } from "@/components/messages/ConversationItem";
import { OnlineUserAvatar } from "@/components/messages/OnlineUserAvatar";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { OfflineIndicator } from "@/components/messages/OfflineIndicator";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { RefreshableContainer } from "@/components/common/RefreshableContainer";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Circle, Archive, ArchiveRestore, Trash2, MoreVertical, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessagesSkeleton, OnlineUsersSkeleton } from "@/components/skeletons/MessagesSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";
import type { ConversationWithDetails } from "@/hooks/useConversations";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, isLoading, isFetching, refetch } = useConversationsContext();
  const { createConversation } = useCreateConversation();
  const { data: followingUsers, isLoading: isLoadingFollowing, isFetching: isFetchingFollowing } = useFollowing(user?.id || "");
  
  const isRefetching = (isFetching || isFetchingFollowing) && !isLoading && !isLoadingFollowing;
  const { isUserOnline } = usePresenceContext();
  const { requestPermission } = usePushNotifications();
  
  // Request notification permission automatically on mount
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, [user, requestPermission]);

  const handleRefresh = async () => {
    await refetch();
  };

  // Listen for messages tab press to refresh
  useEffect(() => {
    const handleMessagesTabPressed = () => {
      handleRefresh();
    };
    
    window.addEventListener('messages-tab-pressed', handleMessagesTabPressed);
    return () => {
      window.removeEventListener('messages-tab-pressed', handleMessagesTabPressed);
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Set de IDs de usuários com conversas existentes
  const existingConversationUserIds = useMemo(() => {
    return new Set(conversations.filter(c => c.participant).map(c => c.participant!.id));
  }, [conversations]);

  // Filter conversations based on search
  const allConversations = useMemo(() => {
    const nonArchived = conversations.filter(c => !c.isArchived);
    if (searchQuery.length < 2) return nonArchived;
    const query = searchQuery.toLowerCase();
    return nonArchived.filter(c => {
      const name = c.participant?.full_name?.toLowerCase() || "";
      const username = c.participant?.username?.toLowerCase() || "";
      return name.includes(query) || username.includes(query);
    });
  }, [conversations, searchQuery]);

  const archivedConversations = useMemo(() => {
    return conversations.filter(c => c.isArchived);
  }, [conversations]);

  // Filtrar usuários baseado na busca
  const filteredUsers = useMemo(() => {
    if (!followingUsers) return [];
    const users = followingUsers as unknown as Profile[];
    if (searchQuery.length < 2) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(profile => profile.username?.toLowerCase().includes(query) || profile.full_name?.toLowerCase().includes(query));
  }, [followingUsers, searchQuery]);

  // Filtrar apenas usuários online
  const onlineUsers = useMemo(() => {
    return filteredUsers.filter(user => isUserOnline(user.id));
  }, [filteredUsers, isUserOnline]);

  const handleStartConversation = async (userId: string) => {
    setCreatingUserId(userId);
    try {
      const conversationId = await createConversation(userId);
      if (conversationId) {
        navigate(`/messages/${conversationId}`);
      } else {
        console.log("No conversation ID returned");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Erro ao iniciar conversa. Tente novamente.");
    } finally {
      setCreatingUserId(null);
    }
  };

  const handleUnarchive = async (conversationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_archived: false })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast.success("Conversa desarquivada");
      refetch();
    } catch (error) {
      console.error("Error unarchiving conversation:", error);
      toast.error("Erro ao desarquivar conversa");
    }
  };

  const handleDeleteClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !selectedConversationId) return;

    try {
      // Delete user's messages in this conversation
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", selectedConversationId)
        .eq("sender_id", user.id);

      // Remove user's participation
      const { error } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", selectedConversationId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Conversa apagada");
      refetch();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Erro ao apagar conversa");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedConversationId(null);
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

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const getSharedContentLabel = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === "shared_post") return "📷 Publicação compartilhada";
      if (parsed.type === "shared_story") return "📱 Story compartilhado";
      if (parsed.type === "shared_highlight") return "✨ Destaque compartilhado";
      if (parsed.type === "shared_profile") return "👤 Perfil compartilhado";
      return null;
    } catch {
      return null;
    }
  };

  const renderArchivedItem = (conversation: ConversationWithDetails) => (
    <div
      key={conversation.id}
      className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
    >
      <Avatar 
        className="h-12 w-12 cursor-pointer" 
        onClick={() => navigate(`/messages/${conversation.id}`)}
      >
        <AvatarImage src={conversation.participant?.avatar_url || undefined} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {getInitials(
            conversation.participant?.full_name ||
              conversation.participant?.username ||
              "U"
          )}
        </AvatarFallback>
      </Avatar>

      <div 
        className="flex-1 min-w-0 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/messages/${conversation.id}`)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground truncate">
            {conversation.participant?.full_name ||
              conversation.participant?.username ||
              "Usuário"}
          </span>
          {conversation.lastMessage && (
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatTime(conversation.lastMessage.created_at)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate max-w-full">
          {conversation.lastMessage 
            ? (getSharedContentLabel(conversation.lastMessage.content) || conversation.lastMessage.content || "Sem mensagens")
            : "Sem mensagens"}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleUnarchive(conversation.id)}>
            <ArchiveRestore className="h-4 w-4 mr-2" />
            Desarquivar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDeleteClick(conversation.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Apagar conversa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <RefreshableContainer
      onRefresh={handleRefresh}
      isRefreshing={isRefetching}
      className="min-h-screen bg-background pb-20"
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-[50px] flex items-center justify-between">
        <AnimatePresence mode="wait">
          {showSearch ? (
            <motion.div
              key="search-header"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 w-full"
            >
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                className="p-1 -ml-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Input
                autoFocus
                placeholder="Buscar entre quem você segue..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
              />
            </motion.div>
          ) : showArchived ? (
            <motion.div
              key="archived-header"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => setShowArchived(false)}
                className="p-1 -ml-1 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold">Arquivadas</h1>
            </motion.div>
          ) : (
            <motion.div
              key="main-header"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center justify-between w-full"
            >
              <h1 className="text-lg font-semibold">Mensagens</h1>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowArchived(true)}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors relative"
                >
                  <Archive className="w-5 h-5" />
                  {archivedConversations.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-medium bg-muted-foreground text-background rounded-full flex items-center justify-center">
                      {archivedConversations.length}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="pt-[50px]">
        {/* Offline indicator */}
        <div className="px-3 py-2">
          <OfflineIndicator />
        </div>

        <AnimatePresence mode="wait">
          {showArchived ? (
            <motion.div
              key="archived-content"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.2 }}
              className="px-3"
            >
              <ScrollArea className="h-[calc(100vh-140px)]">
                {archivedConversations.length > 0 ? (
                  <div className="mb-4">
                    <div className="bg-muted/30 rounded-lg overflow-hidden divide-y divide-border">
                      {archivedConversations.map(renderArchivedItem)}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma conversa arquivada
                    </p>
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="main-content"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
            >



              {/* Loading state */}
              {isLoadingFollowing && (
                <div className="px-3">
                  <OnlineUsersSkeleton />
                  <div className="mt-4">
                    <MessagesSkeleton />
                  </div>
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

              {/* Main content */}
              {!isLoadingFollowing && filteredUsers.length > 0 && (
                <ScrollArea className="h-[calc(100vh-200px)] px-3">
                  {/* Seção Online - Horizontal scroll (hide during search) */}
                  {onlineUsers.length > 0 && searchQuery.length < 2 && (
                    <div className="mb-4">
                      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                        {onlineUsers.map(userProfile => (
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
                  )}

                  {/* Search results - users you follow (only during search) */}
                  {searchQuery.length >= 2 && filteredUsers.filter(u => !existingConversationUserIds.has(u.id)).length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Pessoas que você segue
                        </h3>
                      </div>
                      <div className="bg-muted/30 rounded-lg overflow-hidden divide-y divide-border">
                        {filteredUsers.filter(u => !existingConversationUserIds.has(u.id)).map(userProfile => (
                          <div
                            key={userProfile.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleStartConversation(userProfile.id)}
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={userProfile.avatar_url || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {getInitials(userProfile.full_name || userProfile.username || "U")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {userProfile.full_name || userProfile.username}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                @{userProfile.username}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seção de conversas recentes */}
                  {allConversations.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          {searchQuery.length >= 2 ? `Conversas encontradas (${allConversations.length})` : `Conversas recentes (${allConversations.length})`}
                        </h3>
                      </div>
                      <div className="bg-muted/30 rounded-lg overflow-hidden divide-y divide-border">
                        {allConversations.map(conversation => (
                          <ConversationItem 
                            key={conversation.id} 
                            conversation={conversation} 
                            onClick={() => navigate(`/messages/${conversation.id}`)} 
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {allConversations.length === 0 && !isLoading && searchQuery.length < 2 && (
                    <div className="py-8 text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma conversa ainda. Clique em alguém online para iniciar!
                      </p>
                    </div>
                  )}

                  {/* Search empty state */}
                  {searchQuery.length >= 2 && allConversations.length === 0 && filteredUsers.filter(u => !existingConversationUserIds.has(u.id)).length === 0 && (
                    <div className="py-8 text-center">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum resultado para "{searchQuery}"
                      </p>
                    </div>
                  )}
                </ScrollArea>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todas as suas mensagens nesta conversa serão apagadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </RefreshableContainer>
  );
};

export default Messages;
