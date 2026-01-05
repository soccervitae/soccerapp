import { useEffect, useRef } from "react";
import { FeedPost } from "@/components/feed/FeedPost";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface Post {
  id: string;
  media_url: string | null;
  media_type: string | null;
  content: string;
  created_at?: string;
  user_id?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  music_track_id?: string | null;
  music_start_seconds?: number | null;
  music_end_seconds?: number | null;
  liked_by_user?: boolean;
  saved_by_user?: boolean;
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  nickname?: string | null;
  avatar_url: string | null;
  conta_verificada?: boolean;
  gender?: string | null;
  role?: string | null;
  posicaomas?: number | null;
  posicaofem?: number | null;
  funcao?: number | null;
  position_name?: string | null;
}

interface ProfileFeedSheetProps {
  posts: Post[];
  initialPostIndex: number;
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  originRect?: DOMRect | null;
}

export const ProfileFeedSheet = ({
  posts,
  initialPostIndex,
  isOpen,
  onClose,
  profile,
  originRect,
}: ProfileFeedSheetProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Block body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Scroll to selected post
  useEffect(() => {
    if (isOpen && initialPostIndex >= 0 && postRefs.current[initialPostIndex]) {
      setTimeout(() => {
        postRefs.current[initialPostIndex]?.scrollIntoView({ behavior: "instant", block: "start" });
      }, 100);
    }
  }, [isOpen, initialPostIndex]);

  const getInitialPosition = () => {
    if (!originRect) {
      return { opacity: 0, scale: 0.9, borderRadius: "16px" };
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = originRect.left + originRect.width / 2;
    const originCenterY = originRect.top + originRect.height / 2;

    return {
      opacity: 0,
      scale: Math.min(originRect.width / window.innerWidth, 0.2),
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      borderRadius: "16px",
    };
  };

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
    shares_count: post.shares_count || 0,
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
      nickname: profile.nickname || profile.full_name || "",
      avatar_url: profile.avatar_url,
      team: "",
      conta_verificada: profile.conta_verificada || false,
      gender: profile.gender || null,
      role: profile.role || null,
      posicaomas: profile.posicaomas || null,
      posicaofem: profile.posicaofem || null,
      funcao: profile.funcao || null,
      position_name: profile.position_name || null,
    },
    liked_by_user: post.liked_by_user ?? false,
    saved_by_user: post.saved_by_user ?? false,
    recent_likes: [],
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Main container with expansion animation */}
          <motion.div
            className="relative w-full h-full flex flex-col bg-background overflow-hidden"
            initial={getInitialPosition()}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0, 
              y: 0, 
              borderRadius: "0px" 
            }}
            exit={getInitialPosition()}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 25 
            }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center px-4 h-14">
              <button 
                onClick={onClose}
                className="p-2 -ml-2 text-foreground hover:text-muted-foreground transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <span className="font-semibold ml-2">Posts</span>
            </div>

            {/* Feed */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
