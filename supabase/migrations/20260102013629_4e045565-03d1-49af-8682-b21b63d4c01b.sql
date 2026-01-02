-- Adicionar times de Pernambuco que estão faltando (Lote 1: Times Principais A1/A2 e Letra A)
INSERT INTO times (nome, escudo_url, estado_id, pais_id) VALUES
-- Times Principais que faltam
('Jaguar', 'https://escudosfc.com.br/pe/jaguarpetrolina.png', 17, 1),
('Maguary', 'https://escudosfc.com.br/pe/maguary.png', 17, 1),
('Centro Limoeirense', 'https://escudosfc.com.br/pe/centrolimoeirense.png', 17, 1),
('Ipojuca', 'https://escudosfc.com.br/pe/ipojuca.png', 17, 1),
('Petrolina', 'https://escudosfc.com.br/pe/petrolina.png', 17, 1),
('Porto', 'https://escudosfc.com.br/pe/porto.png', 17, 1),
('Vera Cruz', 'https://escudosfc.com.br/pe/veracruz.png', 17, 1),
('Ypiranga', 'https://escudosfc.com.br/pe/ypirangape.png', 17, 1),
-- Letra A
('AFASA', 'https://escudosfc.com.br/pe/afasa.png', 17, 1),
('Afogadense', 'https://escudosfc.com.br/pe/afogadense.png', 17, 1),
('Águia Negra', 'https://escudosfc.com.br/pe/aguianegrape.png', 17, 1),
('Alegriense', 'https://escudosfc.com.br/pe/alegriense.png', 17, 1),
('Altinho', 'https://escudosfc.com.br/pe/altinho.png', 17, 1),
('Alumínio', 'https://escudosfc.com.br/pe/aluminio.png', 17, 1),
('América de Sertânia', 'https://escudosfc.com.br/pe/americasertania.png', 17, 1),
('Arapirina', 'https://escudosfc.com.br/pe/arapirina.png', 17, 1),
('Arruda', 'https://escudosfc.com.br/pe/arruda.png', 17, 1),
('Arsenal Noronhense', 'https://escudosfc.com.br/pe/arsenalnoronhense.png', 17, 1),
('ASA', 'https://escudosfc.com.br/pe/asape.png', 17, 1),
('Asa Branca', 'https://escudosfc.com.br/pe/asabranca.png', 17, 1),
('Asas', 'https://escudosfc.com.br/pe/asas.png', 17, 1),
('Ateniense', 'https://escudosfc.com.br/pe/ateniense.png', 17, 1),
('Atlântico', 'https://escudosfc.com.br/pe/atlantico.png', 17, 1),
('Atlético Camaragibe', 'https://escudosfc.com.br/pe/atleticocamaragibe.png', 17, 1),
('Atlético Goiana', 'https://escudosfc.com.br/pe/atleticogoiana.png', 17, 1),
('Atlético Vicência', 'https://escudosfc.com.br/pe/atleticovicencia.png', 17, 1)
ON CONFLICT DO NOTHING;