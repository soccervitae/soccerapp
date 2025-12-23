-- Add updated_at column to posts table
ALTER TABLE public.posts 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Set initial updated_at value to created_at for existing posts
UPDATE public.posts SET updated_at = created_at WHERE updated_at IS NULL;

-- Create trigger function to update updated_at on post edit
CREATE OR REPLACE FUNCTION public.update_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to automatically update updated_at when post is modified
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_post_updated_at();