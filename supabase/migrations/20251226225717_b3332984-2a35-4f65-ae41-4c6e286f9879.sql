-- Update the handle_new_user function to capture first_name, last_name, gender from metadata
-- and generate username from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
  base_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate username from email (part before @)
  base_username := LOWER(REGEXP_REPLACE(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  
  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || 'user';
  END IF;
  
  -- Check if username exists and add number if needed
  generated_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
    counter := counter + 1;
    generated_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    gender,
    avatar_url, 
    conta_verificada
  )
  VALUES (
    new.id,
    generated_username,
    TRIM(COALESCE(new.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data->>'last_name', '')),
    COALESCE(new.raw_user_meta_data->>'gender', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    false
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;