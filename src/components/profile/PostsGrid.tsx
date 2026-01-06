import { useCallback } from "react";
import { FeedPost } from "@/components/feed/FeedPost";
import { type Post as FeedPostType } from "@/hooks/usePosts";
import { Skeleton } from "@/components/ui/skeleton";

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

interface PostsGridProps {
  posts: Post[];
  isLoading?: boolean;
  profile?: Profile;
}

export const PostsGrid = ({ 
  posts, 
  isLoading = false,
  profile,
}: PostsGridProps) => {
  // Transform posts to FeedPost format
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

  if (isLoading) {
    return (
      <section className="divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="w-full aspect-square rounded-lg" />
          </div>
        ))}
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[200px]">
        <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">photo_library</span>
        <p className="text-muted-foreground text-sm mt-2">Nenhum post ainda</p>
      </div>
    );
  }

  if (!profile) return null;

  const feedPosts = transformPostsToFeedFormat(posts, profile);

  return (
    <section className="divide-y divide-border">
      {feedPosts.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </section>
  );
};
