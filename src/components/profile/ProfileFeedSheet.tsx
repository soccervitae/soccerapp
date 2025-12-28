import { useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FeedPost } from "@/components/feed/FeedPost";

interface Post {
  id: string;
  media_url: string | null;
  media_type: string | null;
  content: string;
  created_at?: string;
  user_id?: string;
  likes_count?: number;
  comments_count?: number;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  music_track_id?: string | null;
  music_start_seconds?: number | null;
  music_end_seconds?: number | null;
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  conta_verificada?: boolean;
}

interface ProfileFeedSheetProps {
  posts: Post[];
  initialPostIndex: number;
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export const ProfileFeedSheet = ({
  posts,
  initialPostIndex,
  isOpen,
  onClose,
  profile,
}: ProfileFeedSheetProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && initialPostIndex >= 0 && postRefs.current[initialPostIndex]) {
      setTimeout(() => {
        postRefs.current[initialPostIndex]?.scrollIntoView({ behavior: "instant", block: "start" });
      }, 100);
    }
  }, [isOpen, initialPostIndex]);

  const transformPostForFeed = (post: Post) => ({
    id: post.id,
    content: post.content,
    media_url: post.media_url,
    media_type: post.media_type,
    created_at: post.created_at || new Date().toISOString(),
    updated_at: post.created_at || new Date().toISOString(),
    user_id: post.user_id || profile.id,
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    location_name: post.location_name,
    location_lat: post.location_lat,
    location_lng: post.location_lng,
    music_track_id: post.music_track_id,
    music_start_seconds: post.music_start_seconds,
    music_end_seconds: post.music_end_seconds,
    music_track: null,
    profiles: {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      conta_verificada: profile.conta_verificada || false,
    },
    profile: {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      nickname: profile.full_name || "",
      avatar_url: profile.avatar_url,
      position: "",
      team: "",
      conta_verificada: profile.conta_verificada || false,
    },
    liked_by_user: false,
    saved_by_user: false,
    recent_likes: [],
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-full p-0 border-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center px-4 h-14">
          <button 
            onClick={() => onClose()}
            className="p-2 -ml-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <span className="font-semibold ml-2">Posts</span>
        </div>

        {/* Feed */}
        <div 
          ref={scrollContainerRef}
          className="h-[calc(100%-56px)] overflow-y-auto"
        >
          {posts.map((post, index) => (
            <div 
              key={post.id} 
              ref={(el) => { postRefs.current[index] = el; }}
            >
              <FeedPost post={transformPostForFeed(post)} />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
