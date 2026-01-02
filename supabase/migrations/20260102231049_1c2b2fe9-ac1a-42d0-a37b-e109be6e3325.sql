-- Fix post deletion: run cascade cleanup AFTER DELETE to avoid count triggers updating the row being deleted

DROP TRIGGER IF EXISTS on_post_delete ON public.posts;

CREATE TRIGGER on_post_delete
AFTER DELETE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.delete_post_related_data();
