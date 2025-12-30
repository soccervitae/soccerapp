-- Add notification preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_likes BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_follows BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_story_replies BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_highlight_replies BOOLEAN DEFAULT true;