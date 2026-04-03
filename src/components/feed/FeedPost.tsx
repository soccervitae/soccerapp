import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Bookmark } from "lucide-react";
import { useLikePost, useSavePost, useUpdatePost, useDeletePost, useReportPost, type Post } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { CommentsSheet } from "./CommentsSheet";
import { LikesSheet } from "./LikesSheet";
import { MusicDetailsSheet } from "./MusicDetailsSheet";
import { usePostTags } from "@/hooks/usePostTags";
import { FullscreenVideoViewer } from "./FullscreenVideoViewer";
import { FullscreenImageViewer } from "./FullscreenImageViewer";
import { useStories } from "@/hooks/useStories";
import { StoryViewer } from "./StoryViewer";
import { ShareToChatSheet } from "@/components/common/ShareToChatSheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { ClappingHandsIcon } from "@/components/icons/ClappingHandsIcon";
import { fetchFreshDeezerPreviewUrl, isDeezerSignedUrlExpired } from "@/lib/deezer";
import { getGlobalMuteState, setGlobalMuteState, GLOBAL_MUTE_EVENT } from "@/lib/globalMuteState";

// Module-level variables to track currently playing music across all FeedPost instances
let currentlyPlayingFeedMusic: HTMLAudioElement | null = null;
let currentlyPlayingFeedMusicStop: (() => void) | null = null;

interface FeedPostProps {
  post: Post;
  disableVideoViewer?: boolean;
}
const REPORT_REASONS = [{
  value: "spam",
  label: "Spam ou conteúdo enganoso"
}, {
  value: "inappropriate",
  label: "Conteúdo impróprio"
}, {
  value: "harassment",
  label: "Assédio ou bullying"
}, {
  value: "violence",
  label: "Violência ou ameaças"
}, {
  value: "other",
  label: "Outro motivo"
}];
export const FeedPost = ({
  post,
  disableVideoViewer = false
}: FeedPostProps) => {
  const isMobile = useIsMobile();
  const isLandscapeMobile = isMobile && window.innerWidth > window.innerHeight;
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [isCommentsSheetOpen, setIsCommentsSheetOpen] = useState(false);
  const [isLikesSheetOpen, setIsLikesSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const [showApplauseAnimation, setShowApplauseAnimation] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(() => getGlobalMuteState());
  const [isMusicMuted, setIsMusicMuted] = useState(() => getGlobalMuteState());
  const [isMusicInView, setIsMusicInView] = useState(false);
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageOriginRect, setImageOriginRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [videoOriginRect, setVideoOriginRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [videoTimeOnOpen, setVideoTimeOnOpen] = useState(0);
  const [showMusicInfo, setShowMusicInfo] = useState(false);
  const [isMusicDetailsOpen, setIsMusicDetailsOpen] = useState(false);
  const lastTapRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const isMusicMutedRef = useRef(isMusicMuted);
  const {
    data: postTags = []
  } = usePostTags(post.id);
  
  // Story/Replay indicator logic
  const { data: groupedStories } = useStories();
  const userStoryGroup = groupedStories?.find(g => g.userId === post.user_id);
  const hasActiveStories = !!userStoryGroup && userStoryGroup.stories.length > 0;
  const hasUnviewedStories = userStoryGroup?.hasNewStory ?? false;
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyClickOrigin, setStoryClickOrigin] = useState<DOMRect | null>(null);
  
  const likePost = useLikePost();
  const savePost = useSavePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const reportPost = useReportPost();
  const isOwner = user?.id === post.user_id;
  
  // Music info for header alternation
  const musicTitle = post.music_title || post.music_track?.title;
  const musicArtist = post.music_artist || post.music_track?.artist;

  // Carousel effect
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Get music data for this post
  const hasMusicTrack = !!(post.music_audio_url || post.music_track);
  const musicAudioUrl = post.music_audio_url || post.music_track?.audio_url;
  const musicStartSeconds = post.music_start_seconds ?? 0;
  const musicEndSeconds = post.music_end_seconds ?? (post.music_duration_seconds || post.music_track?.duration_seconds || 30);

  // Keep a mutable reference to the latest known playable URL.
  // Deezer preview URLs can be signed and expire; we may swap them on playback failure.
  const effectiveMusicUrlRef = useRef<string | null>(musicAudioUrl ?? null);
  useEffect(() => {
    effectiveMusicUrlRef.current = musicAudioUrl ?? null;
  }, [musicAudioUrl]);

  // Alternate between position and music info every 4 seconds
  useEffect(() => {
    if (!hasMusicTrack || !musicTitle) return;
    
    const interval = setInterval(() => {
      setShowMusicInfo(prev => !prev);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [hasMusicTrack, musicTitle]);

  // Listen for global mute changes from other posts
  useEffect(() => {
    const handleGlobalMuteChange = (e: Event) => {
      const { muted } = (e as CustomEvent).detail;
      setIsMuted(muted);
      setIsMusicMuted(muted);
    };
    window.addEventListener(GLOBAL_MUTE_EVENT, handleGlobalMuteChange);
    return () => window.removeEventListener(GLOBAL_MUTE_EVENT, handleGlobalMuteChange);
  }, []);

  // Keep isMusicMutedRef in sync with state
  useEffect(() => {
    isMusicMutedRef.current = isMusicMuted;
    if (musicAudioRef.current) {
      musicAudioRef.current.muted = isMusicMuted;
    }
  }, [isMusicMuted]);

  // Stop music playback function for global coordination
  const stopMusicPlayback = useCallback(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      if (currentlyPlayingFeedMusic === musicAudioRef.current) {
        currentlyPlayingFeedMusic = null;
        currentlyPlayingFeedMusicStop = null;
      }
    }
  }, []);

  // Video autoplay on viewport intersection (also handles music for video posts)
  useEffect(() => {
    if (post.media_type !== "video" || !videoContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
              videoRef.current.muted = getGlobalMuteState();
              videoRef.current.play().catch(() => {});
              setIsVideoPlaying(true);

              // Also start music for video posts with music
              if (hasMusicTrack && musicAudioUrl) {
                if (!musicAudioRef.current) {
                  const url = effectiveMusicUrlRef.current;
                  if (url) {
                    musicAudioRef.current = new Audio(url);
                    musicAudioRef.current.loop = true;
                    musicAudioRef.current.addEventListener('timeupdate', () => {
                      if (musicAudioRef.current && musicAudioRef.current.currentTime >= musicEndSeconds) {
                        musicAudioRef.current.currentTime = musicStartSeconds;
                      }
                    });
                  }
                }
                if (musicAudioRef.current) {
                  if (currentlyPlayingFeedMusicStop && currentlyPlayingFeedMusic !== musicAudioRef.current) {
                    currentlyPlayingFeedMusicStop();
                  }
                  musicAudioRef.current.currentTime = musicStartSeconds;
                  musicAudioRef.current.muted = isMusicMutedRef.current;
                  musicAudioRef.current.play().catch(() => {});
                  currentlyPlayingFeedMusic = musicAudioRef.current;
                  currentlyPlayingFeedMusicStop = stopMusicPlayback;
                }
                setIsMusicInView(true);
              }
            } else {
              videoRef.current.pause();
              setIsVideoPlaying(false);

              // Also pause music for video posts
              if (musicAudioRef.current) {
                musicAudioRef.current.pause();
                if (currentlyPlayingFeedMusic === musicAudioRef.current) {
                  currentlyPlayingFeedMusic = null;
                  currentlyPlayingFeedMusicStop = null;
                }
              }
              setIsMusicInView(false);
            }
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(videoContainerRef.current);
    return () => {
      observer.disconnect();
      if (musicAudioRef.current && post.media_type === "video") {
        musicAudioRef.current.pause();
        if (currentlyPlayingFeedMusic === musicAudioRef.current) {
          currentlyPlayingFeedMusic = null;
          currentlyPlayingFeedMusicStop = null;
        }
      }
    };
  }, [post.media_type, hasMusicTrack, musicAudioUrl, musicStartSeconds, musicEndSeconds, stopMusicPlayback]);

  // Music autoplay on viewport intersection (for image posts with music)
  useEffect(() => {
    if (!hasMusicTrack || !musicAudioUrl || post.media_type === "video") return;
    if (!mediaContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setIsMusicInView(true);
            
            // Start playing music when visible (muted by default for autoplay policy)
            if (!musicAudioRef.current) {
              const url = effectiveMusicUrlRef.current;
              if (!url) return;

              musicAudioRef.current = new Audio(url);
              musicAudioRef.current.loop = true;
              
              // Add timeupdate listener for precise looping within start/end bounds
              musicAudioRef.current.addEventListener('timeupdate', () => {
                if (musicAudioRef.current && musicAudioRef.current.currentTime >= musicEndSeconds) {
                  musicAudioRef.current.currentTime = musicStartSeconds;
                }
              });
            }
            
            // Stop any other currently playing music
            if (currentlyPlayingFeedMusicStop && currentlyPlayingFeedMusic !== musicAudioRef.current) {
              currentlyPlayingFeedMusicStop();
            }
            
             musicAudioRef.current.currentTime = musicStartSeconds;
             musicAudioRef.current.muted = isMusicMutedRef.current;
             musicAudioRef.current.play().catch(() => {});
            
            // Set global references
            currentlyPlayingFeedMusic = musicAudioRef.current;
            currentlyPlayingFeedMusicStop = stopMusicPlayback;
          } else {
            setIsMusicInView(false);
            // Pause music when not visible
            if (musicAudioRef.current) {
              musicAudioRef.current.pause();
              if (currentlyPlayingFeedMusic === musicAudioRef.current) {
                currentlyPlayingFeedMusic = null;
                currentlyPlayingFeedMusicStop = null;
              }
            }
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(mediaContainerRef.current);
    return () => {
      observer.disconnect();
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        if (currentlyPlayingFeedMusic === musicAudioRef.current) {
          currentlyPlayingFeedMusic = null;
          currentlyPlayingFeedMusicStop = null;
        }
        musicAudioRef.current = null;
      }
    };
  }, [hasMusicTrack, musicAudioUrl, post.media_type, musicStartSeconds, musicEndSeconds, stopMusicPlayback]);

  // Handle music mute toggle with explicit play() for user gesture compliance
  const handleMusicToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const nextMuted = !isMusicMuted;
    setGlobalMuteState(nextMuted);
    
    // Force play on user interaction (required for iOS/Safari)
    if (!musicAudioRef.current) {
      const url = effectiveMusicUrlRef.current;
      if (url) {
        musicAudioRef.current = new Audio(url);
        musicAudioRef.current.loop = true;

        // Add timeupdate listener for precise looping
        musicAudioRef.current.addEventListener('timeupdate', () => {
          if (musicAudioRef.current && musicAudioRef.current.currentTime >= musicEndSeconds) {
            musicAudioRef.current.currentTime = musicStartSeconds;
          }
        });
      }
    }
    
    if (musicAudioRef.current) {
      // Stop any other currently playing music
      if (currentlyPlayingFeedMusicStop && currentlyPlayingFeedMusic !== musicAudioRef.current) {
        currentlyPlayingFeedMusicStop();
      }
      
      musicAudioRef.current.currentTime = musicStartSeconds;
      musicAudioRef.current.muted = nextMuted;
      
      // If Deezer URL is already expired, refresh before trying.
      if (!nextMuted && effectiveMusicUrlRef.current && isDeezerSignedUrlExpired(effectiveMusicUrlRef.current)) {
        fetchFreshDeezerPreviewUrl({ title: musicTitle, artist: musicArtist })
          .then((freshUrl) => {
            if (!freshUrl) return;
            effectiveMusicUrlRef.current = freshUrl;
            if (musicAudioRef.current) {
              musicAudioRef.current.pause();
              musicAudioRef.current = null;
            }

            const a = new Audio(freshUrl);
            a.loop = true;
            a.addEventListener('timeupdate', () => {
              if (a.currentTime >= musicEndSeconds) {
                a.currentTime = musicStartSeconds;
              }
            });
            musicAudioRef.current = a;
          })
          .catch(() => {
            // ignore
          });
      }

      // Always call play() on user gesture - this is the key fix.
      // If it fails (common: expired Deezer signed URL), fetch a fresh preview and retry once.
      musicAudioRef.current.play().catch(async (err) => {
        console.error("Music playback failed:", err);

        try {
          const freshUrl = await fetchFreshDeezerPreviewUrl({ title: musicTitle, artist: musicArtist });
          if (!freshUrl) return;

          effectiveMusicUrlRef.current = freshUrl;
          const freshAudio = new Audio(freshUrl);
          freshAudio.loop = true;
          freshAudio.currentTime = musicStartSeconds;
          freshAudio.muted = nextMuted;
          freshAudio.addEventListener('timeupdate', () => {
            if (freshAudio.currentTime >= musicEndSeconds) {
              freshAudio.currentTime = musicStartSeconds;
            }
          });

          if (musicAudioRef.current) {
            musicAudioRef.current.pause();
          }
          musicAudioRef.current = freshAudio;

          if (currentlyPlayingFeedMusicStop && currentlyPlayingFeedMusic !== freshAudio) {
            currentlyPlayingFeedMusicStop();
          }

          await freshAudio.play();
          currentlyPlayingFeedMusic = freshAudio;
          currentlyPlayingFeedMusicStop = stopMusicPlayback;
        } catch {
          // ignore
        }
      });
      
      // Set global references
      currentlyPlayingFeedMusic = musicAudioRef.current;
      currentlyPlayingFeedMusicStop = stopMusicPlayback;
    }
  }, [isMusicMuted, musicStartSeconds, musicEndSeconds, stopMusicPlayback, musicTitle, musicArtist]);

  // Helper to parse media URLs
  const getMediaUrls = (): string[] => {
    if (!post.media_url) return [];
    try {
      const parsed = JSON.parse(post.media_url);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON, single URL
    }
    return [post.media_url];
  };
  const mediaUrls = getMediaUrls();
  const isCarousel = post.media_type === "carousel" || mediaUrls.length > 1;
  const handleProfileClick = () => {
    navigate(`/${post.profile.username}`);
  };
  const handleLike = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
    likePost.mutate({
      postId: post.id,
      isLiked: post.liked_by_user
    });
  };
  const handleDoubleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected - toggle applause
      e.preventDefault();
      if (post.liked_by_user) {
        // Already applauded - remove applause (no animation)
        handleLike();
      } else {
        // Not applauded yet - add applause with animation
        handleLike();
        setShowApplauseAnimation(true);
        setTimeout(() => setShowApplauseAnimation(false), 1000);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };
  
  const handleMediaClick = (e: React.MouseEvent<HTMLImageElement>, imageIndex: number) => {
    const now = Date.now();
    const target = e.currentTarget;
    const timeSinceLastTap = now - lastTapRef.current;

    // Check for double tap first
    if (timeSinceLastTap < 300 && lastTapRef.current !== 0) {
      // Double tap detected - toggle applause
      e.preventDefault();
      lastTapRef.current = 0;
      
      if (!user) {
        navigate("/login");
        return;
      }
      
      if (post.liked_by_user) {
        handleLike();
      } else {
        handleLike();
        setShowApplauseAnimation(true);
        setTimeout(() => setShowApplauseAnimation(false), 1000);
      }
      return;
    }

    // First tap - save timestamp and wait to see if it's a double tap
    lastTapRef.current = now;

    setTimeout(() => {
      if (lastTapRef.current === now) {
        // Single tap confirmed - open fullscreen
        const rect = target.getBoundingClientRect();
        setImageOriginRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
        setSelectedImageIndex(imageIndex);
        setIsImageViewerOpen(true);
        lastTapRef.current = 0;
      }
    }, 300);
  };
  const handleSave = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    savePost.mutate({
      postId: post.id,
      isSaved: post.saved_by_user
    });
  };
  const handleEdit = () => {
    setEditContent(post.content);
    setIsEditDialogOpen(true);
  };
  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updatePost.mutate({
      postId: post.id,
      content: editContent
    }, {
      onSuccess: () => setIsEditDialogOpen(false)
    });
  };
  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => setIsDeleteDialogOpen(false)
    });
  };
  const handleReport = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!reportReason) return;
    reportPost.mutate({
      postId: post.id,
      reason: reportReason,
      description: reportDescription || undefined
    }, {
      onSuccess: () => {
        setIsReportDialogOpen(false);
        setReportReason("");
        setReportDescription("");
      }
    });
  };
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(".0", "") + "k";
    }
    return num.toString();
  };
  const getTimeAgo = () => {
    const now = new Date();
    const postDate = new Date(post.created_at);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    if (diffInSeconds < 60) return "agora";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} sem`;
    return postDate.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short"
    });
  };
  return <article className="border-b border-border/40 bg-background px-[4px]">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div 
            className={`relative ${hasActiveStories ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
              if (hasActiveStories) {
                e.stopPropagation();
                setStoryClickOrigin(e.currentTarget.getBoundingClientRect());
                setStoryViewerOpen(true);
              } else {
                handleProfileClick();
              }
            }}
          >
            <div 
              className={`w-11 h-11 rounded-full p-[2px] transition-all duration-200 ${
                hasActiveStories 
                  ? (hasUnviewedStories 
                      ? 'bg-gradient-to-tr from-primary to-emerald-400' 
                      : 'bg-muted-foreground/40')
                  : 'bg-transparent'
              }`}
            >
              <img 
                src={post.profile.avatar_url || "/placeholder.svg"} 
                alt={post.profile.full_name || post.profile.username} 
                className={`w-full h-full rounded-full object-cover ${hasActiveStories ? 'border-2 border-background' : ''}`} 
              />
            </div>
          </div>
          <div className="cursor-pointer" onClick={handleProfileClick}>
            <div className="flex items-center gap-1">
              <span className="font-bold text-foreground hover:underline text-base">
                {post.profile.nickname || post.profile.full_name || post.profile.username}
              </span>
              {post.profile.is_verified_premium && (!post.profile.verified_premium_expires_at || new Date(post.profile.verified_premium_expires_at) > new Date()) && (
                <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              )}
            </div>
            {/* Alternating position/account type/music info */}
            <div className="h-4 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {hasMusicTrack && musicTitle && showMusicInfo ? (
                  <motion.button
                    key="music"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-muted-foreground flex items-center gap-1 max-w-[200px] hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMusicDetailsOpen(true);
                    }}
                  >
                    <span className="material-symbols-outlined text-[12px]">music_note</span>
                    <span className="truncate">{musicTitle}</span>
                    {musicArtist && (
                      <>
                        <span className="flex-shrink-0">•</span>
                        <span className="truncate">{musicArtist}</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  post.profile.account_type === 'time' ? (
                    <motion.p
                      key="account-type"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                      className="text-xs text-muted-foreground"
                    >
                      Time de Futebol
                    </motion.p>
                  ) : post.profile.position_name ? (
                    <motion.p
                      key="position"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-muted-foreground text-sm"
                    >
                      {post.profile.position_name}
                    </motion.p>
                  ) : hasMusicTrack && musicTitle ? (
                    <motion.button
                      key="music-only"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-muted-foreground flex items-center gap-1 max-w-[200px] hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMusicDetailsOpen(true);
                      }}
                    >
                      <span className="material-symbols-outlined text-[12px]">music_note</span>
                      <span className="truncate">{musicTitle}</span>
                      {musicArtist && (
                        <>
                          <span className="flex-shrink-0">•</span>
                          <span className="truncate">{musicArtist}</span>
                        </>
                      )}
                    </motion.button>
                  ) : null
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px] text-foreground">more_horiz</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <span className="material-symbols-outlined text-[18px] mr-2">edit</span>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer text-primary focus:text-primary">
                <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}

        {!isOwner && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px] text-foreground">more_horiz</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="cursor-pointer text-destructive focus:text-destructive">
                <span className="material-symbols-outlined text-[18px] mr-2">flag</span>
                Denunciar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}
        </div>
      </div>

      {/* Media */}
      {post.media_url && <div
        ref={post.media_type !== "video" ? mediaContainerRef : undefined}
        data-no-pull="true"
        className={`relative ${isMobile ? 'w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]' : ''} ${
        post.media_type === "video" 
          ? "" 
          : `bg-muted overflow-hidden ${isMobile ? (isLandscapeMobile ? 'w-full aspect-[16/9]' : 'w-full aspect-[4/5] max-h-[75vh]') : 'aspect-[16/9] max-h-[60vh]'}`
      }`}>
          {post.media_type === "video" ? <div
        ref={videoContainerRef}
        className="relative w-full cursor-pointer"
        style={{
          aspectRatio: isMobile ? (isLandscapeMobile ? '16/9' : '4/5') : '16/9',
          maxHeight: isMobile ? (isLandscapeMobile ? 'none' : '75vh') : '60vh'
        }}
        onClick={() => {
          if (disableVideoViewer) {
            // Toggle play/pause inline
            if (videoRef.current) {
              if (isVideoPlaying) {
                videoRef.current.pause();
                setIsVideoPlaying(false);
              } else {
                videoRef.current.play().catch(() => {});
                setIsVideoPlaying(true);
              }
            }
          } else {
            // Open fullscreen video viewer
            if (videoRef.current) {
              setVideoTimeOnOpen(videoRef.current.currentTime);
              videoRef.current.pause();
              setIsVideoPlaying(false);
            }
            // Capture origin rect from video container
            if (videoContainerRef.current) {
              const rect = videoContainerRef.current.getBoundingClientRect();
              setVideoOriginRect({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
              });
            }
            setIsVideoViewerOpen(true);
          }
        }}>
              <video 
                ref={videoRef}
                src={post.media_url} 
                className="w-full h-full object-cover pointer-events-none" 
                playsInline 
                muted={isMuted}
                loop
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  if (video.videoWidth && video.videoHeight) {
                    setVideoAspectRatio(video.videoWidth / video.videoHeight);
                  }
                }}
              />
              <AnimatePresence>
                {!isVideoPlaying && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Mute/Unmute button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGlobalMuteState(!isMuted);
                }}
                className="absolute bottom-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-white text-lg">
                  {isMuted ? "volume_off" : "volume_up"}
                </span>
              </button>
            </div> : isCarousel ? <>
              <Carousel setApi={setCarouselApi} className="w-full h-full">
                <CarouselContent className="h-full">
                  {mediaUrls.map((url, index) => <CarouselItem key={index} className="h-full relative">
                      <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover cursor-pointer" onClick={(e) => handleMediaClick(e, index)} />
                      {/* Tags overlay for this image */}
                      {showTags && postTags.filter(tag => tag.photo_index === index).map(tag => <button key={tag.id} onClick={(e) => { e.stopPropagation(); navigate(`/${tag.profile.username}`); }} className="absolute bg-foreground/90 text-background px-2 py-1 rounded text-xs font-medium transform -translate-x-1/2 -translate-y-1/2 hover:bg-foreground transition-colors z-10" style={{
                left: `${tag.x_position}%`,
                top: `${tag.y_position}%`
              }}>
                            @{tag.profile.username}
                          </button>)}
                    </CarouselItem>)}
                </CarouselContent>
              </Carousel>
              {/* Carousel Counter */}
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-full">
                <span className="text-xs font-medium text-foreground">
                  {currentIndex + 1}/{mediaUrls.length}
                </span>
              </div>
              {/* Carousel Indicators */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {mediaUrls.map((_, index) => <button key={index} onClick={() => carouselApi?.scrollTo(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-primary w-4" : "bg-background/60"}`} />)}
              </div>
            </> : <>
              <img 
                src={mediaUrls[0]} 
                alt="Post" 
                className="w-full h-full object-cover cursor-pointer" 
                onClick={(e) => handleMediaClick(e, 0)}
              />
              {/* Tags overlay for single image */}
              {showTags && postTags.filter(tag => tag.photo_index === 0).map(tag => <button key={tag.id} onClick={(e) => { e.stopPropagation(); navigate(`/${tag.profile.username}`); }} className="absolute bg-foreground/90 text-background px-2 py-1 rounded text-xs font-medium transform -translate-x-1/2 -translate-y-1/2 hover:bg-foreground transition-colors z-10" style={{
          left: `${tag.x_position}%`,
          top: `${tag.y_position}%`
        }}>
                    @{tag.profile.username}
                  </button>)}
            </>}

          {/* Applause animation overlay */}
          {showApplauseAnimation && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <ClappingHandsIcon className="w-24 h-24 animate-applause-burst drop-shadow-lg" filled variant="green" />
            </div>}

          {/* Tags toggle button */}
          {postTags.length > 0 && post.media_type !== "video" && <button onClick={() => setShowTags(!showTags)} className={`absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showTags ? "bg-foreground text-background" : "bg-background/80 backdrop-blur-sm text-foreground"}`}>
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>}

          {/* Music volume button for image posts */}
          {hasMusicTrack && post.media_type !== "video" && (
            <button
              onClick={handleMusicToggle}
              className="absolute bottom-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-white text-lg">
                {isMusicMuted ? "volume_off" : "volume_up"}
              </span>
            </button>
          )}
        </div>}

      {/* Location */}
      {post.location_name && <a href={`https://www.google.com/maps/search/?api=1&query=${post.location_lat},${post.location_lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          <span className="truncate">{post.location_name}</span>
        </a>}


      {/* Caption - below media */}
      {post.content && <div className="pt-2 pb-1">
        <p className="text-sm text-foreground">
          <span className="font-semibold mr-1 cursor-pointer hover:underline" onClick={handleProfileClick}>
            {post.profile.username}
          </span>
          {post.content.length > 150 && !isContentExpanded 
            ? post.content.slice(0, 150).trim() + "..." 
            : post.content}
        </p>
        {post.content.length > 150 && (
          <button 
            onClick={() => setIsContentExpanded(!isContentExpanded)}
            className="text-sm text-muted-foreground hover:text-foreground mt-1 transition-colors"
          >
            {isContentExpanded ? "Ver menos" : "Ver mais"}
          </button>
        )}
      </div>}

      {/* Liked by section */}
      {user && post.likes_count > 0 && post.recent_likes && post.recent_likes.length > 0 && <div className="pt-3 pb-1">
          <button onClick={() => setIsLikesSheetOpen(true)} className="flex items-center gap-2 group text-left">
            <div className="flex -space-x-2">
              {post.recent_likes.slice(0, 3).map((like, index) => <img key={like.user_id} src={like.avatar_url || "/placeholder.svg"} alt={like.username} className="w-6 h-6 rounded-full border-2 border-background object-cover" style={{
            zIndex: 3 - index
          }} />)}
            </div>
            <p className="text-sm text-foreground">
              Aplaudido por{" "}
              <span className="font-semibold group-hover:underline" onClick={e => {
            e.stopPropagation();
            navigate(`/${post.recent_likes[0].username}`);
          }}>
                {post.recent_likes[0].username}
              </span>
              {post.likes_count > 1 && <>
                  {" "}e{" "}
                  <span className="font-semibold group-hover:underline">
                    {post.likes_count === 2 ? post.recent_likes[1]?.username || "outra pessoa" : `outras ${post.likes_count - 1} pessoas`}
                  </span>
                </>}
            </p>
          </button>
        </div>}

      {/* Actions */}
      <div className={`pt-2 py-[4px] ${isMobile ? '-mx-4' : ''}`}>
        <div className="grid grid-cols-4">
          <button onClick={handleLike} disabled={likePost.isPending} className={`flex items-center justify-center p-3 gap-1.5 transition-all active:scale-110 text-foreground hover:text-muted-foreground`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={post.liked_by_user ? "liked" : "unliked"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <ClappingHandsIcon className={`w-6 h-6 ${isLikeAnimating ? 'animate-applause-pop' : ''}`} filled={post.liked_by_user} variant="green" />
              </motion.div>
            </AnimatePresence>
            {(post.likes_count || 0) >= 1 && <span className="text-xs font-medium">{formatNumber(post.likes_count)}</span>}
          </button>
          <div className="flex items-center justify-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border"></div>
            <button onClick={() => setIsCommentsSheetOpen(true)} className="flex items-center justify-center p-3 gap-1.5 text-foreground hover:text-muted-foreground transition-colors">
              <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
              {(post.comments_count || 0) >= 1 && <span className="text-xs font-medium">{formatNumber(post.comments_count)}</span>}
            </button>
          </div>
          <div className="flex items-center justify-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border"></div>
            <button 
              onClick={() => setShareSheetOpen(true)}
              className="flex items-center justify-center p-3 gap-1.5 text-foreground hover:text-muted-foreground transition-colors"
            >
              <Send className="w-6 h-6" strokeWidth={1.5} />
              {(post.shares_count || 0) >= 1 && <span className="text-xs font-medium">{formatNumber(post.shares_count)}</span>}
            </button>
          </div>
          <div className="flex items-center justify-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border"></div>
            <button onClick={handleSave} disabled={savePost.isPending} className={`flex items-center justify-center p-3 transition-colors ${post.saved_by_user ? 'text-primary' : 'text-foreground hover:text-muted-foreground'}`}>
              <Bookmark className="w-6 h-6" strokeWidth={1.5} fill={post.saved_by_user ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* Post date */}
      <p className="text-[11px] text-muted-foreground pb-3">{getTimeAgo()}</p>


      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar publicação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="O que você está pensando?" className="min-h-[100px] resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updatePost.isPending || !editContent.trim()}>
              {updatePost.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ResponsiveAlertModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir publicação?"
        description="Esta ação não pode ser desfeita. A publicação será permanentemente excluída."
        confirmText={deletePost.isPending ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Denunciar publicação</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <Label>Por que você está denunciando esta publicação?</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                {REPORT_REASONS.map(reason => <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>)}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Detalhes adicionais (opcional)</Label>
              <Textarea id="description" value={reportDescription} onChange={e => setReportDescription(e.target.value)} placeholder="Forneça mais informações sobre a denúncia..." className="min-h-[80px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReport} disabled={reportPost.isPending || !reportReason} variant="destructive">
              {reportPost.isPending ? "Enviando..." : "Denunciar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Sheet */}
      <CommentsSheet post={post} open={isCommentsSheetOpen} onOpenChange={setIsCommentsSheetOpen} />

      {/* Likes Sheet */}
      <LikesSheet postId={post.id} open={isLikesSheetOpen} onOpenChange={setIsLikesSheetOpen} />


      {/* Share to Chat Sheet */}
      <ShareToChatSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        contentType="post"
        contentId={post.id}
        contentUrl={`${window.location.origin}/post/${post.id}`}
        contentPreview={mediaUrls[0]}
        contentTitle={post.content.substring(0, 50)}
      />

      {/* Fullscreen Video Viewer */}
      {post.media_type === "video" && post.media_url && (
        <FullscreenVideoViewer
          videoUrl={post.media_url}
          isOpen={isVideoViewerOpen}
          onClose={(currentTime, mutedState) => {
            setIsVideoViewerOpen(false);
            // Sync muted state from fullscreen
            if (typeof mutedState === "boolean") {
              setIsMuted(mutedState);
            }
            // Resume feed video from fullscreen position
            if (videoRef.current && typeof currentTime === "number") {
              videoRef.current.currentTime = currentTime;
              videoRef.current.muted = mutedState ?? isMuted;
              videoRef.current.play().catch(() => {});
              setIsVideoPlaying(true);
            }
          }}
          originRect={videoOriginRect}
          initialTime={videoTimeOnOpen}
          initialMuted={isMuted}
        />
      )}

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        images={mediaUrls}
        initialIndex={selectedImageIndex}
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        originRect={imageOriginRect}
      />

      {/* Story Viewer */}
      {userStoryGroup && (
        <StoryViewer
          groupedStories={[userStoryGroup]}
          initialGroupIndex={0}
          isOpen={storyViewerOpen}
          onClose={() => setStoryViewerOpen(false)}
          originRect={storyClickOrigin}
        />
      )}

      {/* Music Details Sheet */}
      {hasMusicTrack && musicTitle && (
        <MusicDetailsSheet
          isOpen={isMusicDetailsOpen}
          onOpenChange={setIsMusicDetailsOpen}
          title={musicTitle}
          artist={musicArtist || "Artista desconhecido"}
          coverUrl={post.music_cover_url || post.music_track?.cover_url}
          audioUrl={musicAudioUrl}
          durationSeconds={post.music_duration_seconds || post.music_track?.duration_seconds}
          startSeconds={post.music_start_seconds ?? 0}
          endSeconds={post.music_end_seconds}
        />
      )}

    </article>;
};