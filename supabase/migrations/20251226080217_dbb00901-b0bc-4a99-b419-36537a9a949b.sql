-- Add location fields to posts table
ALTER TABLE public.posts 
ADD COLUMN location_name TEXT,
ADD COLUMN location_lat DOUBLE PRECISION,
ADD COLUMN location_lng DOUBLE PRECISION;