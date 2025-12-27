-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing profiles that have completed profiles to also mark onboarding as completed
-- (for users who already went through the old flow)
UPDATE public.profiles SET onboarding_completed = TRUE WHERE profile_completed = TRUE;