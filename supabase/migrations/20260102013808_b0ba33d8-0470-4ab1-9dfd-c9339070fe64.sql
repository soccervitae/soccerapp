-- Adicionar times de Pernambuco (Lote 2: Letras B-C)
INSERT INTO times (nome, escudo_url, estado_id, pais_id) VALUES
-- Letra B
('Barcelona de Olinda', 'https://escudosfc.com.br/pe/barcelonaolinda.png', 17, 1),
('Barreiros', 'https://escudosfc.com.br/pe/barreiros.png', 17, 1),
('Belo Jardim', 'https://escudosfc.com.br/pe/belojardim.png', 17, 1),
('Brasília de Arcoverde', 'https://escudosfc.com.br/pe/brasiliaarcoverde.png', 17, 1),
('Buíque', 'https://escudosfc.com.br/pe/buique.png', 17, 1),
-- Letra C
('Cacique', 'https://escudosfc.com.br/pe/cacique.png', 17, 1),
('Caiano', 'https://escudosfc.com.br/pe/caiano.png', 17, 1),
('Camela', 'https://escudosfc.com.br/pe/camela.png', 17, 1),
('Carpina', 'https://escudosfc.com.br/pe/carpina.png', 17, 1),
('Carpinense', 'https://escudosfc.com.br/pe/carpinense.png', 17, 1),
('Caruaru EC', 'https://escudosfc.com.br/pe/caruaruec.png', 17, 1),
('Casa Caiada', 'https://escudosfc.com.br/pe/casacaiada.png', 17, 1),
('Casa Forte', 'https://escudosfc.com.br/pe/casaforte.png', 17, 1),
('Caxangá', 'https://escudosfc.com.br/pe/caxanga.png', 17, 1),
('Central Barreiros', 'https://escudosfc.com.br/pe/centralbarreiros.png', 17, 1),
('Centro Esportivo', 'https://escudosfc.com.br/pe/centroesportivo.png', 17, 1),
('Centro Sportivo Pernambucano', 'https://escudosfc.com.br/pe/centrosportivope.png', 17, 1),
('Chã Grande', 'https://escudosfc.com.br/pe/chagrande.png', 17, 1),
('Chelsea', 'https://escudosfc.com.br/pe/chelseape.png', 17, 1),
('CIT', 'https://escudosfc.com.br/pe/cit.png', 17, 1),
('Conceição das Creoulas', 'https://escudosfc.com.br/pe/conceicaocreoulas.png', 17, 1),
('Corinthians de Paulista', 'https://escudosfc.com.br/pe/corinthianspaulista.png', 17, 1),
('Cruzeiro de Arcoverde', 'https://escudosfc.com.br/pe/cruzeiroarcoverde.png', 17, 1),
('Cruzeiro de Recife', 'https://escudosfc.com.br/pe/cruzeirorecife.png', 17, 1)
ON CONFLICT DO NOTHING;