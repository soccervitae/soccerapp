-- Criar perfil para o usuário atual (rogergomesdasilva@gmail.com)
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  avatar_url,
  profile_completed,
  onboarding_completed,
  conta_verificada
)
VALUES (
  '347e893d-02b1-44d8-aa6f-6e94cdd9ef40',
  'rogergomes',
  'roger gomes',
  'https://lh3.googleusercontent.com/a/ACg8ocIosbUmCkytGf8C_5j4YBOPUO_ebugiQ7LTygiRNHj10a_Syw=s96-c',
  false,
  false,
  false
)
ON CONFLICT (id) DO NOTHING;

-- Criar perfis para quaisquer outros usuários antigos que não tenham perfil
INSERT INTO public.profiles (id, username, full_name, avatar_url, profile_completed, onboarding_completed, conta_verificada)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'username',
    LOWER(REGEXP_REPLACE(
      COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)), 
      '[^a-zA-Z0-9]', '', 'g'
    )) || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')
  ),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.raw_user_meta_data->>'avatar_url',
  false,
  false,
  false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;