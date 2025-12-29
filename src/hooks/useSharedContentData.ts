import { supabase } from "@/integrations/supabase/client";

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
