-- Add parent_id column to comments table for nested replies
ALTER TABLE public.comments 
ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create index for efficient querying of replies
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);

-- Create index for ordering replies by date
CREATE INDEX idx_comments_parent_created ON public.comments(parent_id, created_at);