-- Add is_pinned column to conversation_participants
ALTER TABLE public.conversation_participants
ADD COLUMN is_pinned boolean DEFAULT false;