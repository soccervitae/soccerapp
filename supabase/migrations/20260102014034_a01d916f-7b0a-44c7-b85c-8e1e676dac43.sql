-- Adicionar times de Pernambuco (Lote 5: Letras M-P)
INSERT INTO times (nome, escudo_url, estado_id, pais_id) VALUES
-- Letra M
('Maracatu', 'https://escudosfc.com.br/pe/maracatu.png', 17, 1),
('Mauricéia', 'https://escudosfc.com.br/pe/mauriceia.png', 17, 1),
('Metropolitano', 'https://escudosfc.com.br/pe/metropolitanope.png', 17, 1),
('Mustang', 'https://escudosfc.com.br/pe/mustang.png', 17, 1),
-- Letra N
('Nacional de Jaboatão', 'https://escudosfc.com.br/pe/nacionaljaboatao.png', 17, 1),
('Nacional de Recife', 'https://escudosfc.com.br/pe/nacionalrecife.png', 17, 1),
('Náutico de Jaboatão', 'https://escudosfc.com.br/pe/nauticojaboatao.png', 17, 1),
('Nazareno', 'https://escudosfc.com.br/pe/nazareno.png', 17, 1),
-- Letra O
('Olindense', 'https://escudosfc.com.br/pe/olindense.png', 17, 1),
('Operário de Caruaru', 'https://escudosfc.com.br/pe/operariocaruaru.png', 17, 1),
('Operário de Recife', 'https://escudosfc.com.br/pe/operariorecife.png', 17, 1),
('Ouro Preto', 'https://escudosfc.com.br/pe/ouropreto.png', 17, 1),
-- Letra P
('Palmares', 'https://escudosfc.com.br/pe/palmares.png', 17, 1),
('Palmeiras de Arcoverde', 'https://escudosfc.com.br/pe/palmeirasarcoverde.png', 17, 1),
('Palmeiras de Recife', 'https://escudosfc.com.br/pe/palmeirasrecife.png', 17, 1),
('Panelas', 'https://escudosfc.com.br/pe/panelas.png', 17, 1),
('Parnamirim', 'https://escudosfc.com.br/pe/parnamirimpe.png', 17, 1),
('Paudalho', 'https://escudosfc.com.br/pe/paudalho.png', 17, 1),
('Paulistano', 'https://escudosfc.com.br/pe/paulistanope.png', 17, 1),
('Peixe', 'https://escudosfc.com.br/pe/peixe.png', 17, 1),
('Pernambuquinho', 'https://escudosfc.com.br/pe/pernambuquinho.png', 17, 1),
('Pesqueira', 'https://escudosfc.com.br/pe/pesqueira.png', 17, 1),
('Pilar', 'https://escudosfc.com.br/pe/pilar.png', 17, 1),
('Pires', 'https://escudosfc.com.br/pe/pires.png', 17, 1),
('Pitú', 'https://escudosfc.com.br/pe/pitu.png', 17, 1),
('Porto de Jaboatão', 'https://escudosfc.com.br/pe/portojaboatao.png', 17, 1),
('Praia', 'https://escudosfc.com.br/pe/praia.png', 17, 1),
('Princesa do Vale', 'https://escudosfc.com.br/pe/princesadovale.png', 17, 1),
('Progresso de Olinda', 'https://escudosfc.com.br/pe/progressoolinda.png', 17, 1),
('Progresso de São Lourenço', 'https://escudosfc.com.br/pe/progressosaolourenco.png', 17, 1)
ON CONFLICT DO NOTHING;