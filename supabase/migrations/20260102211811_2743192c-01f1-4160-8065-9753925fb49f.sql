-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule cleanup job to run every hour
SELECT cron.schedule(
  'cleanup-expired-session-tokens',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wdgpmpgdlauiawbtbxmn.supabase.co/functions/v1/cleanup-expired-tokens',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3BtcGdkbGF1aWF3YnRieG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTQ2NDAsImV4cCI6MjA3MTk5MDY0MH0.N4GcBwufglOUGhJ9pARhgxsA3_NOY9WbAtsKRmtBA08"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);