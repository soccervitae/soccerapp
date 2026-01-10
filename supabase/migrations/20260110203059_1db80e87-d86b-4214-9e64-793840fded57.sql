-- Add scheduling columns to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for scheduled posts lookup
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON public.posts (scheduled_at, is_published) WHERE scheduled_at IS NOT NULL AND is_published = false;

-- Update existing posts to have published_at set to created_at
UPDATE public.posts SET published_at = created_at WHERE is_published = true AND published_at IS NULL;