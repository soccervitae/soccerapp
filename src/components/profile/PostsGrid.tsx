import { useState, useCallback, useEffect, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Play, Loader2 } from "lucide-react";
import { ChampionshipsTab } from "./ChampionshipsTab";
import { AchievementsTab } from "./AchievementsTab";
import { TeamsTab } from "./TeamsTab";
import { ProfileFeedSheet } from "./ProfileFeedSheet";
import { FullscreenImageViewer } from "@/components/feed/FullscreenImageViewer";
import { FeedPost } from "@/components/feed/FeedPost";
import { type Post as FeedPostType } from "@/hooks/usePosts";
import { RefreshableContainer } from "@/components/common/RefreshableContainer";
import { generateVideoThumbnailWithCache } from "@/hooks/useVideoThumbnail";
import { formatDuration } from "@/hooks/useVideoDuration";
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

interface Championship {
  id: string;
  year: number;
  team_name: string | null;
  position_achieved: string | null;
  games_played: number | null;
  goals_scored: number | null;
  custom_championship_name: string | null;
  championship: {
    name: string;
    logo_url: string | null;
  } | null;
}

interface Achievement {
  id: string;
  year: number;
  team_name: string | null;
  championship_name: string | null;
  custom_achievement_name: string | null;
  description: string | null;
  achievement_type: {
    name: string;
    icon: string;
    color: string | null;
    category: string | null;
  } | null;
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

interface SavedPost extends Post {
  _profile?: {
    id: string;
    username: string;
    full_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    conta_verificada: boolean;
    gender: string | null;
    role: string | null;
    posicaomas: number | null;
    posicaofem: number | null;
    funcao: number | null;
  };
}

interface PostsGridProps {
  posts: Post[];
  taggedPosts?: Post[];
  savedPosts?: SavedPost[];
  championships?: Championship[];
  achievements?: Achievement[];
  isLoading?: boolean;
  isChampionshipsLoading?: boolean;
  isAchievementsLoading?: boolean;
  isTaggedLoading?: boolean;
  isSavedPostsLoading?: boolean;
  isOwnProfile?: boolean;
  profile?: Profile;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

type Tab = "posts" | "videos" | "fotos" | "times" | "campeonatos" | "conquistas";

const baseTabs: { id: Tab; label: string; icon: string }[] = [
  { id: "posts", label: "Posts", icon: "grid_view" },
  { id: "times", label: "Times", icon: "shield" },
  { id: "videos", label: "Vídeos", icon: "movie" },
  { id: "fotos", label: "Fotos", icon: "photo_camera" },
  { id: "campeonatos", label: "Campeonatos", icon: "sports_soccer" },
  { id: "conquistas", label: "Conquistas", icon: "trophy" },
];

export const PostsGrid = ({ 
  posts, 
  taggedPosts = [],
  savedPosts = [],
  championships = [],
  achievements = [],
  isLoading = false,
  isChampionshipsLoading = false,
  isAchievementsLoading = false,
  isTaggedLoading = false,
  isSavedPostsLoading = false,
  isOwnProfile = false,
  profile,
  onRefresh,
  isRefreshing = false,
}: PostsGridProps) => {
  const tabs = baseTabs;

  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    skipSnaps: false,
    watchDrag: (_emblaApi, event) => {
      const target = event.target as HTMLElement | null;
      // Don't allow drag when touching post thumbnails
      if (target?.closest('[data-embla-no-drag="true"]')) return false;
      return true;
    }
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [sheetPosts, setSheetPosts] = useState<Post[]>([]);
  const [sheetProfile, setSheetProfile] = useState<Profile | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  
  // State for fullscreen image viewer (Fotos tab)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerOriginRect, setImageViewerOriginRect] = useState<DOMRect | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setActiveTab(tabs[index].id);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
  }, [emblaApi]);

  const handleTabClick = (tab: Tab, index: number) => {
    setActiveTab(tab);
    scrollTo(index);
  };

  const getFilteredPosts = (tab: Tab) => {
    if (tab === "videos") return posts.filter(post => post.media_type === "video");
    if (tab === "fotos") return posts.filter(post => post.media_type === "image");
    if (tab === "posts") return posts;
    return [];
  };

  const handlePostClick = (postsArray: Post[], index: number, postProfile: Profile, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setOriginRect(rect);
    setSheetPosts(postsArray);
    setSelectedPostIndex(index);
    setSheetProfile(postProfile);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setOriginRect(null);
  };

  // Handle photo click for Fotos tab - opens fullscreen image viewer
  const handlePhotoClick = (postsArray: Post[], index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setImageViewerOriginRect(rect);
    
    // Extract all image URLs from the posts
    const images = postsArray.map(post => post.media_url || "").filter(url => url);
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setIsImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    setIsImageViewerOpen(false);
    setImageViewerOriginRect(null);
  };

  // Component to render video with thumbnail
  const VideoThumbnail = ({ src, alt }: { src: string; alt: string }) => {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [duration, setDuration] = useState<string>("");

    useEffect(() => {
      if (src) {
        setIsLoading(true);
        
        // Use cached function that fetches both at once
        generateVideoThumbnailWithCache(src, 1).then((result) => {
          if (result.thumbnail) {
            setThumbnail(result.thumbnail);
          }
          if (result.duration) {
            setDuration(formatDuration(result.duration));
          }
          setIsLoading(false);
        });
      }
    }, [src]);

    return (
      <>
        {isLoading ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : thumbnail ? (
          <img 
            src={thumbnail}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground/60 fill-muted-foreground/60" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
          <span className="material-symbols-outlined text-background text-[32px] drop-shadow-lg">play_arrow</span>
        </div>
      </>
    );
  };

  // Transform posts to FeedPost format for the feed view
  const transformPostsToFeedFormat = useCallback((filteredPosts: Post[], postProfile: Profile): FeedPostType[] => {
    return filteredPosts.map(post => ({
      id: post.id,
      user_id: post.user_id || postProfile.id,
      content: post.content,
      media_url: post.media_url,
      media_type: post.media_type,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      created_at: post.created_at || new Date().toISOString(),
      updated_at: null,
      location_name: post.location_name || null,
      location_lat: post.location_lat || null,
      location_lng: post.location_lng || null,
      music_track_id: post.music_track_id || null,
      music_start_seconds: post.music_start_seconds || null,
      music_end_seconds: post.music_end_seconds || null,
      music_track: null,
      profile: {
        id: postProfile.id,
        username: postProfile.username,
        full_name: postProfile.full_name,
        nickname: postProfile.nickname || null,
        avatar_url: postProfile.avatar_url,
        team: null,
        conta_verificada: postProfile.conta_verificada || false,
        gender: postProfile.gender || null,
        role: postProfile.role || null,
        posicaomas: postProfile.posicaomas || null,
        posicaofem: postProfile.posicaofem || null,
        funcao: postProfile.funcao || null,
        position_name: postProfile.position_name || null,
      },
      liked_by_user: post.liked_by_user || false,
      saved_by_user: post.saved_by_user || false,
      recent_likes: [],
    }));
  }, []);

  // Render posts as Facebook-style feed
  const renderPostsFeed = (filteredPosts: Post[], emptyMessage: string, emptyIcon: string, postProfile: Profile) => {
    if (filteredPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 min-h-[200px]">
          <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">{emptyIcon}</span>
          <p className="text-muted-foreground text-sm mt-2">{emptyMessage}</p>
        </div>
      );
    }

    const feedPosts = transformPostsToFeedFormat(filteredPosts, postProfile);

    return (
      <div className="divide-y divide-border">
        {feedPosts.map((post) => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>
    );
  };

  const renderPostGrid = (filteredPosts: Post[], emptyMessage: string, emptyIcon: string, postProfile: Profile) => {
    if (filteredPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 min-h-[200px]">
          <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">{emptyIcon}</span>
          <p className="text-muted-foreground text-sm mt-2">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-0.5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="aspect-[4/5] bg-muted relative overflow-hidden"
          >
            {post.media_url ? (
              post.media_type === "video" ? (
                <div className="w-full h-full pointer-events-none">
                  <VideoThumbnail src={post.media_url} alt={post.content} />
                </div>
              ) : post.media_type === "carousel" ? (
                (() => {
                  try {
                    const urls = JSON.parse(post.media_url);
                    return (
                      <>
                        <img
                          src={urls[0]}
                          alt={post.content}
                          className="w-full h-full object-cover pointer-events-none"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 pointer-events-none">
                          <span className="material-symbols-outlined text-background text-[18px] drop-shadow-lg">collections</span>
                        </div>
                      </>
                    );
                  } catch {
                    return (
                      <img
                        src={post.media_url}
                        alt={post.content}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                    );
                  }
                })()
              ) : (
                <img
                  src={post.media_url}
                  alt={post.content}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
                <p className="text-xs text-muted-foreground line-clamp-3 text-center">{post.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render photos grid for Fotos tab
  const renderPhotosGrid = (filteredPosts: Post[], emptyMessage: string, emptyIcon: string) => {
    if (filteredPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 min-h-[200px]">
          <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">{emptyIcon}</span>
          <p className="text-muted-foreground text-sm mt-2">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-0.5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="aspect-[4/5] bg-muted relative overflow-hidden"
          >
            {post.media_url && (
              <img
                src={post.media_url}
                alt={post.content}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render saved posts grid with their own profile data
  const renderSavedPostGrid = (filteredPosts: SavedPost[], emptyMessage: string, emptyIcon: string) => {
    if (filteredPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 min-h-[200px]">
          <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">{emptyIcon}</span>
          <p className="text-muted-foreground text-sm mt-2">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-0.5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="aspect-[4/5] bg-muted relative overflow-hidden"
          >
            {post.media_url ? (
              post.media_type === "video" ? (
                <div className="w-full h-full">
                  <VideoThumbnail src={post.media_url} alt={post.content} />
                </div>
              ) : post.media_type === "carousel" ? (
                (() => {
                  try {
                    const urls = JSON.parse(post.media_url);
                    return (
                      <>
                        <img
                          src={urls[0]}
                          alt={post.content}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="material-symbols-outlined text-background text-[18px] drop-shadow-lg">collections</span>
                        </div>
                      </>
                    );
                  } catch {
                    return (
                      <img
                        src={post.media_url}
                        alt={post.content}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    );
                  }
                })()
              ) : (
                <img
                  src={post.media_url}
                  alt={post.content}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2">
                <p className="text-xs text-muted-foreground line-clamp-3 text-center">{post.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <section>
        <div className="flex border-b border-border mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <div key={tab.id} className="flex-shrink-0 min-w-[80px] pb-3 flex items-center justify-center">
              <div className="w-16 h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const currentFilteredPosts = getFilteredPosts(activeTab);

  return (
    <section>
      {/* Tabs - scrollable */}
      <div className="flex border-b border-border sticky top-[100px] bg-background z-20 overflow-x-auto scrollbar-hide h-12">
        {tabs.map((tab, index) => (
          <button 
            key={tab.id}
            onClick={() => handleTabClick(tab.id, index)}
            className={`flex-shrink-0 min-w-[80px] px-3 h-full text-xs font-semibold transition-colors relative whitespace-nowrap flex items-center justify-center ${
              activeTab === tab.id 
                ? "text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[18px] align-bottom mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {/* Posts - Facebook-style feed with pull-to-refresh */}
          <div className="flex-[0_0_100%] min-w-0 h-full overflow-y-auto">
            {onRefresh ? (
              <RefreshableContainer
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                className="min-h-full"
              >
                {profile && renderPostsFeed(getFilteredPosts("posts"), "Nenhum post ainda", "photo_library", profile)}
              </RefreshableContainer>
            ) : (
              profile && renderPostsFeed(getFilteredPosts("posts"), "Nenhum post ainda", "photo_library", profile)
            )}
          </div>
          
          {/* Times */}
          <div className="flex-[0_0_100%] min-w-0">
            <TeamsTab userId={profile?.id} />
          </div>
          
          {/* Videos with pull-to-refresh */}
          <div className="flex-[0_0_100%] min-w-0 h-full overflow-y-auto">
            {onRefresh ? (
              <RefreshableContainer
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                className="min-h-full"
              >
                {profile && renderPostGrid(getFilteredPosts("videos"), "Nenhum vídeo ainda", "movie", profile)}
              </RefreshableContainer>
            ) : (
              profile && renderPostGrid(getFilteredPosts("videos"), "Nenhum vídeo ainda", "movie", profile)
            )}
          </div>
          
          {/* Fotos with pull-to-refresh */}
          <div className="flex-[0_0_100%] min-w-0 h-full overflow-y-auto">
            {onRefresh ? (
              <RefreshableContainer
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                className="min-h-full"
              >
                {renderPhotosGrid(getFilteredPosts("fotos"), "Nenhuma foto ainda", "photo_camera")}
              </RefreshableContainer>
            ) : (
              renderPhotosGrid(getFilteredPosts("fotos"), "Nenhuma foto ainda", "photo_camera")
            )}
          </div>
          
          {/* Campeonatos */}
          <div className="flex-[0_0_100%] min-w-0">
            <ChampionshipsTab 
              championships={championships} 
              isLoading={isChampionshipsLoading}
              isOwnProfile={isOwnProfile}
            />
          </div>
          
          {/* Conquistas */}
          <div className="flex-[0_0_100%] min-w-0">
            <AchievementsTab 
              achievements={achievements} 
              isLoading={isAchievementsLoading}
              isOwnProfile={isOwnProfile}
            />
          </div>
          
          
        </div>
      </div>

      {/* Profile Feed Sheet */}
      {sheetProfile && (
        <ProfileFeedSheet
          posts={sheetPosts}
          initialPostIndex={selectedPostIndex}
          isOpen={isSheetOpen}
          onClose={handleCloseSheet}
          profile={sheetProfile}
          originRect={originRect}
        />
      )}

      {/* Fullscreen Image Viewer for Fotos tab */}
      <FullscreenImageViewer
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        isOpen={isImageViewerOpen}
        onClose={handleCloseImageViewer}
        originRect={imageViewerOriginRect ? {
          x: imageViewerOriginRect.x,
          y: imageViewerOriginRect.y,
          width: imageViewerOriginRect.width,
          height: imageViewerOriginRect.height,
        } : null}
      />
    </section>
  );
};