import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedStories } from "@/components/feed/FeedStories";
import { FeedPost } from "@/components/feed/FeedPost";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { CreatePostInline } from "@/components/feed/CreatePostInline";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { usePosts } from "@/hooks/usePosts";
import { useStories } from "@/hooks/useStories";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnboarding } from "@/hooks/useOnboarding";
import { FeedSkeleton } from "@/components/skeletons/FeedSkeleton";
import { OfflineCacheIndicator } from "@/components/common/OfflineCacheIndicator";
import { RefreshableContainer } from "@/components/common/RefreshableContainer";
import { getPostsCacheTimestamp } from "@/lib/offlineStorage";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const { data: posts, isLoading, isFetching, isFromCache, refetch } = usePosts();
  const { refetch: refetchStories } = useStories();
  const isRefetching = isFetching && !isLoading;
  const isMobile = useIsMobile();
  const { showOnboarding, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const cacheTimestamp = isFromCache ? getPostsCacheTimestamp() : null;

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchStories()]);
  };

  // Show onboarding for first-time users
  if (!onboardingLoading && showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  const renderFeed = () => (
    <>
      {isLoading ? (
        <FeedSkeleton />
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
      <RefreshableContainer
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
        className="min-h-screen bg-background pb-24"
      >
        <FeedHeader />
        <main className="pt-16">
          <AnimatePresence>
            {isFromCache && <OfflineCacheIndicator lastUpdated={cacheTimestamp} />}
          </AnimatePresence>
          <FeedStories />
          {renderFeed()}
        </main>
        <BottomNavigation activeTab="home" />
      </RefreshableContainer>
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
            <AnimatePresence>
              {isFromCache && <OfflineCacheIndicator lastUpdated={cacheTimestamp} />}
            </AnimatePresence>
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
