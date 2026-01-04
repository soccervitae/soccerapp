import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/hooks/usePosts";

export interface SharedPost {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  music_track_id: string | null;
  music_start_seconds: number | null;
  music_end_seconds: number | null;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    conta_verificada: boolean;
  };
}

export interface SharedStory {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  expires_at: string;
  user_id: string;
  duration: number | null;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface SharedHighlight {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  display_order: number | null;
  images: {
    id: string;
    image_url: string;
    media_type: string | null;
    display_order: number | null;
  }[];
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export async function fetchSharedPost(postId: string): Promise<SharedPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(
        id, username, full_name, avatar_url, conta_verificada
      )
    `)
    .eq("id", postId)
    .single();

  if (error || !data) {
    console.error("Error fetching shared post:", error);
    return null;
  }

  return {
    id: data.id,
    content: data.content,
    media_url: data.media_url,
    media_type: data.media_type,
    created_at: data.created_at,
    user_id: data.user_id,
    likes_count: data.likes_count || 0,
    comments_count: data.comments_count || 0,
    location_name: data.location_name,
    location_lat: data.location_lat,
    location_lng: data.location_lng,
    music_track_id: data.music_track_id,
    music_start_seconds: data.music_start_seconds,
    music_end_seconds: data.music_end_seconds,
    profile: data.profile as SharedPost["profile"],
  };
}

export async function fetchSharedStory(storyId: string): Promise<SharedStory | null> {
  const { data, error } = await supabase
    .from("stories")
    .select(`
      *,
      profile:profiles!stories_user_id_fkey(
        id, username, full_name, avatar_url
      )
    `)
    .eq("id", storyId)
    .single();

  if (error || !data) {
    console.error("Error fetching shared story:", error);
    return null;
  }

  return {
    id: data.id,
    media_url: data.media_url,
    media_type: data.media_type,
    created_at: data.created_at,
    expires_at: data.expires_at,
    user_id: data.user_id,
    duration: data.duration,
    profile: data.profile as SharedStory["profile"],
  };
}

export async function fetchSharedHighlight(highlightId: string): Promise<SharedHighlight | null> {
  const { data, error } = await supabase
    .from("user_highlights")
    .select(`
      *,
      images:highlight_images(id, image_url, media_type, display_order),
      profile:profiles!user_highlights_user_id_fkey(
        id, username, full_name, avatar_url
      )
    `)
    .eq("id", highlightId)
    .single();

  if (error || !data) {
    console.error("Error fetching shared highlight:", error);
    return null;
  }

  const images = (data.images as SharedHighlight["images"] || [])
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  // If no images in highlight_images, use the main image_url
  if (images.length === 0) {
    images.push({
      id: data.id,
      image_url: data.image_url,
      media_type: "image",
      display_order: 0,
    });
  }

  return {
    id: data.id,
    title: data.title,
    image_url: data.image_url,
    user_id: data.user_id,
    display_order: data.display_order,
    images,
    profile: data.profile as SharedHighlight["profile"],
  };
}

// Convert SharedPost to Post format for PostMediaViewer
export function sharedPostToPost(shared: SharedPost): Post {
  return {
    id: shared.id,
    user_id: shared.user_id,
    content: shared.content,
    media_url: shared.media_url,
    media_type: shared.media_type,
    likes_count: shared.likes_count,
    comments_count: shared.comments_count,
    shares_count: 0,
    created_at: shared.created_at,
    updated_at: null,
    location_name: shared.location_name,
    location_lat: shared.location_lat,
    location_lng: shared.location_lng,
    music_track_id: shared.music_track_id,
    music_start_seconds: shared.music_start_seconds,
    music_end_seconds: shared.music_end_seconds,
    music_track: null,
    profile: {
      id: shared.profile.id,
      username: shared.profile.username,
      full_name: shared.profile.full_name,
      avatar_url: shared.profile.avatar_url,
      nickname: null,
      position: null,
      position_name: null,
      team: null,
      conta_verificada: shared.profile.conta_verificada,
    },
    liked_by_user: false,
    saved_by_user: false,
    recent_likes: [],
  };
}

// Convert SharedStory to Post format for PostMediaViewer
export function storyToPost(story: SharedStory): Post {
  return {
    id: story.id,
    user_id: story.user_id,
    content: "",
    media_url: story.media_url,
    media_type: story.media_type,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    created_at: story.created_at,
    updated_at: null,
    location_name: null,
    location_lat: null,
    location_lng: null,
    music_track_id: null,
    music_start_seconds: null,
    music_end_seconds: null,
    music_track: null,
    profile: {
      id: story.profile.id,
      username: story.profile.username,
      full_name: story.profile.full_name,
      avatar_url: story.profile.avatar_url,
      nickname: null,
      position: null,
      position_name: null,
      team: null,
      conta_verificada: false,
    },
    liked_by_user: false,
    saved_by_user: false,
    recent_likes: [],
  };
}

// Convert SharedHighlight to Post format for PostMediaViewer
export function highlightToPost(highlight: SharedHighlight): Post {
  const firstImage = highlight.images[0];
  return {
    id: highlight.id,
    user_id: highlight.user_id,
    content: highlight.title,
    media_url: firstImage?.image_url || highlight.image_url,
    media_type: highlight.images.length > 1 ? "carousel" : (firstImage?.media_type || "image"),
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    created_at: new Date().toISOString(),
    updated_at: null,
    location_name: null,
    location_lat: null,
    location_lng: null,
    music_track_id: null,
    music_start_seconds: null,
    music_end_seconds: null,
    music_track: null,
    profile: {
      id: highlight.profile.id,
      username: highlight.profile.username,
      full_name: highlight.profile.full_name,
      avatar_url: highlight.profile.avatar_url,
      nickname: null,
      position: null,
      position_name: null,
      team: null,
      conta_verificada: false,
    },
    liked_by_user: false,
    saved_by_user: false,
    recent_likes: [],
  };
}
