-- Remover o constraint antigo
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;

-- Atualizar dados existentes para lowercase
UPDATE profiles SET gender = LOWER(gender) WHERE gender IS NOT NULL AND gender != '';

-- Adicionar novo constraint com valores corretos (lowercase, como o formulário envia)
ALTER TABLE profiles ADD CONSTRAINT profiles_gender_check 
CHECK (gender IS NULL OR gender = '' OR gender = ANY (ARRAY['masculino', 'feminino', 'outro', 'prefiro_nao_informar']));