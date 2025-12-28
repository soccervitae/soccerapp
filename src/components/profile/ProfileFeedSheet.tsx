import { useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FeedPost } from "@/components/feed/FeedPost";
import { motion, AnimatePresence } from "framer-motion";

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
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="sticky top-0 z-10 bg-background border-b border-border flex items-center px-4 h-14"
              >
                <button 
                  onClick={() => onClose()}
                  className="p-2 -ml-2 text-foreground hover:text-muted-foreground transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <span className="font-semibold ml-2">Posts</span>
              </motion.div>

              {/* Feed */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto"
              >
                {posts.map((post, index) => (
                  <motion.div 
                    key={post.id} 
                    ref={(el) => { postRefs.current[index] = el; }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: Math.min(index * 0.08, 0.4),
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    <FeedPost post={transformPostForFeed(post)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};
