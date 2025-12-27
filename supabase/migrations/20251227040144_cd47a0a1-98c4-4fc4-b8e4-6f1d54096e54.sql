-- Add profile_completed column to track if user has completed their profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Update existing profiles that have required fields filled to be marked as completed
UPDATE public.profiles 
SET profile_completed = TRUE 
WHERE username IS NOT NULL 
  AND birth_date IS NOT NULL 
  AND position IS NOT NULL 
  AND nationality IS NOT NULL 
  AND height IS NOT NULL 
  AND weight IS NOT NULL 
  AND preferred_foot IS NOT NULL;