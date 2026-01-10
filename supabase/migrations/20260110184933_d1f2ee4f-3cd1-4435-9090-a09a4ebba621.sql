-- Atualizar avatar do perfil SOCCER VITAE com a imagem do storage
UPDATE public.profiles
SET avatar_url = 'https://wdgpmpgdlauiawbtbxmn.supabase.co/storage/v1/object/public/site-assets/soccervitaeicon66x.png'
WHERE username = 'soccervitae' OR is_official_account = true;