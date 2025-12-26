import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  cachePosts,
  getCachedPosts,
  cacheProfile,
  getCachedProfile,
  getCachedProfileByUsername,
  cacheUserPosts,
  getCachedUserPosts,
  isOnline,
} from '@/lib/offlineStorage';
import type { Post } from '@/hooks/usePosts';
import type { Profile } from '@/hooks/useProfile';

// Hook to cache posts when they're fetched
export const usePostsCache = (posts: Post[] | undefined) => {
  useEffect(() => {
    if (posts && posts.length > 0 && isOnline()) {
      cachePosts(posts).catch(console.error);
    }
  }, [posts]);
};

// Hook to get cached posts when offline
export const getCachedPostsData = async (): Promise<Post[]> => {
  const cached = await getCachedPosts();
  return cached as Post[];
};

// Hook to cache profile when it's fetched
export const useProfileCache = (profile: Profile | null | undefined) => {
  useEffect(() => {
    if (profile && isOnline()) {
      cacheProfile(profile).catch(console.error);
    }
  }, [profile]);
};

// Get cached profile by ID
export const getCachedProfileData = async (userId: string): Promise<Profile | null> => {
  const cached = await getCachedProfile(userId);
  return cached as Profile | null;
};

// Get cached profile by username
export const getCachedProfileByUsernameData = async (username: string): Promise<Profile | null> => {
  const cached = await getCachedProfileByUsername(username);
  return cached as Profile | null;
};

// Hook to cache user posts when they're fetched
export const useUserPostsCache = (userId: string | undefined, posts: unknown[] | undefined) => {
  useEffect(() => {
    if (userId && posts && posts.length > 0 && isOnline()) {
      cacheUserPosts(userId, posts).catch(console.error);
    }
  }, [userId, posts]);
};

// Get cached user posts
export const getCachedUserPostsData = async (userId: string): Promise<unknown[]> => {
  return getCachedUserPosts(userId);
};

// Provider hook to hydrate react-query cache from IndexedDB when offline
export const useOfflineCacheHydration = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const hydrate = async () => {
      if (!isOnline()) {
        // Hydrate posts cache
        const cachedPosts = await getCachedPosts();
        if (cachedPosts.length > 0) {
          queryClient.setQueryData(['posts'], cachedPosts);
        }
      }
    };

    hydrate();
  }, [queryClient]);
};
