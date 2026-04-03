import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedPost } from "@/components/feed/FeedPost";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { usePostById } from "@/hooks/usePosts";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";

const Post = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: post, isLoading, error } = usePostById(postId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const header = (
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
  );

  if (error || !post) {
    const errorContent = (
      <>
        {isMobile && header}
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
          <p className="text-muted-foreground font-medium">Publicação não encontrada</p>
          <p className="text-muted-foreground text-sm mt-1">
            Esta publicação pode ter sido removida ou não está disponível
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
            Voltar ao início
          </Button>
        </div>
      </>
    );

    if (!isMobile) {
      return (
        <div className="min-h-screen bg-muted/30">
          <DesktopHeader />
          <div className="flex pt-14 max-w-screen-2xl mx-auto">
            <DesktopSidebar />
            <main className="flex-1 min-w-0 px-4 py-4 lg:px-8">
              <div className="max-w-2xl mx-auto">{errorContent}</div>
            </main>
            <RightSidebar />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {errorContent}
        <BottomNavigation />
      </div>
    );
  }

  const postContent = (
    <div className="max-w-2xl mx-auto">
      <FeedPost post={post} />
    </div>
  );

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DesktopHeader />
        <div className="flex pt-14 max-w-screen-2xl mx-auto">
          <DesktopSidebar />
          <main className="flex-1 min-w-0 px-4 py-4 lg:px-8">
            {postContent}
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {header}
      {postContent}
      <BottomNavigation />
    </div>
  );
};

export default Post;
