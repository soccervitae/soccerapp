-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule cron job to clear expired bans every hour
SELECT cron.schedule(
  'clear-expired-bans-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wdgpmpgdlauiawbtbxmn.supabase.co/functions/v1/clear-expired-bans',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3BtcGdkbGF1aWF3YnRieG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDI0NDQsImV4cCI6MjA2NTQxODQ0NH0.g-lO4hM9GNg4M1VcYxz2-ybWJOe0LqBRPHPEbFD2SJA'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);