
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  generated_username TEXT;
  base_username TEXT;
  first_name TEXT;
  last_name TEXT;
  account_type_val TEXT;
  random_suffix TEXT;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
  official_account_id UUID;
BEGIN
  first_name := LOWER(COALESCE(new.raw_user_meta_data->>'first_name', ''));
  last_name := LOWER(COALESCE(new.raw_user_meta_data->>'last_name', ''));
  account_type_val := COALESCE(new.raw_user_meta_data->>'account_type', '');

  IF account_type_val IN ('time', 'escolinha') THEN
    base_username := REGEXP_REPLACE(first_name, '[^a-z0-9]', '', 'g');
  ELSE
    first_name := REGEXP_REPLACE(first_name, '[^a-z]', '', 'g');
    last_name := REGEXP_REPLACE(last_name, '[^a-z]', '', 'g');
    base_username := first_name || last_name;
  END IF;

  IF LENGTH(base_username) < 3 THEN
    base_username := 'user';
  END IF;
  
  IF LENGTH(base_username) > 27 THEN
    base_username := LEFT(base_username, 27);
  END IF;
  
  LOOP
    random_suffix := LPAD(FLOOR(random() * 1000)::TEXT, 3, '0');
    generated_username := base_username || random_suffix;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) THEN
      EXIT;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      generated_username := base_username || LPAD(FLOOR(random() * 1000)::TEXT, 3, '0') || LPAD(FLOOR(random() * 100)::TEXT, 2, '0');
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    gender,
    avatar_url, 
    conta_verificada,
    account_type
  )
  VALUES (
    new.id,
    generated_username,
    TRIM(COALESCE(new.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data->>'last_name', '')),
    COALESCE(new.raw_user_meta_data->>'gender', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    false,
    CASE WHEN account_type_val IN ('atleta', 'comissao_tecnica', 'time', 'escolinha') THEN account_type_val ELSE NULL END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  SELECT id INTO official_account_id 
  FROM public.profiles 
  WHERE is_official_account = true 
  LIMIT 1;
  
  IF official_account_id IS NOT NULL AND official_account_id != new.id THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (new.id, official_account_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN new;
END;
$function$;
