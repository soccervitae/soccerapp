-- Create table for story replies/messages
CREATE TABLE public.story_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

-- Story owners can view all replies to their stories
CREATE POLICY "Story owners can view replies" ON public.story_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_replies.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Senders can view their own replies
CREATE POLICY "Senders can view own replies" ON public.story_replies
  FOR SELECT USING (auth.uid() = sender_id);

-- Authenticated users can send replies
CREATE POLICY "Users can send replies" ON public.story_replies
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create index for faster queries
CREATE INDEX idx_story_replies_story_id ON public.story_replies(story_id);
CREATE INDEX idx_story_replies_sender_id ON public.story_replies(sender_id);