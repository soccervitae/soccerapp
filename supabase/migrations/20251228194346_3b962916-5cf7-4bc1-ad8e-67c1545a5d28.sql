-- Criar tabela de destaques do usuário
CREATE TABLE public.user_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_highlights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "User highlights are viewable by everyone"
  ON public.user_highlights FOR SELECT USING (true);

CREATE POLICY "Users can create own highlights"
  ON public.user_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights"
  ON public.user_highlights FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights"
  ON public.user_highlights FOR DELETE USING (auth.uid() = user_id);

-- Criar índice para ordenação
CREATE INDEX idx_user_highlights_user_order ON public.user_highlights(user_id, display_order);