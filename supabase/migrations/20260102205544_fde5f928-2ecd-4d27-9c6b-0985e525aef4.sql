-- Add columns to track verification attempts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_locked_until timestamp with time zone DEFAULT NULL;