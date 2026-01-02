-- Atualizar escudos de times de Pernambuco com URLs corretas do escudosfc.com.br

-- Caruaru City - URL correta é caruaru_city_pe.png
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/caruaru_city_pe.png' WHERE nome = 'Caruaru City' AND estado_id = 17;

-- Atlético Pernambucano - URL correta é atletico_pernambucano.png
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/atletico_pernambucano.png' WHERE nome = 'Atlético Pernambucano' AND estado_id = 17;

-- Auto Esporte - URL correta é pe_autoesporte.png
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/pe_autoesporte.png' WHERE nome = 'Auto Esporte' AND estado_id = 17;

-- Arcoverde - URL correta é arcoverde_pe.jpg
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/arcoverde_pe.jpg' WHERE nome = 'Arcoverde' AND estado_id = 17;

-- Atlético Caruaru - URL correta é atl_caruaru_pe.jpg
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/atl_caruaru_pe.jpg' WHERE nome = 'Atlético Caruaru' AND estado_id = 17;

-- Guarani - URL correta é pe_guarani.jpg
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/pe_guarani.jpg' WHERE nome = 'Guarani' AND estado_id = 17;

-- Íbis - URL correta é ibis_pe.jpg
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/ibis_pe.jpg' WHERE nome = 'Íbis' AND estado_id = 17;

-- Ferroviário - URL correta é ferroviario_pe.gif
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/ferroviario_pe.gif' WHERE nome = 'Ferroviário' AND estado_id = 17;

-- Cabense - URL correta é cabense.jpg
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/cabense.jpg' WHERE nome = 'Cabense' AND estado_id = 17;

-- Flamengo de Arcoverde - URL correta é flamengo_pe.png
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/flamengo_pe.png' WHERE nome = 'Flamengo de Arcoverde' AND estado_id = 17;

-- Retrô - adicionar se não existe
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/retro_pe.png' WHERE nome = 'Retrô' AND estado_id = 17;

-- Sport - URL correta é sport.gif
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/sport.gif' WHERE nome = 'Sport' AND estado_id = 17;

-- Santa Cruz - URL correta é santacruz.png
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/santacruz.png' WHERE nome = 'Santa Cruz' AND estado_id = 17;

-- Vitória das Tabocas - URL correta é vitoria_pe.jpg
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/vitoria_pe.jpg' WHERE nome = 'Vitória das Tabocas' AND estado_id = 17;