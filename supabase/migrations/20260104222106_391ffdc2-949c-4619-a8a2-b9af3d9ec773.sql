-- Alterar a coluna position de text para bigint para armazenar o ID da posição
-- Primeiro, limpar os dados existentes (que são textos) e depois alterar o tipo
ALTER TABLE public.profiles 
ALTER COLUMN position TYPE bigint USING NULL;