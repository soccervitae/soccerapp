-- Add is_muted column to conversation_participants
ALTER TABLE public.conversation_participants
ADD COLUMN is_muted boolean DEFAULT false;