import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FeedPost } from "@/components/feed/FeedPost";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
  // Debug (remove later)
  useEffect(() => {
    console.log("[ProfileFeedSheet] render", { isOpen, postsLen: posts.length, initialPostIndex });
  }, [isOpen, posts.length, initialPostIndex]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);
  const queryClient = useQueryClient();

  // Store originRect in state to preserve it during exit animation
  const [savedOriginRect, setSavedOriginRect] = useState<DOMRect | null>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const PULL_THRESHOLD = 80;

  // Save originRect when opening
  useEffect(() => {
    if (isOpen && originRect) {
      setSavedOriginRect(originRect);
    }
  }, [isOpen, originRect]);

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
        postRefs.current[initialPostIndex]?.scrollIntoView({ behavior: "auto", block: "start" });
      }, 100);
    }
  }, [isOpen, initialPostIndex]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    if (scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const scrollTop = scrollContainerRef.current?.scrollTop || 0;
      if (scrollTop > 0) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, (currentY - touchStartY.current) * 0.5);
      setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
    },
    [isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);

      // Match useUserPosts queryKey shape: ["user-posts", targetUserId, currentUserId]
      await queryClient.invalidateQueries({ queryKey: ["user-posts", profile.id], exact: false });

      setIsRefreshing(false);
    }

    setPullDistance(0);
  }, [pullDistance, isRefreshing, queryClient, profile.id]);

  const getInitialPosition = () => {
    const rect = savedOriginRect || originRect;
    if (!rect) {
      return { opacity: 0, scale: 0.95, y: 50 };
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = rect.left + rect.width / 2;
    const originCenterY = rect.top + rect.height / 2;

    return {
      opacity: 0,
      scale: Math.max(rect.width / window.innerWidth, 0.15),
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      borderRadius: "12px",
    };
  };

  const getExitPosition = () => {
    const rect = savedOriginRect;
    if (!rect) {
      return { opacity: 0, scale: 0.95, y: 50 };
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = rect.left + rect.width / 2;
    const originCenterY = rect.top + rect.height / 2;

    return {
      opacity: 0,
      scale: Math.max(rect.width / window.innerWidth, 0.15),
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      borderRadius: "12px",
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />

          {/* Main container with expansion animation */}
          <motion.div
            className="relative w-full h-full flex flex-col bg-background overflow-hidden"
            initial={getInitialPosition()}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, borderRadius: "0px" }}
            exit={getExitPosition()}
            transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.8 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center px-4 h-14">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-foreground hover:text-muted-foreground transition-colors"
                aria-label="Fechar feed do perfil"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <span className="font-semibold ml-2">Posts</span>
            </div>

            {/* Pull-to-refresh indicator */}
            <div
              className="flex items-center justify-center overflow-hidden transition-all duration-200"
              style={{ height: pullDistance > 0 ? pullDistance : 0 }}
            >
              {pullDistance > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                    style={{
                      transform: isRefreshing ? "none" : `rotate(${pullDistance * 3}deg)`,
                      opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
                    }}
                  />
                  <span className="text-sm" style={{ opacity: Math.min(pullDistance / PULL_THRESHOLD, 1) }}>
                    {isRefreshing
                      ? "Atualizando..."
                      : pullDistance >= PULL_THRESHOLD
                        ? "Solte para atualizar"
                        : "Puxe para atualizar"}
                  </span>
                </div>
              )}
            </div>

            {/* Feed */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  ref={(el) => {
                    postRefs.current[index] = el;
                  }}
                >
                  <FeedPost post={transformPostForFeed(post)} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
