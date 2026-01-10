-- Atualizar perfil SOCCER VITAE com avatar e capa da marca
-- As imagens precisam ser URLs públicas do storage ou assets estáticos

UPDATE public.profiles
SET 
  avatar_url = 'https://soccervitae.lovable.app/assets/soccer-vitae-logo.png',
  cover_url = 'https://soccervitae.lovable.app/assets/soccervitae-cover.jpg',
  full_name = 'SOCCER VITAE',
  bio = 'Rede social oficial para atletas e profissionais do futebol ⚽'
WHERE username = 'soccervitae' OR is_official_account = true;