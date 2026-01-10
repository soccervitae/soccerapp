import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Star, Image, Video } from "lucide-react";
import { CreatePostSheet } from "@/components/feed/CreatePostSheet";
import { AddHighlightSheet } from "@/components/profile/AddHighlightSheet";
import { ScheduledPostsSection } from "@/components/admin/ScheduledPostsSection";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminContent() {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [addHighlightOpen, setAddHighlightOpen] = useState(false);

  // Get official account ID
  const { data: officialAccount } = useQuery({
    queryKey: ['official-account'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('is_official_account', true)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Get recent posts from official account
  const { data: recentPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['official-posts', officialAccount?.id],
    queryFn: async () => {
      if (!officialAccount?.id) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', officialAccount.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!officialAccount?.id,
  });

  // Get recent highlights from official account
  const { data: recentHighlights, isLoading: highlightsLoading } = useQuery({
    queryKey: ['official-highlights', officialAccount?.id],
    queryFn: async () => {
      if (!officialAccount?.id) return [];
      
      const { data, error } = await supabase
        .from('user_highlights')
        .select('*, highlight_images(*)')
        .eq('user_id', officialAccount.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!officialAccount?.id,
  });

  const getMediaIcon = (mediaType: string | null) => {
    if (mediaType === 'video') return <Video className="w-4 h-4 text-blue-500" />;
    if (mediaType === 'carousel') return <Image className="w-4 h-4 text-purple-500" />;
    return <Image className="w-4 h-4 text-green-500" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conteúdo Oficial</h1>
          <p className="text-muted-foreground">
            Gerencie posts e destaques da conta SOCCER VITAE
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setCreatePostOpen(true)}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Criar Post</CardTitle>
                  <CardDescription>Publique no feed oficial</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Novo Post
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setAddHighlightOpen(true)}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Criar Destaque</CardTitle>
                  <CardDescription>Adicione ao perfil oficial</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Novo Destaque
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Posts */}
        {officialAccount?.id && (
          <ScheduledPostsSection userId={officialAccount.id} />
        )}

        {/* Recent Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Posts Recentes
              </CardTitle>
              <CardDescription>Últimos posts da conta oficial</CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : recentPosts && recentPosts.length > 0 ? (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {post.media_url && (
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {post.media_type === 'video' ? (
                            <video 
                              src={post.media_url.split(',')[0]} 
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img 
                              src={post.media_url.split(',')[0]} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {post.content || 'Post sem legenda'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {getMediaIcon(post.media_type)}
                          <span>
                            {format(new Date(post.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          👏 {post.likes_count || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum post ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                Destaques Recentes
              </CardTitle>
              <CardDescription>Últimos destaques da conta oficial</CardDescription>
            </CardHeader>
            <CardContent>
              {highlightsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : recentHighlights && recentHighlights.length > 0 ? (
                <div className="space-y-3">
                  {recentHighlights.map((highlight) => (
                    <div 
                      key={highlight.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        <img 
                          src={highlight.image_url} 
                          alt={highlight.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {highlight.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Image className="w-3 h-3" />
                          <span>{highlight.highlight_images?.length || 1} mídia(s)</span>
                          <span>•</span>
                          <span>
                            {format(new Date(highlight.created_at), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum destaque ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Sheet */}
      <CreatePostSheet
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
      />

      {/* Add Highlight Sheet */}
      <AddHighlightSheet
        open={addHighlightOpen}
        onOpenChange={setAddHighlightOpen}
      />
    </AdminLayout>
  );
}
