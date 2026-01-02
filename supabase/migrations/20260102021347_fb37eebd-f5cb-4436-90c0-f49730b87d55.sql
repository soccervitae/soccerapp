-- Adicionar últimos times de Pernambuco que ainda faltam (Lote Final)
INSERT INTO times (nome, escudo_url, estado_id, pais_id) VALUES
('ABC de Recife', 'https://escudosfc.com.br/pe/abcrecife.png', 17, 1),
('Atlético São José', 'https://escudosfc.com.br/pe/atleticosaojose.png', 17, 1),
('Botafogo de Recife', 'https://escudosfc.com.br/pe/botafogorecife.png', 17, 1),
('Corinthians de Recife', 'https://escudosfc.com.br/pe/corinthiansrecife.png', 17, 1),
('Internacional de Recife', 'https://escudosfc.com.br/pe/internacionalrecife.png', 17, 1),
('Juventude de Olinda', 'https://escudosfc.com.br/pe/juventudeolinda.png', 17, 1),
('Santos de Recife', 'https://escudosfc.com.br/pe/santosrecife.png', 17, 1)
ON CONFLICT DO NOTHING;