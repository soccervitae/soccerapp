-- Drop the old unique constraint on just 'nome' column
-- This is causing conflicts because we now use the composite unique index (nome, estado_id, pais_id)
ALTER TABLE public.times DROP CONSTRAINT IF EXISTS times_nome_key;