import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Shield,
  Ban,
  Heart,
  MessageCircle,
  Image,
  Users,
  Eye,
  Trophy,
  Flag,
  Ruler,
  Weight,
  Footprints,
  Trash2,
} from "lucide-react";

interface ViewUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onBan: (userId: string) => void;
  onUnban: (userId: string) => void;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
  onDelete?: (userId: string) => void;
  isBanning?: boolean;
  isDeleting?: boolean;
}

export function ViewUserSheet({
  open,
  onOpenChange,
  userId,
  onBan,
  onUnban,
  onToggleAdmin,
  onDelete,
  isBanning,
  isDeleting,
}: ViewUserSheetProps) {
  const [tab, setTab] = useState("info");

  // Fetch user details
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["adminUserDetails", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          nationality:paises!profiles_nationality_fkey(nome, bandeira_url),
          estado:estados!profiles_estado_id_fkey(nome, uf),
          funcao_perfil:funcaoperfil!profiles_funcao_fkey(name),
          posicao_mas:posicao_masculina!profiles_posicaomas_fkey(name),
          posicao_fem:posicao_feminina!profiles_posicaofem_fkey(name)
        `)
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  // Fetch user roles separately
  const { data: userRoles } = useQuery({
    queryKey: ["adminUserRoles", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  // Fetch user stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["adminUserStats", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const [posts, followers, following, likes, comments] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
        supabase.from("likes").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      
      return {
        posts: posts.count || 0,
        followers: followers.count || 0,
        following: following.count || 0,
        likes: likes.count || 0,
        comments: comments.count || 0,
      };
    },
    enabled: !!userId && open,
  });

  // Fetch recent posts
  const { data: recentPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ["adminUserRecentPosts", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, media_url, media_type, likes_count, comments_count, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  // Fetch user reports (reports made against this user's posts)
  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ["adminUserReports", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get posts by this user that have been reported
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", userId);
      
      if (!userPosts || userPosts.length === 0) return [];
      
      const postIds = userPosts.map(p => p.id);
      
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id,
          reason,
          status,
          created_at,
          reporter:reporter_id(username, avatar_url)
        `)
        .in("post_id", postIds)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  // Fetch profile reports against this user
  const { data: profileReports, isLoading: loadingProfileReports } = useQuery({
    queryKey: ["adminUserProfileReports", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("profile_reports")
        .select(`
          id,
          reason,
          status,
          created_at,
          reporter:profiles!profile_reports_reporter_id_fkey(username, avatar_url)
        `)
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  const isAdmin = userRoles?.some((r: any) => r.role === "admin");
  const position = user?.gender === "Feminino" ? user?.posicao_fem?.name : user?.posicao_mas?.name;

  const allReports = [
    ...(reports || []).map(r => ({ ...r, type: "post" })),
    ...(profileReports || []).map(r => ({ ...r, type: "profile" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-2xl max-h-[90vh]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Detalhes do Usuário</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Informações completas e histórico de atividades
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {loadingUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback className="text-2xl">
                    {user.full_name?.charAt(0) || user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold">{user.full_name || "Sem nome"}</h3>
                    {isAdmin && (
                      <Badge variant="default" className="bg-primary">Admin</Badge>
                    )}
                    {user.is_official_account && (
                      <Badge variant="secondary">Conta Oficial</Badge>
                    )}
                    {user.conta_verificada && (
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        Verificado
                      </Badge>
                    )}
                    {user.banned_at && (
                      <Badge variant="destructive">Banido</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{user.username}</p>
                  {user.bio && (
                    <p className="text-sm mt-2">{user.bio}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {loadingStats ? (
                <div className="grid grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : stats && (
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Image className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{stats.posts}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{stats.followers}</p>
                    <p className="text-xs text-muted-foreground">Seguidores</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{stats.following}</p>
                    <p className="text-xs text-muted-foreground">Seguindo</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{stats.likes}</p>
                    <p className="text-xs text-muted-foreground">Curtidas</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <MessageCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{stats.comments}</p>
                    <p className="text-xs text-muted-foreground">Comentários</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Tabs */}
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
                  <TabsTrigger value="posts" className="flex-1">Posts Recentes</TabsTrigger>
                  <TabsTrigger value="reports" className="flex-1">
                    Denúncias ({allReports.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Gênero:</span>
                        <span>{user.gender || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Nascimento:</span>
                        <span>
                          {user.birth_date
                            ? format(new Date(user.birth_date), "dd/MM/yyyy")
                            : "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Nacionalidade:</span>
                        <span className="flex items-center gap-1">
                          {user.nationality?.bandeira_url && (
                            <img src={user.nationality.bandeira_url} alt="" className="h-4 w-auto" />
                          )}
                          {user.nationality?.nome || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Estado:</span>
                        <span>{user.estado?.nome || "-"}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Tipo:</span>
                        <span>{user.funcao_perfil?.name || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Posição:</span>
                        <span>{position || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Altura:</span>
                        <span>{user.height ? `${user.height} cm` : "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Peso:</span>
                        <span>{user.weight ? `${user.weight} kg` : "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Footprints className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Pé preferido:</span>
                        <span>{user.preferred_foot || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Cadastrado em: {format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {user.banned_at && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm font-medium text-destructive">Banido em: {format(new Date(user.banned_at), "dd/MM/yyyy 'às' HH:mm")}</p>
                        {user.ban_reason && (
                          <p className="text-sm text-destructive/80 mt-1">Motivo: {user.ban_reason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-4">
                  {loadingPosts ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : recentPosts?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum post encontrado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentPosts?.map((post) => (
                        <div key={post.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          {post.media_url && (
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              {post.media_type === "video" ? (
                                <video src={post.media_url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{post.content || "Sem legenda"}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {post.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> {post.comments_count || 0}
                              </span>
                              <span>{format(new Date(post.created_at), "dd MMM yyyy", { locale: ptBR })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reports" className="mt-4">
                  {loadingReports || loadingProfileReports ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                      ))}
                    </div>
                  ) : allReports.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma denúncia registrada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allReports.map((report: any) => (
                        <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={report.reporter?.avatar_url || ""} />
                              <AvatarFallback>
                                {report.reporter?.username?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{report.reason}</p>
                              <p className="text-xs text-muted-foreground">
                                por @{report.reporter?.username} • {format(new Date(report.created_at), "dd MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {report.type === "post" ? "Post" : "Perfil"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                report.status === "resolved"
                                  ? "border-green-500 text-green-500"
                                  : report.status === "rejected"
                                  ? "border-red-500 text-red-500"
                                  : "border-yellow-500 text-yellow-500"
                              }
                            >
                              {report.status === "resolved" ? "Resolvida" : report.status === "rejected" ? "Rejeitada" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onToggleAdmin(user.id, isAdmin)}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isAdmin ? "Remover Admin" : "Tornar Admin"}
                  </Button>
                  {user.banned_at ? (
                    <Button
                      variant="outline"
                      onClick={() => onUnban(user.id)}
                      disabled={isBanning}
                      className="flex-1"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Remover Banimento
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => onBan(user.id)}
                      disabled={isBanning}
                      className="flex-1"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Banir Usuário
                    </Button>
                  )}
                </div>
                
                {/* Delete button - only shown for banned users */}
                {user.banned_at && onDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(user.id)}
                    disabled={isDeleting}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Excluindo..." : "Excluir Usuário Permanentemente"}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}