-- Remove the old constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_media_type_check;

-- Add new constraint including 'carousel'
ALTER TABLE posts ADD CONSTRAINT posts_media_type_check 
  CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text, 'carousel'::text]));