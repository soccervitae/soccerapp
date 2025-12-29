-- Create highlight_likes table (similar to story_likes)
CREATE TABLE public.highlight_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID NOT NULL REFERENCES public.user_highlights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(highlight_id, user_id)
);

-- Enable RLS
ALTER TABLE public.highlight_likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Highlight likes are viewable by everyone" 
ON public.highlight_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can like highlights" 
ON public.highlight_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike highlights" 
ON public.highlight_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create highlight_replies table (similar to story_replies)
CREATE TABLE public.highlight_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID NOT NULL REFERENCES public.user_highlights(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.highlight_replies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Senders can view own replies" 
ON public.highlight_replies 
FOR SELECT 
USING (auth.uid() = sender_id);

CREATE POLICY "Highlight owners can view replies" 
ON public.highlight_replies 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_highlights 
  WHERE user_highlights.id = highlight_replies.highlight_id 
  AND user_highlights.user_id = auth.uid()
));

CREATE POLICY "Users can send replies" 
ON public.highlight_replies 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);