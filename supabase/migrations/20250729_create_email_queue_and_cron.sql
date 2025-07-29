-- Migration: Create email queue table and pg_cron setup
-- Date: 2025-07-29
-- Description: Set up email queue system and automated session expiry reminders

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    template VARCHAR(100) NOT NULL,
    data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_template ON email_queue(template);

-- Create system activity log table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    created_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for system activity log
CREATE INDEX IF NOT EXISTS idx_system_activity_log_action ON system_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_system_activity_log_created_at ON system_activity_log(created_at);

-- Add notified column to auth.sessions if it doesn't exist
-- Note: This might need to be done manually if auth.sessions is managed by Supabase
-- ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;

-- Create function to update updated_at timestamp for email_queue
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_queue updated_at
DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;
CREATE TRIGGER update_email_queue_updated_at 
    BEFORE UPDATE ON email_queue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_email_queue_updated_at();

-- Create function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS INTEGER AS $$
DECLARE
    queue_item RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Process pending emails that are scheduled for now or in the past
    FOR queue_item IN 
        SELECT * FROM email_queue 
        WHERE status = 'pending' 
        AND scheduled_for <= NOW()
        AND retry_count < max_retries
        ORDER BY scheduled_for ASC
        LIMIT 50
    LOOP
        BEGIN
            -- Here you would integrate with your email service
            -- For now, we'll just mark as sent
            UPDATE email_queue 
            SET 
                status = 'sent',
                sent_at = NOW(),
                updated_at = NOW()
            WHERE id = queue_item.id;
            
            processed_count := processed_count + 1;
            
            -- Log successful email send
            INSERT INTO system_activity_log (action, details, created_by)
            VALUES (
                'email_sent',
                jsonb_build_object(
                    'email_id', queue_item.id,
                    'user_id', queue_item.user_id,
                    'template', queue_item.template,
                    'email', queue_item.email
                ),
                'system'
            );
            
        EXCEPTION WHEN OTHERS THEN
            -- Log failed email send
            UPDATE email_queue 
            SET 
                status = CASE 
                    WHEN retry_count + 1 >= max_retries THEN 'failed'
                    ELSE 'pending'
                END,
                retry_count = retry_count + 1,
                error_message = SQLERRM,
                updated_at = NOW()
            WHERE id = queue_item.id;
            
            INSERT INTO system_activity_log (action, details, created_by)
            VALUES (
                'email_failed',
                jsonb_build_object(
                    'email_id', queue_item.id,
                    'user_id', queue_item.user_id,
                    'template', queue_item.template,
                    'error', SQLERRM,
                    'retry_count', queue_item.retry_count + 1
                ),
                'system'
            );
        END;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old email queue items
CREATE OR REPLACE FUNCTION cleanup_email_queue()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sent emails older than 30 days
    DELETE FROM email_queue 
    WHERE status = 'sent' 
    AND sent_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete failed emails older than 7 days
    DELETE FROM email_queue 
    WHERE status = 'failed' 
    AND updated_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old system activity logs
CREATE OR REPLACE FUNCTION cleanup_system_activity_log()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete logs older than 90 days
    DELETE FROM system_activity_log 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule pg_cron jobs
-- Note: These need to be run with superuser privileges

-- Schedule email queue processing every 5 minutes
SELECT cron.schedule(
    'process-email-queue',
    '*/5 * * * *',
    'SELECT process_email_queue();'
);

-- Schedule email queue cleanup daily at 2 AM
SELECT cron.schedule(
    'cleanup-email-queue',
    '0 2 * * *',
    'SELECT cleanup_email_queue();'
);

-- Schedule system activity log cleanup weekly on Sunday at 3 AM
SELECT cron.schedule(
    'cleanup-system-logs',
    '0 3 * * 0',
    'SELECT cleanup_system_activity_log();'
);

-- Schedule session expiry reminder check daily at 9 AM
SELECT cron.schedule(
    'session-expiry-reminder',
    '0 9 * * *',
    'SELECT net.http_post(
        url := ''https://your-project.supabase.co/functions/v1/session-expiry-reminder'',
        headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}''::jsonb,
        body := ''{}''::jsonb
    );'
);

-- Create RLS policies for email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Users can only view their own email queue items
CREATE POLICY "Users can view own email queue items" ON email_queue
    FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert/update email queue items
CREATE POLICY "System can manage email queue" ON email_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for system_activity_log
ALTER TABLE system_activity_log ENABLE ROW LEVEL SECURITY;

-- Only system can manage activity logs
CREATE POLICY "System can manage activity logs" ON system_activity_log
    FOR ALL USING (auth.role() = 'service_role');

-- Create view for email queue statistics
CREATE OR REPLACE VIEW email_queue_stats AS
SELECT 
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_emails,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_emails,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_emails,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_emails,
    COUNT(*) FILTER (WHERE scheduled_for <= NOW()) as overdue_emails,
    AVG(EXTRACT(EPOCH FROM (sent_at - scheduled_for))) as avg_processing_time_seconds
FROM email_queue;

-- Add comments for documentation
COMMENT ON TABLE email_queue IS 'Email queue for scheduled and automated emails';
COMMENT ON TABLE system_activity_log IS 'System activity log for audit trail';
COMMENT ON FUNCTION process_email_queue() IS 'Process pending emails in the queue';
COMMENT ON FUNCTION cleanup_email_queue() IS 'Clean up old email queue items';
COMMENT ON FUNCTION cleanup_system_activity_log() IS 'Clean up old system activity logs';