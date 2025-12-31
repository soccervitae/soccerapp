-- Create post_shares table to track shares
CREATE TABLE public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  shared_to_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create shares" ON public.post_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Post owners can view shares" ON public.post_shares
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_shares.post_id AND posts.user_id = auth.uid())
  );

CREATE POLICY "Users can view own shares" ON public.post_shares
  FOR SELECT USING (auth.uid() = user_id);

-- Add shares_count column to posts
ALTER TABLE public.posts ADD COLUMN shares_count INTEGER DEFAULT 0;

-- Create trigger function to update shares count
CREATE OR REPLACE FUNCTION public.update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET shares_count = shares_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_post_share_change
AFTER INSERT OR DELETE ON public.post_shares
FOR EACH ROW EXECUTE FUNCTION public.update_post_shares_count();