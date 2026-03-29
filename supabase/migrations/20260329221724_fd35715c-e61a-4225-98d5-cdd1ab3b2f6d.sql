create or replace function public.get_user_email(_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'unauthorized';
  end if;
  return (select email from auth.users where id = _user_id);
end;
$$;