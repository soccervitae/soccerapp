import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveAlertModal,
} from "@/components/ui/responsive-modal";
import { 
  AlertTriangle, 
  Check, 
  X, 
  Trash2, 
  Calendar, 
  MapPin,
  MessageSquare,
  Heart,
  Share2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportedPost {
  id: string;
  post_id: string;
  reason: string;
  description?: string | null;
  status: string;
  created_at: string;
  reporter?: {
    username: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
    media_url?: string | null;
    media_type?: string | null;
    location_name?: string | null;
    likes_count?: number | null;
    comments_count?: number | null;
    shares_count?: number | null;
    created_at: string;
    user_id: string;
    profiles?: {
      username: string;
      avatar_url?: string;
    };
  };
}

interface ViewReportedPostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportedPost | null;
  onResolve: () => void;
  onReject: () => void;
  onDeletePost: () => void;
  isDeleting?: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  reviewing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  reviewing: "Em análise",
  resolved: "Resolvida",
  rejected: "Rejeitada",
};

export function ViewReportedPostSheet({
  open,
  onOpenChange,
  report,
  onResolve,
  onReject,
  onDeletePost,
  isDeleting = false,
}: ViewReportedPostSheetProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!report) return null;

  const post = report.post;
  const isPostDeleted = !post || !post.content;

  const handleDeletePost = () => {
    onDeletePost();
    setShowDeleteConfirm(false);
  };

  const renderMedia = () => {
    if (!post?.media_url) return null;

    const urls = post.media_url.split(",");
    const types = post.media_type?.split(",") || [];

    return (
      <div className="mt-3">
        {urls.length === 1 ? (
          types[0]?.includes("video") ? (
            <video
              src={urls[0]}
              controls
              className="w-full max-h-64 object-cover rounded-lg"
            />
          ) : (
            <img
              src={urls[0]}
              alt="Post media"
              className="w-full max-h-64 object-cover rounded-lg"
            />
          )
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {urls.slice(0, 4).map((url, index) => (
              <div key={index} className="relative aspect-square">
                {types[index]?.includes("video") ? (
                  <video
                    src={url}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                {index === 3 && urls.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">
                      +{urls.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent className="max-w-lg">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Denúncia de Post
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>

          <div className="space-y-4 px-4 pb-4">
            {/* Report Info */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusColors[report.status]}>
                  {statusLabels[report.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Motivo</span>
                <span className="text-sm font-medium">{report.reason}</span>
              </div>
              {report.description && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Descrição</span>
                  <p className="text-sm bg-background p-2 rounded">{report.description}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Denunciado por</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={report.reporter?.avatar_url || ""} />
                    <AvatarFallback className="text-xs">
                      {report.reporter?.username?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">@{report.reporter?.username}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data</span>
                <span className="text-sm">
                  {format(new Date(report.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>

            <Separator />

            {/* Post Content */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Post Denunciado</h4>
              
              {isPostDeleted ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                  <Trash2 className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive font-medium">Post já foi excluído</p>
                </div>
              ) : (
                <div className="bg-card border rounded-lg p-4">
                  {/* Post Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post?.profiles?.avatar_url || ""} />
                      <AvatarFallback>
                        {post?.profiles?.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">@{post?.profiles?.username}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post?.created_at || ""), "dd MMM yyyy", { locale: ptBR })}
                        {post?.location_name && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            {post.location_name}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-sm whitespace-pre-wrap">{post?.content}</p>

                  {/* Post Media */}
                  {renderMedia()}

                  {/* Post Stats */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t text-muted-foreground">
                    <div className="flex items-center gap-1 text-xs">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{post?.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{post?.comments_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{post?.shares_count || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Ações</h4>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="justify-start h-11 border-green-500/30 text-green-600 hover:bg-green-500/10"
                  onClick={() => {
                    onResolve();
                    onOpenChange(false);
                  }}
                  disabled={report.status === "resolved"}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marcar como resolvida
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-11 border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                  onClick={() => {
                    onReject();
                    onOpenChange(false);
                  }}
                  disabled={report.status === "rejected"}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar denúncia
                </Button>
                
                {!isPostDeleted && (
                  <Button
                    variant="outline"
                    className="justify-start h-11 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Excluindo..." : "Excluir post"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      <ResponsiveAlertModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir post?"
        description="Esta ação não pode ser desfeita. O post será permanentemente removido da plataforma."
        onConfirm={handleDeletePost}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </>
  );
}
