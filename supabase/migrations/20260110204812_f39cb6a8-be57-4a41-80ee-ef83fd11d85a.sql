-- Remove the icon column from achievement_types table
ALTER TABLE public.achievement_types DROP COLUMN IF EXISTS icon;