CREATE TABLE public.guest_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  sender_whatsapp text,
  sender_facebook text,
  sender_instagram text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can send guest messages" ON public.guest_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can send guest messages" ON public.guest_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Profile owners can read their guest messages" ON public.guest_messages FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Profile owners can update their guest messages" ON public.guest_messages FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Profile owners can delete their guest messages" ON public.guest_messages FOR DELETE TO authenticated USING (profile_id = auth.uid());