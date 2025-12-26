-- Create site-assets bucket for icons and logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true);

-- Policy for public read access
CREATE POLICY "Site assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- Policy for authenticated users to update their uploads
CREATE POLICY "Authenticated users can update site assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- Policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete site assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');