-- Create table for ticket replies (conversation thread)
CREATE TABLE public.support_ticket_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

-- Users can view replies for their own tickets
CREATE POLICY "Users can view replies for their tickets"
ON public.support_ticket_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id AND st.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Users can insert replies for their own tickets
CREATE POLICY "Users can reply to their tickets"
ON public.support_ticket_replies
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  is_admin_reply = false AND
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id AND st.user_id = auth.uid()
  )
);

-- Admins can insert replies
CREATE POLICY "Admins can reply to tickets"
ON public.support_ticket_replies
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Add index for faster queries
CREATE INDEX idx_support_ticket_replies_ticket_id ON public.support_ticket_replies(ticket_id);
CREATE INDEX idx_support_ticket_replies_created_at ON public.support_ticket_replies(created_at);