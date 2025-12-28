-- Create highlight_images table for multiple images per highlight
CREATE TABLE public.highlight_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES public.user_highlights(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_highlight_images_highlight_id ON public.highlight_images(highlight_id);
CREATE INDEX idx_highlight_images_order ON public.highlight_images(highlight_id, display_order);

-- Enable RLS
ALTER TABLE public.highlight_images ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view highlight images (same as user_highlights)
CREATE POLICY "Highlight images are viewable by everyone"
  ON public.highlight_images FOR SELECT USING (true);

-- INSERT: Only highlight owner can add images
CREATE POLICY "Users can add images to own highlights"
  ON public.highlight_images FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_highlights
      WHERE id = highlight_id AND user_id = auth.uid()
    )
  );

-- UPDATE: Only highlight owner can update images
CREATE POLICY "Users can update images in own highlights"
  ON public.highlight_images FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_highlights
      WHERE id = highlight_id AND user_id = auth.uid()
    )
  );

-- DELETE: Only highlight owner can delete images
CREATE POLICY "Users can delete images from own highlights"
  ON public.highlight_images FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_highlights
      WHERE id = highlight_id AND user_id = auth.uid()
    )
  );

-- Migrate existing data: create an image entry for each existing highlight
INSERT INTO public.highlight_images (highlight_id, image_url, display_order)
SELECT id, image_url, 0
FROM public.user_highlights
WHERE image_url IS NOT NULL;