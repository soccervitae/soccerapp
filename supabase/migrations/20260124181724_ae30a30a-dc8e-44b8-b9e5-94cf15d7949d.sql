-- Add fields for external music sources (Deezer, Spotify, etc.)
ALTER TABLE public.posts 
  ADD COLUMN music_title text,
  ADD COLUMN music_artist text,
  ADD COLUMN music_audio_url text,
  ADD COLUMN music_cover_url text,
  ADD COLUMN music_duration_seconds integer,
  ADD COLUMN music_source text;