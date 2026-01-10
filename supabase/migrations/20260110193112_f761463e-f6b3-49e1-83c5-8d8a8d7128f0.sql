-- Function to notify users mentioned in comments
CREATE OR REPLACE FUNCTION public.notify_mentioned_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mention_username TEXT;
  mentioned_user_id UUID;
  mention_pattern TEXT := '@([a-zA-Z0-9_]+)';
  matches TEXT[];
BEGIN
  -- Find all @username mentions in the comment content
  FOR mention_username IN
    SELECT DISTINCT (regexp_matches(NEW.content, '@([a-zA-Z0-9_]+)', 'g'))[1]
  LOOP
    -- Find the user ID for this username
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE username = mention_username
    LIMIT 1;
    
    -- If user exists and is not the comment author, create notification
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      PERFORM public.create_notification(
        mentioned_user_id,  -- user receiving notification
        'mention',          -- notification type
        NEW.user_id,        -- actor (who mentioned)
        NEW.post_id,        -- post_id
        NEW.id,             -- comment_id
        NEW.content         -- content preview
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment mentions
DROP TRIGGER IF EXISTS on_comment_mention ON public.comments;
CREATE TRIGGER on_comment_mention
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentioned_users();