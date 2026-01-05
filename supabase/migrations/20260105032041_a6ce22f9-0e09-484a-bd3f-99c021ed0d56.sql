-- Criar tabela funcaoperfil
CREATE TABLE public.funcaoperfil (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.funcaoperfil ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Funcaoperfil is viewable by everyone"
ON public.funcaoperfil
FOR SELECT
USING (true);

-- Inserir dados iniciais
INSERT INTO public.funcaoperfil (name) VALUES ('Atleta'), ('Comissão');