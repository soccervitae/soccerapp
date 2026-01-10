-- Add is_official_account column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_official_account boolean DEFAULT false;

-- Update SOCCER VITAE profile to be official
UPDATE public.profiles 
SET 
  username = 'soccervitae',
  role = 'oficial',
  is_official_account = true,
  conta_verificada = true,
  full_name = 'SOCCER VITAE',
  bio = 'Conta oficial do Soccer Vitae. Notícias, novidades e atualizações do mundo do futebol.',
  profile_completed = true,
  onboarding_completed = true,
  -- Clear athlete-specific data
  birth_date = NULL,
  height = NULL,
  weight = NULL,
  preferred_foot = NULL,
  posicaomas = NULL,
  posicaofem = NULL,
  funcao = NULL
WHERE id = '9d01169e-44be-4651-9eab-221a7b7780ac';