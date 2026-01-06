-- Create saved_highlights table
CREATE TABLE public.saved_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  highlight_id UUID NOT NULL REFERENCES public.user_highlights(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, highlight_id)
);

-- Enable RLS
ALTER TABLE public.saved_highlights ENABLE ROW LEVEL SECURITY;

-- Users can save highlights
CREATE POLICY "Users can save highlights"
ON public.saved_highlights
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view own saved highlights
CREATE POLICY "Users can view own saved highlights"
ON public.saved_highlights
FOR SELECT
USING (auth.uid() = user_id);

-- Users can unsave highlights
CREATE POLICY "Users can unsave highlights"
ON public.saved_highlights
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_highlights_user_id ON public.saved_highlights(user_id);
CREATE INDEX idx_saved_highlights_highlight_id ON public.saved_highlights(highlight_id);