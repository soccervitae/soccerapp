-- Add is_archived column to conversation_participants
ALTER TABLE public.conversation_participants
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add DELETE policy for conversation_participants
CREATE POLICY "Users can delete own participation"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());