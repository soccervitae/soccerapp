import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedStories } from "@/components/feed/FeedStories";
import { FeedPost } from "@/components/feed/FeedPost";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { CreatePostInline } from "@/components/feed/CreatePostInline";
import { usePosts } from "@/hooks/usePosts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: posts, isLoading } = usePosts();
  const isMobile = useIsMobile();

  const renderFeed = () => (
    <>
      {isLoading ? (
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="w-full aspect-square rounded-lg" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        posts.map((post) => <FeedPost key={post.id} post={post} />)
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <span className="material-symbols-outlined text-[64px] text-muted-foreground/50 mb-4">
            photo_library
          </span>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum post ainda
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Seja o primeiro a compartilhar algo!
          </p>
        </div>
      )}
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <FeedHeader />
        <main className="pt-16">
          <FeedStories />
          {renderFeed()}
        </main>
        <BottomNavigation activeTab="home" />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-muted/30">
      <DesktopHeader />
      <div className="flex pt-14 max-w-screen-2xl mx-auto">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 px-4 py-4 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <FeedStories />
            <CreatePostInline />
            {renderFeed()}
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default Index;
