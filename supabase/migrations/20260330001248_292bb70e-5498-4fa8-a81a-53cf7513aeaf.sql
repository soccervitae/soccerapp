ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_premium_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_premium_expires_at timestamptz;