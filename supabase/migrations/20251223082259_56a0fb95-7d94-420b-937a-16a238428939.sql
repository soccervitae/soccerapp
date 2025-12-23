-- Criar tabela para marcação de pessoas em posts
CREATE TABLE public.post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  x_position NUMERIC(5,2) NOT NULL,
  y_position NUMERIC(5,2) NOT NULL,
  photo_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, photo_index)
);

-- Habilitar RLS
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Tags são visíveis por todos" 
ON public.post_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem criar tags em seus posts" 
ON public.post_tags 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
);

CREATE POLICY "Usuários podem deletar tags de seus posts" 
ON public.post_tags 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
);

-- Trigger para notificar usuário marcado
CREATE OR REPLACE FUNCTION public.notify_tagged_user()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  IF NEW.user_id != post_owner_id THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'tag',
      post_owner_id,
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_user_tagged
  AFTER INSERT ON public.post_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tagged_user();