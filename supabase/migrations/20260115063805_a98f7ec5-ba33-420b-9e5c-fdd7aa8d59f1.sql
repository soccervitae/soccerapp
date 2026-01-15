-- Create unique constraint for team name, estado_id, and pais_id combination
-- This is needed for the upsert ON CONFLICT clause to work correctly
CREATE UNIQUE INDEX IF NOT EXISTS times_nome_estado_pais_unique 
ON public.times (nome, COALESCE(estado_id, 0), COALESCE(pais_id, 0));