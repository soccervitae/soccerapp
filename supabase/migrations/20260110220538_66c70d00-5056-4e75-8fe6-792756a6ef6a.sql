-- Add banned_at field to profiles table for account banning
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add ban_reason field to store why the user was banned
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT NULL;

-- Create index for faster banned users queries
CREATE INDEX IF NOT EXISTS idx_profiles_banned_at ON public.profiles(banned_at) WHERE banned_at IS NOT NULL;