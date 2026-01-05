-- Adicionar colunas posicaomas e posicaofem na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN posicaomas bigint REFERENCES public.posicao_masculina(id),
ADD COLUMN posicaofem bigint REFERENCES public.posicao_feminina(id);