-- Primeiro: Remover o constraint antigo
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;

-- Segundo: Atualizar dados existentes para os novos valores
UPDATE profiles SET gender = 'homem' WHERE gender = 'masculino';
UPDATE profiles SET gender = 'mulher' WHERE gender = 'feminino';
UPDATE profiles SET gender = NULL WHERE gender IN ('outro', 'prefiro_nao_informar');

-- Terceiro: Adicionar novo constraint apenas com homem e mulher
ALTER TABLE profiles ADD CONSTRAINT profiles_gender_check 
CHECK (gender IS NULL OR gender = '' OR gender = ANY (ARRAY['homem', 'mulher']));