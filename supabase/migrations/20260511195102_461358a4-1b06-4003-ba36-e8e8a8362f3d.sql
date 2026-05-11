
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS read_by uuid[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_temporary boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delete_after_read boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.messages ALTER COLUMN receiver_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON public.messages(deleted_at);
