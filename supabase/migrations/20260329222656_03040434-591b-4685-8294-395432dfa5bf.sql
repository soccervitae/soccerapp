-- Fix search_path on bigint variant of is_participant
DROP FUNCTION IF EXISTS public.is_participant(bigint, uuid);

CREATE FUNCTION public.is_participant(conversation_id_to_check bigint, user_id_to_check uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conversation_id_to_check::text::uuid AND user_id = user_id_to_check
  );
$$;