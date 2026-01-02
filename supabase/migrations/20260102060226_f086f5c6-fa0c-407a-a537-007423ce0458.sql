-- Trigger para deletar dados relacionados quando um POST é deletado
CREATE OR REPLACE FUNCTION public.delete_post_related_data()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.likes WHERE post_id = OLD.id;
  DELETE FROM public.comments WHERE post_id = OLD.id;
  DELETE FROM public.saved_posts WHERE post_id = OLD.id;
  DELETE FROM public.post_shares WHERE post_id = OLD.id;
  DELETE FROM public.post_tags WHERE post_id = OLD.id;
  DELETE FROM public.notifications WHERE post_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_delete
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_post_related_data();

-- Trigger para deletar dados relacionados quando um STORY é deletado
CREATE OR REPLACE FUNCTION public.delete_story_related_data()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.story_likes WHERE story_id = OLD.id;
  DELETE FROM public.story_views WHERE story_id = OLD.id;
  DELETE FROM public.story_replies WHERE story_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_story_delete
  BEFORE DELETE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_story_related_data();

-- Trigger para deletar dados relacionados quando um HIGHLIGHT é deletado
CREATE OR REPLACE FUNCTION public.delete_highlight_related_data()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.highlight_likes WHERE highlight_id = OLD.id;
  DELETE FROM public.highlight_views WHERE highlight_id = OLD.id;
  DELETE FROM public.highlight_replies WHERE highlight_id = OLD.id;
  DELETE FROM public.highlight_images WHERE highlight_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_highlight_delete
  BEFORE DELETE ON public.user_highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_highlight_related_data();