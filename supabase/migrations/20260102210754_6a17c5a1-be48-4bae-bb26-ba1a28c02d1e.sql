-- Create table for session transfer tokens
CREATE TABLE public.session_transfer_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Index for fast token lookup
CREATE INDEX idx_session_transfer_token ON public.session_transfer_tokens(token);

-- Index for cleanup of expired tokens
CREATE INDEX idx_session_transfer_expires ON public.session_transfer_tokens(expires_at);

-- Enable RLS - no direct access, only via edge functions with service role
ALTER TABLE public.session_transfer_tokens ENABLE ROW LEVEL SECURITY;

-- No RLS policies = table is only accessible via service_role key (edge functions)