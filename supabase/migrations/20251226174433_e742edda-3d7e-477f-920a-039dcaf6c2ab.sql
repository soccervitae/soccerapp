-- Adicionar campos de recorte de música nas tabelas posts e stories
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS music_start_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS music_end_seconds INTEGER;

ALTER TABLE public.stories 
  ADD COLUMN IF NOT EXISTS music_start_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS music_end_seconds INTEGER;

-- Criar índice para música nos posts
CREATE INDEX IF NOT EXISTS idx_posts_music_start_seconds ON public.posts(music_start_seconds) WHERE music_track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_music_start_seconds ON public.stories(music_start_seconds) WHERE music_track_id IS NOT NULL;