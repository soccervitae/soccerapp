-- Primeiro remover as funções existentes
DROP FUNCTION IF EXISTS public.add_user_to_team(uuid, uuid);
DROP FUNCTION IF EXISTS public.remove_user_from_team(uuid, uuid);

-- Recriar função add_user_to_team com nomes de parâmetros sem ambiguidade
CREATE FUNCTION public.add_user_to_team(p_team_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.times 
  SET selected_by_users = array_append(selected_by_users, p_user_id)
  WHERE id = p_team_id 
    AND NOT (p_user_id = ANY(selected_by_users));
END;
$function$;

-- Recriar função remove_user_from_team com nomes de parâmetros sem ambiguidade
CREATE FUNCTION public.remove_user_from_team(p_team_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.times 
  SET selected_by_users = array_remove(selected_by_users, p_user_id)
  WHERE id = p_team_id;
END;
$function$;