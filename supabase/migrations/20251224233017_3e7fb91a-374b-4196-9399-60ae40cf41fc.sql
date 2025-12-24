-- Add privacy settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_activity_status boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_profile_to text DEFAULT 'everyone' CHECK (show_profile_to IN ('everyone', 'followers', 'nobody'));