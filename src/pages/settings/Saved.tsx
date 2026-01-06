import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserSavedPosts } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PostMediaViewer } from "@/components/feed/PostMediaViewer";
import { Play, Loader2 } from "lucide-react";
import { generateVideoThumbnailWithCache } from "@/hooks/useVideoThumbnail";
import type { Post } from "@/hooks/usePosts";

interface SavedPost {
  id: string;
  user_id: string;
  media_url: string | null;
  media_type: string | null;
  content: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  music_track_id?: string | null;
  music_start_seconds?: number | null;
  music_end_seconds?: number | null;
  saved_by_user?: boolean;
  liked_by_user?: boolean;
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

// Component to render video with thumbnail
const VideoThumbnail = ({ src, alt }: { src: string; alt: string }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (src) {
      setIsLoading(true);
      
      generateVideoThumbnailWithCache(src, 1).then((result) => {
        if (result.thumbnail) {
          setThumbnail(result.thumbnail);
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

export default function Saved() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: savedPosts = [], isLoading: postsLoading } = useUserSavedPosts(user?.id);
  
  const [expandedPostIndex, setExpandedPostIndex] = useState<number | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  // Filter posts with media for grid display
  const postsWithMedia = savedPosts.filter((post: SavedPost) => post.media_url);

  // Transform saved posts to Post format for the viewer
  const transformedPosts: Post[] = postsWithMedia.map((post: SavedPost) => {
    const postProfile = post._profile;
    return {
      id: post.id,
      content: post.content,
      media_url: post.media_url,
      media_type: post.media_type,
      created_at: post.created_at || new Date().toISOString(),
      updated_at: post.created_at || null,
      user_id: post.user_id || postProfile?.id || "",
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      location_name: post.location_name || null,
      location_lat: post.location_lat || null,
      location_lng: post.location_lng || null,
      music_track_id: post.music_track_id || null,
      music_start_seconds: post.music_start_seconds || null,
      music_end_seconds: post.music_end_seconds || null,
      music_track: null,
      recent_likes: [],
      profile: {
        id: postProfile?.id || "",
        username: postProfile?.username || "usuario",
        full_name: postProfile?.full_name || null,
        nickname: postProfile?.nickname || postProfile?.full_name || postProfile?.username || null,
        avatar_url: postProfile?.avatar_url || null,
        team: null,
        conta_verificada: postProfile?.conta_verificada || false,
        gender: postProfile?.gender || null,
        role: postProfile?.role || null,
        posicaomas: postProfile?.posicaomas || null,
        posicaofem: postProfile?.posicaofem || null,
        funcao: postProfile?.funcao || null,
        position_name: null,
      },
      liked_by_user: post.liked_by_user ?? false,
      saved_by_user: true,
    };
  });

  const handlePostClick = (postIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setOriginRect(new DOMRect(rect.left, rect.top, rect.width, rect.height));
    setExpandedPostIndex(postIndex);
  };

  const handleCloseViewer = () => {
    setExpandedPostIndex(null);
    setOriginRect(null);
  };

  const handleNavigatePost = (index: number) => {
    setExpandedPostIndex(index);
  };

  const getMediaUrls = (mediaUrl: string | null): string[] => {
    if (!mediaUrl) return [];
    try {
      const parsed = JSON.parse(mediaUrl);
      return Array.isArray(parsed) ? parsed : [mediaUrl];
    } catch {
      return [mediaUrl];
    }
  };

  const renderPostGrid = (posts: SavedPost[]) => {
    if (posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <span className="material-symbols-outlined text-[64px] text-muted-foreground/50 mb-4">
            bookmark
          </span>
          <p className="text-muted-foreground text-center">
            Você ainda não salvou nenhum post
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post: SavedPost, index: number) => (
          <button
            key={post.id}
            type="button"
            onClick={(e) => handlePostClick(index, e)}
            className="aspect-[4/5] relative overflow-hidden bg-muted group cursor-pointer touch-manipulation select-none"
          >
            {post.media_type === "video" ? (
              <div className="w-full h-full pointer-events-none">
                <VideoThumbnail src={post.media_url || ""} alt={post.content} />
              </div>
            ) : post.media_type === "carousel" || post.media_url?.includes("[") ? (
              (() => {
                try {
                  const urls = JSON.parse(post.media_url || "[]");
                  return (
                    <>
                      <img
                        src={urls?.[0] || ""}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <span className="material-symbols-outlined text-white drop-shadow-lg text-[20px]">
                          collections
                        </span>
                      </div>
                    </>
                  );
                } catch {
                  return (
                    <img
                      src={post.media_url || ""}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none"
                      loading="lazy"
                    />
                  );
                }
              })()
            ) : (
              <img
                src={post.media_url || ""}
                alt=""
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
              />
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
              <div className="flex items-center gap-1 text-white">
                <span className="material-symbols-outlined text-[20px] fill-icon">favorite</span>
                <span className="font-semibold">{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                <span className="font-semibold">{post.comments_count || 0}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const currentPost = expandedPostIndex !== null ? transformedPosts[expandedPostIndex] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground ml-2">Salvos</h1>
      </header>

      <div className="pt-14 pb-20">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-transparent border-b border-border rounded-none h-12">
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full font-semibold"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="highlights"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full font-semibold"
            >
              Destaques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5]" />
                ))}
              </div>
            ) : (
              renderPostGrid(postsWithMedia)
            )}
          </TabsContent>

          <TabsContent value="highlights" className="mt-0">
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <span className="material-symbols-outlined text-[64px] text-muted-foreground/50 mb-4">
                auto_awesome
              </span>
              <p className="text-muted-foreground text-center">
                Você ainda não salvou nenhum destaque
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* PostMediaViewer */}
      {currentPost && (
        <PostMediaViewer
          post={currentPost}
          mediaUrls={getMediaUrls(currentPost.media_url)}
          mediaType={currentPost.media_type}
          isOpen={expandedPostIndex !== null}
          onClose={handleCloseViewer}
          originRect={originRect}
          posts={transformedPosts}
          currentPostIndex={expandedPostIndex ?? 0}
          onNavigatePost={handleNavigatePost}
        />
      )}
    </div>
  );
}
