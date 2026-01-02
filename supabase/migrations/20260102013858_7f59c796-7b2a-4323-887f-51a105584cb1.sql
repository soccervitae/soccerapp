-- Adicionar times de Pernambuco (Lote 3: Letras D-G)
INSERT INTO times (nome, escudo_url, estado_id, pais_id) VALUES
-- Letra D
('Decisão', 'https://escudosfc.com.br/pe/decisao.png', 17, 1),
('Democrata', 'https://escudosfc.com.br/pe/democratape.png', 17, 1),
('Derby', 'https://escudosfc.com.br/pe/derby.png', 17, 1),
('Desportivo Olindense', 'https://escudosfc.com.br/pe/desportivoolindense.png', 17, 1),
-- Letra E
('Eldorado', 'https://escudosfc.com.br/pe/eldoradope.png', 17, 1),
('Elite', 'https://escudosfc.com.br/pe/elite.png', 17, 1),
('Escada', 'https://escudosfc.com.br/pe/escada.png', 17, 1),
('Esperança de Recife', 'https://escudosfc.com.br/pe/esperancarecife.png', 17, 1),
('Estrela', 'https://escudosfc.com.br/pe/estrelape.png', 17, 1),
('Estrela do Mar', 'https://escudosfc.com.br/pe/estreladomar.png', 17, 1),
-- Letra F
('Falcões', 'https://escudosfc.com.br/pe/falcoes.png', 17, 1),
('Ferroviário de Recife', 'https://escudosfc.com.br/pe/ferroviariope.png', 17, 1),
('Flamengão', 'https://escudosfc.com.br/pe/flamengao.png', 17, 1),
('Flamengo de Recife', 'https://escudosfc.com.br/pe/flamengorecife.png', 17, 1),
('Fluminense de Arcoverde', 'https://escudosfc.com.br/pe/fluminensearcoverde.png', 17, 1),
('Fluminense de Olinda', 'https://escudosfc.com.br/pe/fluminenseolinda.png', 17, 1),
('Força', 'https://escudosfc.com.br/pe/forca.png', 17, 1),
('Fortaleza de Olinda', 'https://escudosfc.com.br/pe/fortalezaolinda.png', 17, 1),
-- Letra G
('Gameleira', 'https://escudosfc.com.br/pe/gameleira.png', 17, 1),
('Gimnasia', 'https://escudosfc.com.br/pe/gimnasia.png', 17, 1),
('Globo', 'https://escudosfc.com.br/pe/globope.png', 17, 1),
('Gravataense', 'https://escudosfc.com.br/pe/gravataense.png', 17, 1),
('Great Western', 'https://escudosfc.com.br/pe/greatwestern.png', 17, 1),
('Grêmio de Fernando de Noronha', 'https://escudosfc.com.br/pe/gremionoronha.png', 17, 1),
('Grêmio Belenenses', 'https://escudosfc.com.br/pe/gremiobelenenses.png', 17, 1),
('Grêmio Lítero', 'https://escudosfc.com.br/pe/gremioliterope.png', 17, 1),
('Grêmio São José', 'https://escudosfc.com.br/pe/gremiosaojose.png', 17, 1),
('Guarani de Jaboatão', 'https://escudosfc.com.br/pe/guaranijabotao.png', 17, 1),
('Guarani de Tracunhaém', 'https://escudosfc.com.br/pe/guaranitracunhaem.png', 17, 1),
('Guarany de Vitória', 'https://escudosfc.com.br/pe/guaranyvitoria.png', 17, 1)
ON CONFLICT DO NOTHING;