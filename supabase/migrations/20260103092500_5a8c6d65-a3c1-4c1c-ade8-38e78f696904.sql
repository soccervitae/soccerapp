-- Add missing teams from São Paulo state (Série A3, Segunda Divisão, and "Outros" section)
-- Based on escudosfc.com.br/sp.htm

INSERT INTO public.times (nome, escudo_url, pais_id, estado_id) VALUES
-- Série A3 teams missing
('Marília', 'https://escudosfc.com.br/images/marilia.png', 26, 25),

-- Segunda Divisão teams
('Guaratinguetá', 'https://escudosfc.com.br/images/guaratingueta_sp.png', 26, 25),
('Guariba', 'https://escudosfc.com.br/images/guariba_sp.png', 26, 25),

-- "Outros" section - new teams
('Alumínio', 'https://escudosfc.com.br/images/aluminio_sp.png', 26, 25),
('Aclimação SA', 'https://escudosfc.com.br/images/aclimacaosa_sp.png', 26, 25)
ON CONFLICT (nome) DO NOTHING;