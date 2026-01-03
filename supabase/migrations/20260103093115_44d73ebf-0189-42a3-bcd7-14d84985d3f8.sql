-- Create storage bucket for team emblems
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-emblems', 'team-emblems', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for team emblems
CREATE POLICY "Team emblems are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-emblems');

CREATE POLICY "Admins can upload team emblems"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-emblems' AND public.has_role(auth.uid(), 'admin'));