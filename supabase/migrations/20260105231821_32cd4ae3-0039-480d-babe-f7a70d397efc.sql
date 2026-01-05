-- Add scheduled_deletion_at column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for efficient querying of scheduled deletions
CREATE INDEX IF NOT EXISTS idx_profiles_scheduled_deletion ON public.profiles (scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;