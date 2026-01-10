import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Clock, 
  MoreVertical, 
  Play, 
  Pencil, 
  Trash2,
  Image,
  Video
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  useScheduledPosts, 
  usePublishNow, 
  useCancelScheduledPost,
  ScheduledPost 
} from "@/hooks/useScheduledPosts";
import { EditScheduleSheet } from "./EditScheduleSheet";

interface ScheduledPostsSectionProps {
  userId: string;
}

export const ScheduledPostsSection = ({ userId }: ScheduledPostsSectionProps) => {
  const { data: scheduledPosts, isLoading } = useScheduledPosts(userId);
  const publishNow = usePublishNow();
  const cancelPost = useCancelScheduledPost();
  
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const getMediaIcon = (mediaType: string | null) => {
    if (mediaType === 'video') return <Video className="w-4 h-4 text-blue-500" />;
    if (mediaType === 'carousel') return <Image className="w-4 h-4 text-purple-500" />;
    return <Image className="w-4 h-4 text-green-500" />;
  };

  const handlePublishNow = (postId: string) => {
    publishNow.mutate(postId);
  };

  const handleDelete = () => {
    if (deletingPostId) {
      cancelPost.mutate(deletingPostId);
      setDeletingPostId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Posts Agendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Posts Agendados
          </CardTitle>
          <CardDescription>
            Posts programados para publicação futura
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledPosts && scheduledPosts.length > 0 ? (
            <div className="space-y-3">
              {scheduledPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  {/* Media Preview */}
                  {post.media_url && (
                    <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {post.media_type === 'video' ? (
                        <video 
                          src={post.media_url.startsWith('[') ? JSON.parse(post.media_url)[0] : post.media_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img 
                          src={post.media_url.startsWith('[') ? JSON.parse(post.media_url)[0] : post.media_url}
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {post.content || 'Post sem legenda'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {getMediaIcon(post.media_type)}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(post.scheduled_at), "dd MMM, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handlePublishNow(post.id)}
                        disabled={publishNow.isPending}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Publicar agora
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingPost(post)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar agendamento
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingPostId(post.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancelar post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum post agendado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Schedule Sheet */}
      {editingPost && (
        <EditScheduleSheet
          post={editingPost}
          open={!!editingPost}
          onOpenChange={(open) => !open && setEditingPost(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar post agendado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O post será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
