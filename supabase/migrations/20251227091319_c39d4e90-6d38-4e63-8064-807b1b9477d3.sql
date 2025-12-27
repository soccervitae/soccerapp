-- Create helper function to avoid RLS recursion and centralize access checks
create or replace function public.can_access_conversation(_conv_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = _conv_id
      and cp.user_id = _user_id
  )
$$;

-- Conversations policies
-- Allow participants to read conversations
create policy "Participants can view conversations"
on public.conversations
for select
to authenticated
using (public.can_access_conversation(id, auth.uid()));

-- Allow authenticated users to create a conversation shell
create policy "Authenticated users can create conversations"
on public.conversations
for insert
to authenticated
with check (true);

-- Conversation participants policies
create policy "Participants can view conversation participants"
on public.conversation_participants
for select
to authenticated
using (public.can_access_conversation(conversation_id, auth.uid()));

-- Allow inserting yourself, and allow inserting others only if you're already a participant
create policy "Users can add participants to conversations they are in"
on public.conversation_participants
for insert
to authenticated
with check (
  auth.uid() = user_id
  or public.can_access_conversation(conversation_id, auth.uid())
);

-- Messages policies
create policy "Participants can view messages"
on public.messages
for select
to authenticated
using (public.can_access_conversation(conversation_id, auth.uid()));

create policy "Participants can send messages"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and public.can_access_conversation(conversation_id, auth.uid())
);

-- Allow participants to update messages (needed for read receipts + soft delete)
create policy "Participants can update messages"
on public.messages
for update
to authenticated
using (public.can_access_conversation(conversation_id, auth.uid()))
with check (public.can_access_conversation(conversation_id, auth.uid()));

-- Optional: allow sender to soft-delete own message (kept permissive via update policy above)
