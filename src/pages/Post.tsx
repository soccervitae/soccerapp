import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedPost } from "@/components/feed/FeedPost";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { usePostById } from "@/hooks/usePosts";

const Post = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = usePostById(postId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Publicação</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
          <p className="text-muted-foreground font-medium">Publicação não encontrada</p>
          <p className="text-muted-foreground text-sm mt-1">
            Esta publicação pode ter sido removida ou não está disponível
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/")}
          >
            Voltar ao início
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Publicação</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        <FeedPost post={post} />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Post;
