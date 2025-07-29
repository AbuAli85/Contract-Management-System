-- Migration: Setup pg_cron for Session Expiry Reminders
-- Date: 2025-07-29
-- Description: Configures automated session expiry reminders via pg_cron

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create session_reminders table for logging reminder activities
CREATE TABLE IF NOT EXISTS session_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    user_id UUID NOT NULL,
    hours_until_expiry INTEGER NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_reminders_user_id ON session_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_sent_at ON session_reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_session_reminders_status ON session_reminders(status);

-- Enable RLS on session_reminders table
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session_reminders
DROP POLICY IF EXISTS "Users can view own reminders" ON session_reminders;
DROP POLICY IF EXISTS "Admins can view all reminders" ON session_reminders;

CREATE POLICY "Users can view own reminders" ON session_reminders
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reminders" ON session_reminders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Drop existing cron job if it exists
SELECT cron.unschedule('session-expiry-reminder');

-- Schedule the session expiry reminder function to run every hour
SELECT cron.schedule(
    'session-expiry-reminder',
    '0 * * * *', -- Every hour at minute 0
    $$
    SELECT net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/session-expiry-reminder',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'
    );
    $$
);

-- Create a function to manually trigger session expiry reminders (for testing)
CREATE OR REPLACE FUNCTION trigger_session_expiry_reminder()
RETURNS TEXT AS $$
BEGIN
    -- This function can be called manually to test the reminder system
    PERFORM net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/session-expiry-reminder',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'
    );
    
    RETURN 'Session expiry reminder triggered successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION trigger_session_expiry_reminder() TO authenticated;

-- Create a function to check cron job status
CREATE OR REPLACE FUNCTION get_session_reminder_status()
RETURNS TABLE(
    job_id BIGINT,
    schedule TEXT,
    command TEXT,
    nodename TEXT,
    nodeport INTEGER,
    database TEXT,
    username TEXT,
    active BOOLEAN,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.jobid,
        c.schedule,
        c.command,
        c.nodename,
        c.nodeport,
        c.database,
        c.username,
        c.active,
        c.last_run,
        c.next_run
    FROM cron.job c
    WHERE c.jobid = (
        SELECT jobid 
        FROM cron.job 
        WHERE command LIKE '%session-expiry-reminder%'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_session_reminder_status() TO authenticated;

-- Create a function to get reminder statistics
CREATE OR REPLACE FUNCTION get_reminder_statistics(
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE(
    total_reminders BIGINT,
    successful_reminders BIGINT,
    failed_reminders BIGINT,
    unique_users BIGINT,
    avg_hours_until_expiry NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reminders,
        COUNT(*) FILTER (WHERE status = 'sent') as successful_reminders,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_reminders,
        COUNT(DISTINCT user_id) as unique_users,
        ROUND(AVG(hours_until_expiry), 2) as avg_hours_until_expiry
    FROM session_reminders
    WHERE sent_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_reminder_statistics(INTEGER) TO authenticated;

-- Create a view for recent reminder activity
CREATE OR REPLACE VIEW recent_session_reminders AS
SELECT 
    sr.id,
    sr.session_id,
    sr.user_id,
    u.email as user_email,
    u.role as user_role,
    sr.hours_until_expiry,
    sr.sent_at,
    sr.status,
    sr.error_message,
    sr.created_at
FROM session_reminders sr
LEFT JOIN users u ON sr.user_id = u.id
WHERE sr.sent_at >= NOW() - INTERVAL '7 days'
ORDER BY sr.sent_at DESC;

-- Grant select permission on the view
GRANT SELECT ON recent_session_reminders TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE session_reminders IS 'Log of session expiry reminders sent to users';
COMMENT ON FUNCTION trigger_session_expiry_reminder() IS 'Manually trigger session expiry reminder function';
COMMENT ON FUNCTION get_session_reminder_status() IS 'Get status of session expiry reminder cron job';
COMMENT ON FUNCTION get_reminder_statistics(INTEGER) IS 'Get statistics about session expiry reminders';
COMMENT ON VIEW recent_session_reminders IS 'Recent session expiry reminder activity';

-- Insert initial system activity log entry
INSERT INTO system_activity_log (
    action,
    details,
    created_by
) VALUES (
    'session_expiry_reminder_setup',
    jsonb_build_object(
        'cron_schedule', '0 * * * *',
        'function_url', 'https://your-project-ref.supabase.co/functions/v1/session-expiry-reminder',
        'setup_timestamp', NOW()
    ),
    'system'
) ON CONFLICT DO NOTHING;