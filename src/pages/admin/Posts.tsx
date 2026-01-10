import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, Heart, MessageCircle, ChevronLeft, ChevronRight, Share2, FileText, Image, Video } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { EditPostSheet } from "@/components/admin/EditPostSheet";

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  location_name: string | null;
  created_at: string;
  is_published: boolean | null;
  scheduled_at: string | null;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 20;

export default function AdminPosts() {
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Query for total count
  const { data: totalCount } = useQuery({
    queryKey: ["adminPostsCount", search],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select("id", { count: "exact", head: true });

      if (search) {
        query = query.ilike("content", `%${search}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  // Query for engagement stats
  const { data: engagementStats } = useQuery({
    queryKey: ["adminPostsEngagementStats"],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("likes_count, comments_count, shares_count, media_type");
      
      if (error) throw error;

      const stats = {
        totalPosts: posts?.length || 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        postsWithImage: 0,
        postsWithVideo: 0,
        postsTextOnly: 0,
      };

      posts?.forEach((post) => {
        stats.totalLikes += post.likes_count || 0;
        stats.totalComments += post.comments_count || 0;
        stats.totalShares += post.shares_count || 0;
        
        if (post.media_type === "video") {
          stats.postsWithVideo++;
        } else if (post.media_type === "image" || post.media_type === "carousel") {
          stats.postsWithImage++;
        } else {
          stats.postsTextOnly++;
        }
      });

      return stats;
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["adminPosts", search, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id(username, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.ilike("content", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      queryClient.invalidateQueries({ queryKey: ["adminPostsCount"] });
      toast.success("Post deletado com sucesso");
      setSelectedPost(null);
    },
    onError: () => {
      toast.error("Erro ao deletar post");
    },
  });

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page on search
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Posts</h1>
            <p className="text-muted-foreground">
              Gerencie todos os posts da plataforma
            </p>
          </div>
          
          {/* Stats Cards - Same style as Teams page */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-foreground">{engagementStats?.totalPosts || 0}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-red-500">{engagementStats?.totalLikes || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="h-3 w-3" /> Likes
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-blue-500">{engagementStats?.totalComments || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <MessageCircle className="h-3 w-3" /> Comentários
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-green-500">{engagementStats?.totalShares || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Share2 className="h-3 w-3" /> Shares
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-purple-500">{engagementStats?.postsWithImage || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Image className="h-3 w-3" /> Imagens
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-orange-500">{engagementStats?.postsWithVideo || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Video className="h-3 w-3" /> Vídeos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Autor</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Mídia</TableHead>
                <TableHead>Engajamento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : posts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum post encontrado
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
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {post.media_type === "video" ? (
                            <video 
                              src={post.media_url} 
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img 
                              src={post.media_url} 
                              alt="Post media"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.comments_count || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(post.created_at), "dd MMM yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedPost(post as Post)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver / Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
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
      </div>

      <EditPostSheet
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
        post={selectedPost}
        onDelete={(postId) => deletePostMutation.mutate(postId)}
        isDeleting={deletePostMutation.isPending}
      />
    </AdminLayout>
  );
}
