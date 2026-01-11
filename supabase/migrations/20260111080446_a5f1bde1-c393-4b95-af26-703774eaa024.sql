-- Add moderation columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);

-- Update existing posts to have approved status
UPDATE public.posts SET moderation_status = 'approved' WHERE moderation_status IS NULL;

-- Create index for faster queries on moderation status
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON public.posts(moderation_status);

-- RLS policy for admins to view all posts regardless of moderation status
CREATE POLICY "Admins can view all posts for moderation"
ON public.posts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy for admins to update moderation status
CREATE POLICY "Admins can update post moderation status"
ON public.posts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));