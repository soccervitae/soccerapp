-- Inserir times do Rio Grande do Sul (estado_id: 21, pais_id: 26)
INSERT INTO public.times (nome, escudo_url, pais_id, estado_id) VALUES
-- Série A
('Avenida', 'https://escudosfc.com.br/images/avenida_rs.png', 26, 21),
('Guarany Bagé', 'https://escudosfc.com.br/images/gbage_rs.jpg', 26, 21),
('Internacional', 'https://escudosfc.com.br/images/interrs.png', 26, 21),
('Juventude', 'https://escudosfc.com.br/images/juventude.png', 26, 21),
('São José RS', 'https://escudosfc.com.br/images/saojose_rs.png', 26, 21),
('São Luiz', 'https://escudosfc.com.br/images/saoluiz_rs.png', 26, 21),
('Caxias', 'https://escudosfc.com.br/images/caxias.gif', 26, 21),
('Grêmio', 'https://escudosfc.com.br/images/gremio.png', 26, 21),
('Internacional SM', 'https://escudosfc.com.br/images/inter_sm_rs.jpg', 26, 21),
('Monsoon', 'https://escudosfc.com.br/images/monsoon_rs.jpg', 26, 21),
('Novo Hamburgo', 'https://escudosfc.com.br/images/novohamburgo.png', 26, 21),
('Ypiranga RS', 'https://escudosfc.com.br/images/ypiranga_rs.png', 26, 21),
-- Série A2
('Aimoré', 'https://escudosfc.com.br/images/aimore_rs.png', 26, 21),
('APAFUT', 'https://escudosfc.com.br/images/apafut_rs.png', 26, 21),
('Bagé', 'https://escudosfc.com.br/images/bage.png', 26, 21),
('Brasil Farroupilha', 'https://escudosfc.com.br/images/brasil_f_rs.jpg', 26, 21),
('Brasil Pelotas', 'https://escudosfc.com.br/images/gebrasil.gif', 26, 21),
('Esportivo', 'https://escudosfc.com.br/images/esportivo_rs.png', 26, 21),
('Gaúcho', 'https://escudosfc.com.br/images/gaucho.png', 26, 21),
('Glória', 'https://escudosfc.com.br/images/gloria_rs.png', 26, 21),
('Gramadense', 'https://escudosfc.com.br/images/gramadense_rs.png', 26, 21),
('Guarani Venâncio Aires', 'https://escudosfc.com.br/images/guaranivaires_rs.png', 26, 21),
('Lajeadense', 'https://escudosfc.com.br/images/lajeadense_rs.jpg', 26, 21),
('Passo Fundo', 'https://escudosfc.com.br/images/passofundo.jpg', 26, 21),
('Pelotas', 'https://escudosfc.com.br/images/pelotas.jpg', 26, 21),
('Santa Cruz RS', 'https://escudosfc.com.br/images/santacruz_rs.jpg', 26, 21),
('União Frederiquense', 'https://escudosfc.com.br/images/uniao_fred_rs.png', 26, 21),
('Veranópolis', 'https://escudosfc.com.br/images/veranopolis_rs.png', 26, 21),
-- Série B
('Rio Grande', 'https://escudosfc.com.br/images/riogrande.jpg', 26, 21),
('Riograndense', 'https://escudosfc.com.br/images/riograndense_fb.jpg', 26, 21),
('São Gabriel', 'https://escudosfc.com.br/images/sgabriel_rs.png', 26, 21),
('São Paulo RS', 'https://escudosfc.com.br/images/saopaulo_rs.gif', 26, 21),
('Nova Prata', 'https://escudosfc.com.br/images/nova_prata_rs.jpg', 26, 21),
('Novo Horizonte RS', 'https://escudosfc.com.br/images/novo_horizonte_rs.png', 26, 21)
ON CONFLICT DO NOTHING;

-- Inserir times do Paraná (estado_id: 16, pais_id: 26)
INSERT INTO public.times (nome, escudo_url, pais_id, estado_id) VALUES
-- Primeira Divisão
('Athletico Paranaense', 'https://escudosfc.com.br/images/atlpr.png', 26, 16),
('FC Cascavel', 'https://escudosfc.com.br/images/fc_cascavel_pr.png', 26, 16),
('Foz do Iguaçu', 'https://escudosfc.com.br/images/foz_novo_pr.png', 26, 16),
('Independente PR', 'https://escudosfc.com.br/images/independente_pr.png', 26, 16),
('Londrina', 'https://escudosfc.com.br/images/londrina_pr.png', 26, 16),
('Maringá', 'https://escudosfc.com.br/images/gremio_maringa.png', 26, 16),
('Andraus', 'https://escudosfc.com.br/images/andraus_pr.png', 26, 16),
('Azuriz', 'https://escudosfc.com.br/images/azuriz_pr.png', 26, 16),
('Cianorte', 'https://escudosfc.com.br/images/cianorte.jpg', 26, 16),
('Coritiba', 'https://escudosfc.com.br/images/coritiba.png', 26, 16),
('Galo Maringá', 'https://escudosfc.com.br/images/aruko_pr.png', 26, 16),
('Operário PR', 'https://escudosfc.com.br/images/operario_pr.png', 26, 16),
-- Segunda Divisão
('Araucária EC', 'https://escudosfc.com.br/images/araucaria_ec_pr.png', 26, 16),
('Batel', 'https://escudosfc.com.br/images/batel_pr.jpg', 26, 16),
('Laranja Mecânica', 'https://escudosfc.com.br/images/laranja_pr.png', 26, 16),
('Nacional PR', 'https://escudosfc.com.br/images/nacional_pr.png', 26, 16),
('Paraná Clube', 'https://escudosfc.com.br/images/parana.png', 26, 16),
('Paranavaí', 'https://escudosfc.com.br/images/paranavai.png', 26, 16),
('Patriotas PR', 'https://escudosfc.com.br/images/patriotas_pr.png', 26, 16),
('Prudentópolis', 'https://escudosfc.com.br/images/prudentopolis_new.jpg', 26, 16),
('Rio Branco PR', 'https://escudosfc.com.br/images/riobranco_pr.jpg', 26, 16),
('Toledo EC', 'https://escudosfc.com.br/images/toledo_pr.png', 26, 16),
-- Terceira Divisão
('Cambé', 'https://escudosfc.com.br/images/cambe_fc.jpg', 26, 16),
('Apucarana Sports', 'https://escudosfc.com.br/images/apucarana_pr.png', 26, 16),
('Grêmio Maringá', 'https://escudosfc.com.br/images/gremiomaringa_pr.png', 26, 16),
('Iguaçu', 'https://escudosfc.com.br/images/iguacu.png', 26, 16),
('Iraty', 'https://escudosfc.com.br/images/iraty.png', 26, 16),
('Portuguesa PR', 'https://escudosfc.com.br/images/portuguesa_pr.jpg', 26, 16),
('PSTC', 'https://escudosfc.com.br/images/pstc_pr.png', 26, 16),
('União Francisco Beltrão', 'https://escudosfc.com.br/images/uniaofb_pr.png', 26, 16)
ON CONFLICT DO NOTHING;

-- Inserir times de Minas Gerais (estado_id: 13, pais_id: 26)
INSERT INTO public.times (nome, escudo_url, pais_id, estado_id) VALUES
-- Módulo I
('Atlético Mineiro', 'https://escudosfc.com.br/images/atletico.png', 26, 13),
('Democrata GV', 'https://escudosfc.com.br/images/democrata_gv.gif', 26, 13),
('Uberlândia', 'https://escudosfc.com.br/images/uberlandia.jpg', 26, 13),
('URT', 'https://escudosfc.com.br/images/urt.png', 26, 13),
('América MG', 'https://escudosfc.com.br/images/ammg.png', 26, 13),
('Betim', 'https://escudosfc.com.br/images/betim2_mg.png', 26, 13),
('Pouso Alegre', 'https://escudosfc.com.br/images/pouso_alegre_mg.png', 26, 13),
('Tombense', 'https://escudosfc.com.br/images/tombense_mg.png', 26, 13),
('Athletic', 'https://escudosfc.com.br/images/aletico_del_rey_mg.png', 26, 13),
('Cruzeiro', 'https://escudosfc.com.br/images/cruzeiro.png', 26, 13),
('Itabirito', 'https://escudosfc.com.br/images/itabirito_mg.png', 26, 13),
('North', 'https://escudosfc.com.br/images/montes_claros.png', 26, 13),
-- Módulo II
('Boa', 'https://escudosfc.com.br/images/boa_mg.png', 26, 13),
('Caldense', 'https://escudosfc.com.br/images/caldense.jpg', 26, 13),
('Guarani MG', 'https://escudosfc.com.br/images/guarani_mg.png', 26, 13),
('Mamoré', 'https://escudosfc.com.br/images/mamore.png', 26, 13),
('Patrocinense', 'https://escudosfc.com.br/images/patrocinensenovo_mg.png', 26, 13),
('Uberaba', 'https://escudosfc.com.br/images/uberaba_mg.png', 26, 13),
('Aymorés', 'https://escudosfc.com.br/images/aymores_mg.png', 26, 13),
('Coimbra FC Porto', 'https://escudosfc.com.br/images/coimbra_mg.png', 26, 13),
('Democrata SL', 'https://escudosfc.com.br/images/democrata_sl.png', 26, 13),
('Ipatinga', 'https://escudosfc.com.br/images/ipatinga.gif', 26, 13),
('Valério', 'https://escudosfc.com.br/images/valerio.jpg', 26, 13),
('Villa Nova', 'https://escudosfc.com.br/images/villanova.gif', 26, 13),
-- Segunda Divisão
('Boston City MG', 'https://escudosfc.com.br/images/boston_city_mg.png', 26, 13),
('Inter de Minas', 'https://escudosfc.com.br/images/inter_minas_mg.png', 26, 13),
('Nacional MG', 'https://escudosfc.com.br/images/nacional_mg.gif', 26, 13),
('Paracatu', 'https://escudosfc.com.br/images/paracatu_mg.png', 26, 13),
('Tupi', 'https://escudosfc.com.br/images/tupi_mg.png', 26, 13),
('Varginha', 'https://escudosfc.com.br/images/varginha.png', 26, 13)
ON CONFLICT DO NOTHING;