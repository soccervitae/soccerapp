import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Check, X, Eye, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

interface ModerationPost {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  moderation_status: string | null;
  moderation_reason: string | null;
  moderated_at: string | null;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 20;

export default function AdminModeration() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedPost, setSelectedPost] = useState<ModerationPost | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query for counts by status
  const { data: statusCounts } = useQuery({
    queryKey: ["moderationStatusCounts"],
    queryFn: async () => {
      const statuses = ['pending', 'approved', 'rejected'];
      const counts: Record<string, number> = {};
      
      for (const status of statuses) {
        const { count, error } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("moderation_status", status);
        
        if (!error) {
          counts[status] = count || 0;
        }
      }
      
      return counts;
    },
  });

  // Query for posts by moderation status
  const { data: posts, isLoading } = useQuery({
    queryKey: ["moderationPosts", activeTab, search, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("posts")
        .select(`
          id,
          content,
          media_url,
          media_type,
          moderation_status,
          moderation_reason,
          moderated_at,
          created_at,
          profiles:user_id(id, username, full_name, avatar_url)
        `)
        .eq("moderation_status", activeTab)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.ilike("content", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ModerationPost[];
    },
  });

  // Query for total count
  const { data: totalCount } = useQuery({
    queryKey: ["moderationPostsCount", activeTab, search],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("moderation_status", activeTab);

      if (search) {
        query = query.ilike("content", `%${search}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("posts")
        .update({
          moderation_status: "approved",
          is_published: true,
          published_at: new Date().toISOString(),
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id,
          moderation_reason: null,
        })
        .eq("id", postId);
      
      if (error) throw error;

      // Notify user
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (post) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user?.id,
          type: "moderation",
          content: "Seu post foi aprovado pela moderação e está publicado!",
          post_id: postId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderationPosts"] });
      queryClient.invalidateQueries({ queryKey: ["moderationPostsCount"] });
      queryClient.invalidateQueries({ queryKey: ["moderationStatusCounts"] });
      toast.success("Post aprovado com sucesso!");
      setSelectedPost(null);
    },
    onError: () => {
      toast.error("Erro ao aprovar post");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      const { error } = await supabase
        .from("posts")
        .update({
          moderation_status: "rejected",
          is_published: false,
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id,
          moderation_reason: reason,
        })
        .eq("id", postId);
      
      if (error) throw error;

      // Notify user
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (post) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user?.id,
          type: "moderation",
          content: `Seu post foi rejeitado pela moderação: ${reason}`,
          post_id: postId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderationPosts"] });
      queryClient.invalidateQueries({ queryKey: ["moderationPostsCount"] });
      queryClient.invalidateQueries({ queryKey: ["moderationStatusCounts"] });
      toast.success("Post rejeitado");
      setSelectedPost(null);
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Erro ao rejeitar post");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderationPosts"] });
      queryClient.invalidateQueries({ queryKey: ["moderationPostsCount"] });
      queryClient.invalidateQueries({ queryKey: ["moderationStatusCounts"] });
      toast.success("Post deletado");
      setSelectedPost(null);
    },
    onError: () => {
      toast.error("Erro ao deletar post");
    },
  });

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getMediaUrls = (mediaUrl: string | null): string[] => {
    if (!mediaUrl) return [];
    try {
      const parsed = JSON.parse(mediaUrl);
      return Array.isArray(parsed) ? parsed : [mediaUrl];
    } catch {
      return [mediaUrl];
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Aprovado</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moderação de Conteúdo</h1>
          <p className="text-muted-foreground">
            Gerencie posts aprovados e rejeitados pela moderação automática
          </p>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending" className="relative">
              <Clock className="h-4 w-4 mr-1" />
              Pendente
              {(statusCounts?.pending || 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {statusCounts?.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprovados
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="h-4 w-4 mr-1" />
              Rejeitados
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por conteúdo..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Autor</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Mídia</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-12 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : posts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum post encontrado nesta categoria
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts?.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.profiles?.avatar_url || ""} />
                              <AvatarFallback>
                                {post.profiles?.username?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">
                              @{post.profiles?.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground line-clamp-2 max-w-xs">
                            {post.content || "Sem legenda"}
                          </p>
                        </TableCell>
                        <TableCell>
                          {post.media_url ? (
                            <div className="flex gap-1">
                              {getMediaUrls(post.media_url).slice(0, 2).map((url, idx) => (
                                <div key={idx} className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  {post.media_type === "video" ? (
                                    <video 
                                      src={url} 
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                  ) : (
                                    <img 
                                      src={url} 
                                      alt="Post media"
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              ))}
                              {getMediaUrls(post.media_url).length > 2 && (
                                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground">
                                  +{getMediaUrls(post.media_url).length - 2}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(post.moderation_status)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                            {post.moderation_reason || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(post.created_at), "dd MMM yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedPost(post)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {activeTab === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => approveMutation.mutate(post.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedPost(post);
                                    setIsRejectDialogOpen(true);
                                  }}
                                  disabled={rejectMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount || 0)} de {totalCount} posts
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Preview Dialog */}
      <Dialog open={!!selectedPost && !isRejectDialogOpen} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Post</DialogTitle>
            <DialogDescription>
              Revise o conteúdo antes de aprovar ou rejeitar
            </DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedPost.profiles?.avatar_url || ""} />
                  <AvatarFallback>
                    {selectedPost.profiles?.username?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">@{selectedPost.profiles?.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedPost.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {getStatusBadge(selectedPost.moderation_status)}
              </div>

              {/* Content */}
              {selectedPost.content && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-foreground whitespace-pre-wrap">{selectedPost.content}</p>
                </div>
              )}

              {/* Media */}
              {selectedPost.media_url && (
                <div className="grid grid-cols-2 gap-2">
                  {getMediaUrls(selectedPost.media_url).map((url, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden bg-muted aspect-square">
                      {selectedPost.media_type === "video" ? (
                        <video 
                          src={url} 
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img 
                          src={url} 
                          alt={`Media ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Moderation Reason */}
              {selectedPost.moderation_reason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Motivo da Rejeição
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {selectedPost.moderation_reason}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedPost?.moderation_status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsRejectDialogOpen(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => selectedPost && approveMutation.mutate(selectedPost.id)}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </>
            )}
            {selectedPost?.moderation_status === "rejected" && (
              <Button
                variant="destructive"
                onClick={() => selectedPost && deleteMutation.mutate(selectedPost.id)}
                disabled={deleteMutation.isPending}
              >
                Deletar Permanentemente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Post</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O usuário será notificado.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Ex: Conteúdo viola as diretrizes da comunidade por conter..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRejectDialogOpen(false);
              setRejectionReason("");
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPost && rejectMutation.mutate({ 
                postId: selectedPost.id, 
                reason: rejectionReason || "Conteúdo viola as diretrizes da comunidade" 
              })}
              disabled={rejectMutation.isPending}
            >
              Rejeitar Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
