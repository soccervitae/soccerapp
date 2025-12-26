-- Criar tabela de músicas disponíveis
CREATE TABLE public.music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (músicas ativas são públicas)
CREATE POLICY "Músicas ativas são públicas" ON public.music_tracks
  FOR SELECT USING (is_active = true);

-- Adicionar campo de música na tabela posts
ALTER TABLE public.posts ADD COLUMN music_track_id UUID REFERENCES public.music_tracks(id);

-- Adicionar campo de música na tabela stories
ALTER TABLE public.stories ADD COLUMN music_track_id UUID REFERENCES public.music_tracks(id);

-- Criar índices para performance
CREATE INDEX idx_music_tracks_category ON public.music_tracks(category);
CREATE INDEX idx_music_tracks_active ON public.music_tracks(is_active);
CREATE INDEX idx_posts_music_track ON public.posts(music_track_id);
CREATE INDEX idx_stories_music_track ON public.stories(music_track_id);

-- Inserir músicas de exemplo (royalty-free do Pixabay)
INSERT INTO public.music_tracks (title, artist, category, duration_seconds, audio_url, cover_url) VALUES
-- Energia
('Epic Victory', 'Sport Beats', 'energia', 30, 'https://cdn.pixabay.com/audio/2024/02/28/audio_6ee0c2b534.mp3', NULL),
('Power Up', 'Action Music', 'energia', 25, 'https://cdn.pixabay.com/audio/2024/03/19/audio_c8c820a355.mp3', NULL),
('Unstoppable', 'Victory Sound', 'energia', 28, 'https://cdn.pixabay.com/audio/2024/01/23/audio_beb87df4e9.mp3', NULL),

-- Motivação
('Rise Up', 'Inspire Audio', 'motivacao', 32, 'https://cdn.pixabay.com/audio/2023/10/24/audio_e1c5e6c649.mp3', NULL),
('Never Give Up', 'Champion Beats', 'motivacao', 27, 'https://cdn.pixabay.com/audio/2024/04/15/audio_7c54e8ae79.mp3', NULL),
('Dream Big', 'Motivation Sound', 'motivacao', 30, 'https://cdn.pixabay.com/audio/2023/09/18/audio_76d2c3d3f0.mp3', NULL),

-- Treino
('Gym Beast', 'Workout Music', 'treino', 35, 'https://cdn.pixabay.com/audio/2024/05/10/audio_8e0c1bc13e.mp3', NULL),
('Push Harder', 'Fitness Beats', 'treino', 28, 'https://cdn.pixabay.com/audio/2024/02/12/audio_3b6f5c7e91.mp3', NULL),
('Beast Mode', 'Training Sound', 'treino', 30, 'https://cdn.pixabay.com/audio/2023/11/06/audio_a4c5e2d1f8.mp3', NULL),

-- Celebração
('We Are Champions', 'Party Beats', 'celebracao', 25, 'https://cdn.pixabay.com/audio/2024/03/25/audio_f9c4b2e7a1.mp3', NULL),
('Victory Dance', 'Celebration Sound', 'celebracao', 30, 'https://cdn.pixabay.com/audio/2023/12/15/audio_b7e4c3f2d9.mp3', NULL),
('Top of the World', 'Winner Music', 'celebracao', 28, 'https://cdn.pixabay.com/audio/2024/01/08/audio_c2d5e8f1a3.mp3', NULL),

-- Relaxante
('Calm Focus', 'Zen Sports', 'relaxante', 40, 'https://cdn.pixabay.com/audio/2024/04/01/audio_e5f7c8d2b4.mp3', NULL),
('Inner Peace', 'Meditation Beats', 'relaxante', 35, 'https://cdn.pixabay.com/audio/2023/08/22/audio_a8c4e1f3d6.mp3', NULL),
('Cool Down', 'Relax Sound', 'relaxante', 32, 'https://cdn.pixabay.com/audio/2024/02/20/audio_d3e6f9c2a7.mp3', NULL);