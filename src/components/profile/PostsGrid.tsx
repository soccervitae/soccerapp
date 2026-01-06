import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Play, Loader2 } from "lucide-react";
import { ChampionshipsTab } from "./ChampionshipsTab";
import { AchievementsTab } from "./AchievementsTab";
import { TeamsTab } from "./TeamsTab";
import { ProfileFeedSheet } from "./ProfileFeedSheet";
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
}

type Tab = "posts" | "videos" | "fotos" | "times" | "campeonatos" | "conquistas" | "salvos";

const baseTabs: { id: Tab; label: string; icon: string }[] = [
  { id: "posts", label: "Posts", icon: "grid_view" },
  { id: "times", label: "Times", icon: "shield" },
  { id: "videos", label: "Vídeos", icon: "movie" },
  { id: "fotos", label: "Fotos", icon: "photo_camera" },
  { id: "campeonatos", label: "Campeonatos", icon: "emoji_events" },
  { id: "conquistas", label: "Conquistas", icon: "military_tech" },
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
}: PostsGridProps) => {
  // Build tabs dynamically based on isOwnProfile
  const tabs = isOwnProfile 
    ? [...baseTabs, { id: "salvos" as Tab, label: "Salvos", icon: "bookmark" }]
    : baseTabs;

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
      <div className="grid grid-cols-3 gap-1 mb-8">
        {filteredPosts.map((post, index) => (
          <button
            key={post.id}
            type="button"
            data-embla-no-drag="true"
            className="aspect-[4/5] bg-muted relative group overflow-hidden cursor-pointer touch-manipulation select-none"
            onClick={(e) => handlePostClick(filteredPosts, index, postProfile, e)}
            aria-label="Abrir post"
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
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors pointer-events-none" />
          </button>
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
      <div className="grid grid-cols-3 gap-1 mb-8">
        {filteredPosts.map((post, index) => {
          const postProfile: Profile = post._profile ? {
            id: post._profile.id,
            username: post._profile.username,
            full_name: post._profile.full_name,
            nickname: post._profile.nickname,
            avatar_url: post._profile.avatar_url,
            conta_verificada: post._profile.conta_verificada,
            gender: post._profile.gender,
            role: post._profile.role,
            posicaomas: post._profile.posicaomas,
            posicaofem: post._profile.posicaofem,
            funcao: post._profile.funcao,
          } : profile!;
          
          return (
            <button
              key={post.id}
              type="button"
              data-embla-no-drag="true"
              className="aspect-[4/5] bg-muted relative group overflow-hidden cursor-pointer touch-manipulation select-none"
              onClick={(e) => handlePostClick(filteredPosts as Post[], index, postProfile, e)}
              aria-label="Abrir post salvo"
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
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors pointer-events-none" />
            </button>
          );
        })}
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
        <div className="grid grid-cols-3 gap-1 mb-8">
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
      <div className="flex border-b border-border mb-4 sticky top-[100px] bg-background z-20 pt-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab, index) => (
          <button 
            key={tab.id}
            onClick={() => handleTabClick(tab.id, index)}
            className={`flex-shrink-0 min-w-[80px] px-3 pb-3 text-xs font-bold transition-colors relative whitespace-nowrap ${
              activeTab === tab.id 
                ? "text-foreground border-b-2 border-foreground" 
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
          {/* Posts */}
          <div className="flex-[0_0_100%] min-w-0">
            {profile && renderPostGrid(getFilteredPosts("posts"), "Nenhum post ainda", "photo_library", profile)}
          </div>
          
          {/* Times */}
          <div className="flex-[0_0_100%] min-w-0">
            <TeamsTab userId={profile?.id} />
          </div>
          
          {/* Videos */}
          <div className="flex-[0_0_100%] min-w-0">
            {profile && renderPostGrid(getFilteredPosts("videos"), "Nenhum vídeo ainda", "movie", profile)}
          </div>
          
          {/* Fotos */}
          <div className="flex-[0_0_100%] min-w-0">
            {profile && renderPostGrid(getFilteredPosts("fotos"), "Nenhuma foto ainda", "photo_camera", profile)}
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
          
          {/* Salvos - only for own profile */}
          {isOwnProfile && (
            <div className="flex-[0_0_100%] min-w-0">
              {isSavedPostsLoading ? (
                <div className="grid grid-cols-3 gap-1 mb-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                renderSavedPostGrid(savedPosts, "Nenhum post salvo", "bookmark")
              )}
            </div>
          )}
          
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
    </section>
  );
};