-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily reminder notifications for pending approvals/bookings
SELECT cron.schedule(
  'daily-reminders',
  '0 9 * * *',  -- Every day at 9:00 AM
  $$
  INSERT INTO notifications (user_id, type, message, created_at)
  SELECT 
    user_id,
    'reminder',
    'You have pending bookings or approvals',
    now()
  FROM bookings 
  WHERE status = 'pending' 
    AND created_at < now() - interval '1 day'
  GROUP BY user_id;
  $$
);

-- Weekly cleanup of stale sessions/logs
SELECT cron.schedule(
  'weekly-cleanup',
  '0 2 * * 0',  -- Every Sunday at 2:00 AM
  $$
  DELETE FROM sessions WHERE last_active < now() - interval '7 days';
  DELETE FROM audit_logs WHERE created_at < now() - interval '30 days';
  $$
);