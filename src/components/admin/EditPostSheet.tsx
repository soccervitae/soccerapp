import { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveAlertModal,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Trash2, Calendar, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface EditPostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onDelete: (postId: string) => void;
  isDeleting?: boolean;
}

export function EditPostSheet({
  open,
  onOpenChange,
  post,
  onDelete,
  isDeleting = false,
}: EditPostSheetProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!post) return null;

  const handleDelete = () => {
    onDelete(post.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent className="sm:max-w-lg">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Detalhes do Post</ResponsiveModalTitle>
          </ResponsiveModalHeader>

          <div className="space-y-4 p-4">
            {/* Author info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.profiles?.avatar_url || ""} />
                <AvatarFallback>
                  {post.profiles?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {post.profiles?.full_name || post.profiles?.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{post.profiles?.username}
                </p>
              </div>
              <a
                href={`/${post.profiles?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <Separator />

            {/* Media preview */}
            {post.media_url && (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                {post.media_type === "video" ? (
                  <video
                    src={post.media_url}
                    controls
                    className="w-full max-h-64 object-contain"
                  />
                ) : (
                  <img
                    src={post.media_url}
                    alt="Post media"
                    className="w-full max-h-64 object-contain"
                  />
                )}
              </div>
            )}

            {/* Content */}
            {post.content && (
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-2">
              {post.media_type && (
                <Badge variant="secondary">
                  {post.media_type === "video" ? "Vídeo" : "Imagem"}
                </Badge>
              )}
              {post.is_published === false && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                  Agendado
                </Badge>
              )}
              {post.location_name && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {post.location_name}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                {post.likes_count || 0} aplausos
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                {post.comments_count || 0} comentários
              </span>
              <span className="flex items-center gap-1.5">
                <Share2 className="h-4 w-4" />
                {post.shares_count || 0} compartilhamentos
              </span>
            </div>

            {/* Date info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Publicado em{" "}
                {format(new Date(post.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>

            {post.scheduled_at && !post.is_published && (
              <div className="flex items-center gap-2 text-sm text-yellow-500">
                <Calendar className="h-4 w-4" />
                <span>
                  Agendado para{" "}
                  {format(new Date(post.scheduled_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                Excluir Post
              </Button>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      <ResponsiveAlertModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir post?"
        description="Esta ação não pode ser desfeita. O post será permanentemente removido junto com todos os comentários, curtidas e compartilhamentos."
        confirmText={isDeleting ? "Excluindo..." : "Excluir"}
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />
    </>
  );
}
