import { useState } from "react";
import { StoryViewer } from "./StoryViewer";
import { CreateReplaySheet } from "./CreateReplaySheet";
import { useStories, useCreateStory, type GroupedStories } from "@/hooks/useStories";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export const FeedStories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: groupedStories, isLoading } = useStories();
  const createStory = useCreateStory();
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [createReplayOpen, setCreateReplayOpen] = useState(false);

  const handleStoryClick = (groupIndex: number) => {
    setSelectedGroupIndex(groupIndex);
    setViewerOpen(true);
  };

  const handleAddStoryClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setCreateReplayOpen(true);
  };

  const handleReplayCreated = async (replay: { image: string; caption: string; isVideo?: boolean }) => {
    await createStory.mutateAsync({
      mediaUrl: replay.image,
      mediaType: replay.isVideo ? "video" : "image",
      duration: replay.isVideo ? 15 : 5,
    });
    setCreateReplayOpen(false);
  };

  if (isLoading) {
    return (
      <div className="bg-background border-b border-border">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-none w-28">
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Find the current user's story group
  const userStoryGroup = groupedStories?.find(g => g.userId === user?.id);
  const hasOwnStories = !!userStoryGroup && userStoryGroup.stories.length > 0;
  const hasUnviewedOwnStories = userStoryGroup?.hasNewStory ?? false;

  // Filter out user's own stories from the main list (will show in "Seu replay" card)
  const otherStories = groupedStories?.filter(g => g.userId !== user?.id) || [];

  // Handle clicking on own story
  const handleOwnStoryClick = () => {
    if (hasOwnStories && userStoryGroup) {
      const ownIndex = groupedStories?.findIndex(g => g.userId === user?.id) ?? 0;
      setSelectedGroupIndex(ownIndex);
      setViewerOpen(true);
    } else {
      handleAddStoryClick();
    }
  };

  return (
    <>
      <div className="bg-background border-b border-border">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 px-4">
          {/* Add Story Button - Instagram Style */}
          <div
            className="flex-none w-28 cursor-pointer group"
            onClick={handleOwnStoryClick}
          >
            <div className={`relative h-44 rounded-xl overflow-hidden shadow-md ${hasOwnStories ? (hasUnviewedOwnStories ? 'ring-2 ring-primary' : 'ring-2 ring-muted-foreground/30') : ''}`}>
              <div className="w-full h-full bg-muted flex flex-col">
                {/* User photo area */}
                <div className="flex-1 relative overflow-hidden">
                  <img
                    src={hasOwnStories ? (userStoryGroup.stories[0]?.media_url || profile?.avatar_url || "/placeholder.svg") : (profile?.avatar_url || "/placeholder.svg")}
                    alt="Seu replay"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                  
                  {/* Avatar with ring indicator when has stories */}
                  {hasOwnStories && (
                    <div className="absolute top-2 left-2">
                      <div className={`w-9 h-9 rounded-full p-[2px] ${hasUnviewedOwnStories ? 'bg-gradient-to-tr from-primary to-emerald-400' : 'bg-muted-foreground/40'}`}>
                        <img
                          src={profile?.avatar_url || "/placeholder.svg"}
                          alt="Seu replay"
                          className="w-full h-full rounded-full border-2 border-background object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Bottom section with + icon overlapping */}
                <div className="relative bg-background px-2 py-3 pt-4 text-center">
                  {/* + icon positioned at the border */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-[3px] border-background shadow-lg ${hasOwnStories ? 'bg-muted-foreground/60' : 'bg-nav-active'}`}>
                      <span className="material-symbols-outlined text-[18px] text-white">add</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate mt-1">Seu replay</p>
                </div>
              </div>
            </div>
          </div>

          {/* Other User Stories */}
          {otherStories.map((group) => {
            const originalIndex = groupedStories?.findIndex(g => g.userId === group.userId) ?? 0;
            return (
              <div
                key={group.userId}
                className="flex-none w-28 cursor-pointer group"
                onClick={() => handleStoryClick(originalIndex)}
              >
                <div className="relative h-44 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={group.stories[0]?.media_url || "/placeholder.svg"}
                    alt={group.username}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                  
                  <div className="absolute top-2 left-2">
                    <div className={`w-9 h-9 rounded-full p-[2px] ${group.hasNewStory ? 'bg-gradient-to-tr from-primary to-emerald-400' : 'bg-muted-foreground/40'}`}>
                      <img
                        src={group.avatarUrl || "/placeholder.svg"}
                        alt={group.username}
                        className="w-full h-full rounded-full border-2 border-background object-cover"
                      />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-semibold text-white truncate drop-shadow-md">
                      {group.fullName?.split(' ')[0] || group.username}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {(!groupedStories || groupedStories.length === 0) && (
            <div className="flex-none w-28 flex flex-col items-center justify-center h-44 bg-muted/50 rounded-xl">
              <span className="material-symbols-outlined text-[32px] text-muted-foreground/50">movie</span>
              <p className="text-[10px] text-muted-foreground mt-1">Sem replays</p>
            </div>
          )}
        </div>
      </div>

      {groupedStories && groupedStories.length > 0 && (
        <StoryViewer
          groupedStories={groupedStories}
          initialGroupIndex={selectedGroupIndex}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}

      <CreateReplaySheet
        open={createReplayOpen}
        onOpenChange={setCreateReplayOpen}
        onReplayCreated={handleReplayCreated}
      />
    </>
  );
};
