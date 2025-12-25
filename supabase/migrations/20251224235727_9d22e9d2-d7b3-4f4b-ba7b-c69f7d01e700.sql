-- Add two_factor_enabled column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;