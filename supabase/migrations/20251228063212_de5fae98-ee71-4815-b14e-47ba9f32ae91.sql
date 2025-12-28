-- Create RPC to create a conversation + participants in one server-side transaction
create or replace function public.create_conversation_with_user(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  -- Create conversation
  insert into public.conversations default values
  returning id into v_conversation_id;

  -- Add participants (current user + other user)
  insert into public.conversation_participants (conversation_id, user_id)
  values
    (v_conversation_id, auth.uid()),
    (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;