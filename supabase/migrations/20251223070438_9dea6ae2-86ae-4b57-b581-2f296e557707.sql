-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, post_id)
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update reports
CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));