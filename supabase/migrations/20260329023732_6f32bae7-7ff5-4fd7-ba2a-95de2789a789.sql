
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS foundation_year integer,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS team_category text;
