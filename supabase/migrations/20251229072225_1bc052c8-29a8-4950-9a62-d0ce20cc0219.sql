-- Add column to track when owner last viewed the viewers list
ALTER TABLE public.user_highlights 
ADD COLUMN views_seen_at timestamp with time zone DEFAULT NULL;