-- Create highlight_views table
CREATE TABLE public.highlight_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  highlight_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT highlight_views_pkey PRIMARY KEY (id),
  CONSTRAINT highlight_views_highlight_id_fkey FOREIGN KEY (highlight_id) 
    REFERENCES public.user_highlights(id) ON DELETE CASCADE,
  CONSTRAINT highlight_views_viewer_id_fkey FOREIGN KEY (viewer_id) 
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT highlight_views_unique UNIQUE (highlight_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.highlight_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owners can see who viewed their highlights
CREATE POLICY "Highlight owners can see who viewed their highlights"
ON public.highlight_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_highlights
    WHERE user_highlights.id = highlight_views.highlight_id
    AND user_highlights.user_id = auth.uid()
  )
);

-- RLS Policy: Users can record highlight views
CREATE POLICY "Users can record highlight views"
ON public.highlight_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Create indexes for performance
CREATE INDEX idx_highlight_views_highlight_id ON public.highlight_views(highlight_id);
CREATE INDEX idx_highlight_views_viewer_id ON public.highlight_views(viewer_id);