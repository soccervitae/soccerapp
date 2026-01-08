-- Create unique constraint for team name per state and country
-- This allows the same team name in different states/countries but prevents duplicates within the same location
CREATE UNIQUE INDEX times_nome_estado_pais_unique 
ON public.times (nome, COALESCE(estado_id, -1), COALESCE(pais_id, -1));