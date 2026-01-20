-- Add England as a separate country for football purposes
INSERT INTO public.paises (nome, sigla, bandeira_url)
VALUES ('Inglaterra', 'ENG', 'https://flagcdn.com/w320/gb-eng.png')
ON CONFLICT DO NOTHING;