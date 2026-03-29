-- Fix search_path on is_participant(uuid, uuid) variant
CREATE OR REPLACE FUNCTION public.is_participant(conversation_id_to_check uuid, user_id_to_check uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conversation_id_to_check AND user_id = user_id_to_check
  );
$$;