-- Adicionar times de Pernambuco (Lote 4: Letras H-L)
INSERT INTO times (nome, escudo_url, estado_id, pais_id) VALUES
-- Letra H
('Horizonte', 'https://escudosfc.com.br/pe/horizontepe.png', 17, 1),
-- Letra I
('Ibura', 'https://escudosfc.com.br/pe/ibura.png', 17, 1),
('Igarassu', 'https://escudosfc.com.br/pe/igarassu.png', 17, 1),
('Independente de Garanhuns', 'https://escudosfc.com.br/pe/independentegaranhuns.png', 17, 1),
('Independente de Pesqueira', 'https://escudosfc.com.br/pe/independentepesqueira.png', 17, 1),
('Intercontinental', 'https://escudosfc.com.br/pe/intercontinental.png', 17, 1),
('Ipiranga', 'https://escudosfc.com.br/pe/ipirangape.png', 17, 1),
('Ipojuca FC', 'https://escudosfc.com.br/pe/ipojucafc.png', 17, 1),
('Iporanga', 'https://escudosfc.com.br/pe/iporanga.png', 17, 1),
('Íris', 'https://escudosfc.com.br/pe/iris.png', 17, 1),
('Israelita', 'https://escudosfc.com.br/pe/israelita.png', 17, 1),
('Itacurubá', 'https://escudosfc.com.br/pe/itacuruba.png', 17, 1),
-- Letra J
('JET', 'https://escudosfc.com.br/pe/jet.png', 17, 1),
('João de Barros', 'https://escudosfc.com.br/pe/joaodebarros.png', 17, 1),
('Juventude de Recife', 'https://escudosfc.com.br/pe/juventuderecife.png', 17, 1),
('Juventus de Olinda', 'https://escudosfc.com.br/pe/juventusolinda.png', 17, 1),
-- Letra L
('Lagodourense', 'https://escudosfc.com.br/pe/lagodourense.png', 17, 1),
('Leão XIII', 'https://escudosfc.com.br/pe/leaoxiii.png', 17, 1),
('Livramento', 'https://escudosfc.com.br/pe/livramentope.png', 17, 1),
('Locomoção', 'https://escudosfc.com.br/pe/locomocao.png', 17, 1),
('Luso Brasileiro', 'https://escudosfc.com.br/pe/lusobrasileiro.png', 17, 1)
ON CONFLICT DO NOTHING;