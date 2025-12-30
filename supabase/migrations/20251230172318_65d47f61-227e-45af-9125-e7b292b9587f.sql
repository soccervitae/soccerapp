-- Update handle_new_user function to generate username from first name + last name + 3 random numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
  base_username TEXT;
  first_name TEXT;
  last_name TEXT;
  random_suffix TEXT;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  -- Get first and last name from metadata
  first_name := LOWER(COALESCE(new.raw_user_meta_data->>'first_name', ''));
  last_name := LOWER(COALESCE(new.raw_user_meta_data->>'last_name', ''));
  
  -- Remove special characters and spaces, keep only letters
  first_name := REGEXP_REPLACE(first_name, '[^a-z]', '', 'g');
  last_name := REGEXP_REPLACE(last_name, '[^a-z]', '', 'g');
  
  -- Build base username from first name + last name
  base_username := first_name || last_name;
  
  -- If empty, use 'user' as fallback
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user';
  END IF;
  
  -- Truncate if too long (keep room for 3 digits, max 30 chars total)
  IF LENGTH(base_username) > 27 THEN
    base_username := LEFT(base_username, 27);
  END IF;
  
  -- Generate unique username with exactly 3 random numbers
  LOOP
    -- Generate 3-digit random number (000-999)
    random_suffix := LPAD(FLOOR(random() * 1000)::TEXT, 3, '0');
    generated_username := base_username || random_suffix;
    
    -- Check if unique
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) THEN
      EXIT;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      -- Fallback: add extra random digits
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