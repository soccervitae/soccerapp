-- Create table to store user's team display order
CREATE TABLE public.user_team_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- Enable RLS
ALTER TABLE public.user_team_order ENABLE ROW LEVEL SECURITY;

-- Users can view their own team order
CREATE POLICY "Users can view their own team order"
ON public.user_team_order
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own team order
CREATE POLICY "Users can insert their own team order"
ON public.user_team_order
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own team order
CREATE POLICY "Users can update their own team order"
ON public.user_team_order
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own team order
CREATE POLICY "Users can delete their own team order"
ON public.user_team_order
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_team_order_user_id ON public.user_team_order(user_id);
CREATE INDEX idx_user_team_order_team_id ON public.user_team_order(team_id);