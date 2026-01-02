-- Remove the cron job for cleanup
SELECT cron.unschedule('cleanup-expired-session-tokens');

-- Drop the session_transfer_tokens table
DROP TABLE IF EXISTS public.session_transfer_tokens;