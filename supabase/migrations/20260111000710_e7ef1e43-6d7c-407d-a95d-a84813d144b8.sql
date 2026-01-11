-- Function to delete a user and all their related data
CREATE OR REPLACE FUNCTION public.delete_user_completely(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's highlights and related data
  DELETE FROM highlight_views WHERE highlight_id IN (SELECT id FROM user_highlights WHERE user_id = p_user_id);
  DELETE FROM highlight_likes WHERE highlight_id IN (SELECT id FROM user_highlights WHERE user_id = p_user_id);
  DELETE FROM highlight_replies WHERE highlight_id IN (SELECT id FROM user_highlights WHERE user_id = p_user_id);
  DELETE FROM highlight_images WHERE highlight_id IN (SELECT id FROM user_highlights WHERE user_id = p_user_id);
  DELETE FROM saved_highlights WHERE highlight_id IN (SELECT id FROM user_highlights WHERE user_id = p_user_id);
  DELETE FROM user_highlights WHERE user_id = p_user_id;
  
  -- Delete user's stories and related data
  DELETE FROM story_views WHERE story_id IN (SELECT id FROM stories WHERE user_id = p_user_id);
  DELETE FROM story_likes WHERE story_id IN (SELECT id FROM stories WHERE user_id = p_user_id);
  DELETE FROM story_replies WHERE story_id IN (SELECT id FROM stories WHERE user_id = p_user_id);
  DELETE FROM stories WHERE user_id = p_user_id;
  
  -- Delete user's posts and related data
  DELETE FROM post_tags WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id);
  DELETE FROM post_shares WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id);
  DELETE FROM saved_posts WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id);
  DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id));
  DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id);
  DELETE FROM likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id);
  DELETE FROM reports WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id);
  DELETE FROM notifications WHERE post_id IN (SELECT id FROM posts WHERE user_id = p_user_id);
  DELETE FROM posts WHERE user_id = p_user_id;
  
  -- Delete user's interactions on other content
  DELETE FROM likes WHERE user_id = p_user_id;
  DELETE FROM comment_likes WHERE user_id = p_user_id;
  DELETE FROM comments WHERE user_id = p_user_id;
  DELETE FROM story_views WHERE viewer_id = p_user_id;
  DELETE FROM story_likes WHERE user_id = p_user_id;
  DELETE FROM story_replies WHERE sender_id = p_user_id;
  DELETE FROM highlight_views WHERE viewer_id = p_user_id;
  DELETE FROM highlight_likes WHERE user_id = p_user_id;
  DELETE FROM highlight_replies WHERE sender_id = p_user_id;
  DELETE FROM saved_posts WHERE user_id = p_user_id;
  DELETE FROM saved_highlights WHERE user_id = p_user_id;
  DELETE FROM post_tags WHERE user_id = p_user_id;
  DELETE FROM post_shares WHERE user_id = p_user_id;
  
  -- Delete user's championships and achievements
  DELETE FROM user_championships WHERE user_id = p_user_id;
  DELETE FROM user_achievements WHERE user_id = p_user_id;
  
  -- Delete user's follows
  DELETE FROM follows WHERE follower_id = p_user_id OR following_id = p_user_id;
  
  -- Delete user's messages and conversations
  DELETE FROM message_reactions WHERE user_id = p_user_id;
  DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE sender_id = p_user_id);
  DELETE FROM messages WHERE sender_id = p_user_id;
  DELETE FROM conversation_participants WHERE user_id = p_user_id;
  
  -- Delete notifications related to user
  DELETE FROM notifications WHERE user_id = p_user_id OR actor_id = p_user_id;
  
  -- Delete user's profile views
  DELETE FROM profile_views WHERE profile_id = p_user_id OR visitor_id = p_user_id;
  
  -- Delete user's reports (both made by and against)
  DELETE FROM reports WHERE reporter_id = p_user_id;
  DELETE FROM profile_reports WHERE profile_id = p_user_id OR reporter_id = p_user_id;
  
  -- Delete user's devices
  DELETE FROM user_devices WHERE user_id = p_user_id;
  
  -- Delete user's roles
  DELETE FROM user_roles WHERE user_id = p_user_id;
  
  -- Delete user's team orders
  DELETE FROM user_team_order WHERE user_id = p_user_id;
  
  -- Remove user from teams' selected_by_users array
  UPDATE times SET selected_by_users = array_remove(selected_by_users, p_user_id) WHERE p_user_id = ANY(selected_by_users);
  
  -- Delete teams created by user
  DELETE FROM times WHERE user_id = p_user_id;
  
  -- Finally delete the profile
  DELETE FROM profiles WHERE id = p_user_id;
  
  -- Delete the auth user (requires service role, done via Supabase Admin API)
  -- This will be handled in the application layer
END;
$$;

-- Grant execute permission to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION public.delete_user_completely(uuid) TO authenticated;