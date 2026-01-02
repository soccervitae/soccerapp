-- Corrigir URLs dos escudos de Pernambuco (Lote 3: G-P mais times)
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/guarani_pe.png' WHERE nome = 'Guarani de Jaboatão' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/guarany_pe.png' WHERE nome = 'Guarany' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/ibis_pe.jpg' WHERE nome = 'Íbis' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/ibis_pe.jpg' WHERE nome = 'Ibis' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/indep_gara_pe.png' WHERE nome = 'Independente de Garanhuns' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/intercontinental_pe.gif' WHERE nome = 'Intercontinental' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/ipiranga_toritama_pe.png' WHERE nome = 'Ipiranga' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/iporanga_pe.png' WHERE nome = 'Iporanga' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/pe_iris.jpg' WHERE nome = 'Íris' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/pe_israelita.png' WHERE nome = 'Israelita' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/itacuruba_pe.jpg' WHERE nome = 'Itacurubá' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/jet_pe.png' WHERE nome = 'JET' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/joao_barros_pe.png' WHERE nome = 'João de Barros' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/lagodourense_pe.jpg' WHERE nome = 'Lagodourense' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/pe_leao.png' WHERE nome = 'Leão XIII' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/livramento_pe.png' WHERE nome = 'Livramento' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/locomocao_pe.png' WHERE nome = 'Locomoção' AND estado_id = 17;

-- Letra M-P
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/manchete_pe.png' WHERE nome = 'Manchete' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/maravilha_fn.png' WHERE nome = 'Maravilha' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/maravilhas_pe.png' WHERE nome = 'Maravilhas' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/marila_pe.png' WHERE nome = 'Marília' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/pe_moinho.jpg' WHERE nome = 'Moinho Recife' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/montecastelo_pe.png' WHERE nome = 'Monte Castelo' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/nacional_bj_pe.png' WHERE nome = 'Nacional' AND estado_id = 17;

-- Times da página que vi
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/buique_pe.png' WHERE nome = 'Buíque' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/caetes_pe.png' WHERE nome = 'Caetés' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/camorim_pe.png' WHERE nome = 'Camorim' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/pe_america.png' WHERE nome = 'América de Jaboatão' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/atl_goiana_pe.png' WHERE nome = 'Atlético Goiana' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/atl_vicencia_pe.png' WHERE nome = 'Atlético Vicência' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/barcelona_pe.png' WHERE nome = 'Barcelona de Olinda' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/bezerros_pe.png' WHERE nome = 'Bezerros' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/bonito_pe.png' WHERE nome = 'Bonito' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/brasilia_arcoverde_pe.png' WHERE nome = 'Brasília de Arcoverde' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/cruzeiro_arcoverde_pe.png' WHERE nome = 'Cruzeiro de Arcoverde' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/comunicacoes_pe.png' WHERE nome = 'Comunicações' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/corinthians_paulista_pe.png' WHERE nome = 'Corinthians de Paulista' AND estado_id = 17;

-- Remover times fictícios que foram inseridos incorretamente (os que têm /pe/ no caminho e não existem)
-- e atualizar os principais grandes clubes
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/sport.gif' WHERE nome ILIKE '%Sport%Recife%' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/santacruz.png' WHERE nome ILIKE '%Santa Cruz%' AND estado_id = 17;
UPDATE times SET escudo_url = 'https://escudosfc.com.br/images/nautico.png' WHERE nome ILIKE '%Nautico%' OR nome ILIKE '%Náutico%' AND estado_id = 17;