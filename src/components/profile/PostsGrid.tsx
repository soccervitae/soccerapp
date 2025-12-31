import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChampionshipsTab } from "./ChampionshipsTab";
import { AchievementsTab } from "./AchievementsTab";
import { TeamsTab } from "./TeamsTab";
import { PostMediaViewer } from "@/components/feed/PostMediaViewer";

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
  avatar_url: string | null;
  conta_verificada?: boolean;
}

interface PostsGridProps {
  posts: Post[];
  taggedPosts?: Post[];
  championships?: Championship[];
  achievements?: Achievement[];
  isLoading?: boolean;
  isChampionshipsLoading?: boolean;
  isAchievementsLoading?: boolean;
  isTaggedLoading?: boolean;
  isOwnProfile?: boolean;
  profile?: Profile;
}

type Tab = "posts" | "videos" | "fotos" | "times" | "campeonatos" | "conquistas";

const tabs: { id: Tab; label: string; icon: string }[] = [
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
  championships = [],
  achievements = [],
  isLoading = false,
  isChampionshipsLoading = false,
  isAchievementsLoading = false,
  isTaggedLoading = false,
  isOwnProfile = false,
  profile,
}: PostsGridProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, skipSnaps: false });
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

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

  const handlePostClick = (post: Post) => {
    if (!post.media_url) return;
    setSelectedPost(post);
    setMediaViewerOpen(true);
  };

  const getMediaUrls = (post: Post): string[] => {
    if (!post.media_url) return [];
    if (post.media_type === "carousel") {
      try {
        return JSON.parse(post.media_url);
      } catch {
        return [post.media_url];
      }
    }
    return [post.media_url];
  };

  const transformPostForViewer = (post: Post) => {
    if (!profile) return null;
    return {
      id: post.id,
      content: post.content,
      media_url: post.media_url,
      media_type: post.media_type,
      created_at: post.created_at || new Date().toISOString(),
      updated_at: null,
      user_id: post.user_id || profile.id,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      location_name: post.location_name || null,
      location_lat: null,
      location_lng: null,
      music_track_id: null,
      music_start_seconds: null,
      music_end_seconds: null,
      music_track: null,
      profile: {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        nickname: null,
        avatar_url: profile.avatar_url,
        position: null,
        team: null,
        conta_verificada: profile.conta_verificada || false,
      },
      liked_by_user: false,
      saved_by_user: false,
      recent_likes: [],
    };
  };

  const renderPostGrid = (filteredPosts: Post[], emptyMessage: string, emptyIcon: string) => {
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
        {filteredPosts.map((post) => (
          <div 
            key={post.id} 
            className="aspect-[4/5] bg-muted relative group overflow-hidden cursor-pointer"
            onClick={() => handlePostClick(post)}
          >
            {post.media_url ? (
              post.media_type === "video" ? (
                <>
                  <video 
                    src={post.media_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <span className="material-symbols-outlined text-background text-[32px] drop-shadow-lg">play_arrow</span>
                  </div>
                </>
              ) : post.media_type === "carousel" ? (
                (() => {
                  try {
                    const urls = JSON.parse(post.media_url);
                    return (
                      <>
                        <img 
                          src={urls[0]} 
                          alt={post.content}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    );
                  }
                })()
              ) : (
                <img 
                  src={post.media_url} 
                  alt={post.content}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2">
                <p className="text-xs text-muted-foreground line-clamp-3 text-center">{post.content}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
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
        <div className="grid grid-cols-3 gap-1 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const viewerPost = selectedPost ? transformPostForViewer(selectedPost) : null;

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
            {renderPostGrid(getFilteredPosts("posts"), "Nenhum post ainda", "photo_library")}
          </div>
          
          {/* Times */}
          <div className="flex-[0_0_100%] min-w-0">
            <TeamsTab userId={profile?.id} />
          </div>
          
          {/* Videos */}
          <div className="flex-[0_0_100%] min-w-0">
            {renderPostGrid(getFilteredPosts("videos"), "Nenhum vídeo ainda", "movie")}
          </div>
          
          {/* Fotos */}
          <div className="flex-[0_0_100%] min-w-0">
            {renderPostGrid(getFilteredPosts("fotos"), "Nenhuma foto ainda", "photo_camera")}
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

      {/* Post Media Viewer - Fullscreen */}
      {selectedPost && viewerPost && (
        <PostMediaViewer
          post={viewerPost}
          mediaUrls={getMediaUrls(selectedPost)}
          mediaType={selectedPost.media_type || "image"}
          initialIndex={0}
          isOpen={mediaViewerOpen}
          onClose={() => {
            setMediaViewerOpen(false);
            setSelectedPost(null);
          }}
        />
      )}
    </section>
  );
};