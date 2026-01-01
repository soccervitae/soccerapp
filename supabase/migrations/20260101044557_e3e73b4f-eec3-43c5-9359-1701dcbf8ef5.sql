-- Add column to track when user last viewed their profile visitors
ALTER TABLE public.profiles 
ADD COLUMN visitors_seen_at timestamp with time zone DEFAULT NULL;