-- Add banned_until column for temporary bans
ALTER TABLE public.profiles 
ADD COLUMN banned_until timestamp with time zone DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.banned_until IS 'Date until which the user is banned. NULL means permanent ban or not banned.';