-- Add media_type column to highlight_images table
ALTER TABLE public.highlight_images 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- Update existing records to have 'image' as media_type
UPDATE public.highlight_images SET media_type = 'image' WHERE media_type IS NULL;