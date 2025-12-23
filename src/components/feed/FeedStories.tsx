import { useState } from "react";
import { StoryViewer } from "./StoryViewer";
import { CreateReplaySheet } from "./CreateReplaySheet";
import { useStories, useCreateStory, type GroupedStories } from "@/hooks/useStories";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export const FeedStories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  return (
    <>
      <div className="bg-background border-b border-border">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 px-4">
          {/* Add Story Button */}
          <div
            className="flex-none w-28 cursor-pointer group"
            onClick={handleAddStoryClick}
          >
            <div className="relative h-44 rounded-xl overflow-hidden shadow-md">
              <div className="w-full h-full bg-muted flex flex-col">
                <div className="flex-1 bg-gradient-to-b from-nav-active/20 to-nav-active/5 flex items-center justify-center">
                  <div className="w-10 h-10 bg-nav-active rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-[24px] text-white">add</span>
                  </div>
                </div>
                <div className="bg-background px-2 py-3 text-center">
                  <p className="text-xs font-semibold text-foreground truncate">Criar replay</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Stories */}
          {groupedStories?.map((group, index) => (
            <div
              key={group.userId}
              className="flex-none w-28 cursor-pointer group"
              onClick={() => handleStoryClick(index)}
            >
              <div className="relative h-44 rounded-xl overflow-hidden shadow-md">
                <img
                  src={group.stories[0]?.media_url || "/placeholder.svg"}
                  alt={group.username}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                
                <div className="absolute top-2 left-2">
                  <div className={`w-9 h-9 rounded-full p-[2px] ${group.hasNewStory ? 'bg-gradient-to-tr from-primary to-emerald-400' : 'bg-muted'}`}>
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
          ))}

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
