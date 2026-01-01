import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useArchivedConversations } from "@/hooks/useArchivedConversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreVertical, ArchiveRestore, Trash2, Archive, PowerOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ArchivedConversations = () => {
  const navigate = useNavigate();
  const { conversations, isLoading, unarchiveConversation, deleteConversation } = useArchivedConversations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

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
      if (parsed.type === "shared_content") {
        switch (parsed.contentType) {
          case "post":
            return "📷 Publicação compartilhada";
          case "story":
            return "📱 Replay compartilhado";
          case "highlight":
            return "⭐ Destaque compartilhado";
          default:
            return "📤 Conteúdo compartilhado";
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  const handleUnarchive = async (conversationId: string) => {
    const success = await unarchiveConversation(conversationId);
    if (success) {
      toast.success("Conversa desarquivada");
    } else {
      toast.error("Erro ao desarquivar conversa");
    }
  };

  const handleDeleteClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeactivateClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setDeactivateDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConversationId) return;
    
    const success = await deleteConversation(selectedConversationId);
    if (success) {
      toast.success("Conversa apagada");
    } else {
      toast.error("Erro ao apagar conversa");
    }
    setDeleteDialogOpen(false);
    setSelectedConversationId(null);
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedConversationId) return;
    
    const success = await deleteConversation(selectedConversationId);
    if (success) {
      toast.success("Conversa desativada");
    } else {
      toast.error("Erro ao desativar conversa");
    }
    setDeactivateDialogOpen(false);
    setSelectedConversationId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-2 h-14 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-transparent">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Conversas Arquivadas</h1>
      </div>

      {/* Content */}
      <div className="pt-14">
        {isLoading ? (
          <div className="px-3 py-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Archive className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-1">Nenhuma conversa arquivada</h2>
            <p className="text-muted-foreground text-sm">
              Conversas arquivadas aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-56px)]">
            <div className="px-4 py-2">
              <div className="bg-muted/30 rounded-xl overflow-hidden divide-y divide-border">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-all"
                  >
                    <button
                      onClick={() => navigate(`/messages/${conversation.id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={conversation.participant?.avatar_url || ""}
                          alt={conversation.participant?.username || ""}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(
                            conversation.participant?.full_name ||
                              conversation.participant?.username ||
                              "?"
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 overflow-hidden">
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
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-card">
                        <DropdownMenuItem
                          onClick={() => handleUnarchive(conversation.id)}
                          className="gap-2 cursor-pointer"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                          Desarquivar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeactivateClick(conversation.id)}
                          className="gap-2 cursor-pointer text-orange-500 focus:text-orange-500"
                        >
                          <PowerOff className="h-4 w-4" />
                          Desativar conversa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(conversation.id)}
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Apagar conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
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

      {/* Deactivate confirmation dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao desativar esta conversa, ela será removida permanentemente e você não receberá mais mensagens desta pessoa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArchivedConversations;
