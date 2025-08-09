-- Booking Event Triggers for Real-time Webhooks
-- This migration adds database triggers to automatically send booking events to webhooks

-- Create function to trigger webhook on booking event insert
CREATE OR REPLACE FUNCTION trigger_booking_event_webhook()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
    payload JSONB;
    response_code INTEGER;
BEGIN
    -- Get the webhook URL from environment or settings
    webhook_url := current_setting('app.webhook_url', true);
    
    -- If no webhook URL is configured, skip
    IF webhook_url IS NULL OR webhook_url = '' THEN
        RETURN NEW;
    END IF;

    -- Prepare the payload
    payload := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'type', TG_OP,
        'record', row_to_json(NEW),
        'timestamp', NOW()
    );

    -- Try to send webhook using pg_net extension (if available)
    -- This is a simplified version - in production you might want to use Edge Functions
    BEGIN
        -- Log the event for debugging
        INSERT INTO webhook_logs (
            table_name,
            operation,
            record_id,
            payload,
            status,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id,
            payload,
            'pending',
            NOW()
        );
        
        -- In a real implementation, you would use something like:
        -- SELECT net.http_post(webhook_url, payload::text, '{"Content-Type": "application/json"}');
        -- For now, we'll just log it
        
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the original operation
        INSERT INTO webhook_logs (
            table_name,
            operation,
            record_id,
            payload,
            status,
            error_message,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id,
            payload,
            'failed',
            SQLERRM,
            NOW()
        );
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create webhook logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    payload JSONB,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    response_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Create index for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_table_name ON webhook_logs(table_name);

-- Create trigger for booking_events table
DROP TRIGGER IF EXISTS booking_events_webhook_trigger ON booking_events;
CREATE TRIGGER booking_events_webhook_trigger
    AFTER INSERT ON booking_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_booking_event_webhook();

-- Create trigger for bookings table (for status changes)
DROP TRIGGER IF EXISTS bookings_webhook_trigger ON bookings;
CREATE TRIGGER bookings_webhook_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trigger_booking_event_webhook();

-- Function to manually trigger webhook for existing records
CREATE OR REPLACE FUNCTION manually_trigger_webhook(
    table_name TEXT,
    record_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    record_data JSONB;
    webhook_url TEXT;
    payload JSONB;
BEGIN
    -- Get webhook URL
    webhook_url := current_setting('app.webhook_url', true);
    
    IF webhook_url IS NULL OR webhook_url = '' THEN
        RAISE NOTICE 'No webhook URL configured';
        RETURN FALSE;
    END IF;

    -- Get the record data
    CASE table_name
        WHEN 'booking_events' THEN
            SELECT row_to_json(be) INTO record_data
            FROM booking_events be
            WHERE be.id = record_id;
        WHEN 'bookings' THEN
            SELECT row_to_json(b) INTO record_data
            FROM bookings b
            WHERE b.id = record_id;
        ELSE
            RAISE EXCEPTION 'Unsupported table: %', table_name;
    END CASE;

    IF record_data IS NULL THEN
        RAISE NOTICE 'Record not found: % with id %', table_name, record_id;
        RETURN FALSE;
    END IF;

    -- Prepare payload
    payload := jsonb_build_object(
        'table', table_name,
        'type', 'MANUAL',
        'record', record_data,
        'timestamp', NOW()
    );

    -- Log the manual trigger
    INSERT INTO webhook_logs (
        table_name,
        operation,
        record_id,
        payload,
        status,
        created_at
    ) VALUES (
        table_name,
        'MANUAL',
        record_id,
        payload,
        'pending',
        NOW()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old webhook logs
CREATE OR REPLACE FUNCTION cleanup_webhook_logs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_logs
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retry failed webhooks
CREATE OR REPLACE FUNCTION retry_failed_webhooks(max_retries INTEGER DEFAULT 3)
RETURNS INTEGER AS $$
DECLARE
    retry_count INTEGER := 0;
    webhook_record RECORD;
BEGIN
    FOR webhook_record IN
        SELECT id, table_name, operation, record_id, payload
        FROM webhook_logs
        WHERE status = 'failed'
        AND (retry_count IS NULL OR retry_count < max_retries)
        ORDER BY created_at DESC
        LIMIT 100
    LOOP
        -- Update retry count
        UPDATE webhook_logs
        SET status = 'retrying',
            retry_count = COALESCE(retry_count, 0) + 1
        WHERE id = webhook_record.id;
        
        -- In a real implementation, you would retry the webhook here
        -- For now, we'll just log it
        
        retry_count := retry_count + 1;
    END LOOP;
    
    RETURN retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for webhook statistics
CREATE OR REPLACE VIEW webhook_stats AS
SELECT
    table_name,
    operation,
    status,
    COUNT(*) as count,
    MAX(created_at) as last_occurrence,
    AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
FROM webhook_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY table_name, operation, status
ORDER BY table_name, operation, status;

-- Grant necessary permissions
GRANT SELECT ON webhook_logs TO authenticated;
GRANT SELECT ON webhook_stats TO authenticated;
GRANT EXECUTE ON FUNCTION manually_trigger_webhook TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_webhook_logs TO service_role;
GRANT EXECUTE ON FUNCTION retry_failed_webhooks TO service_role;

-- Enable RLS on webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for webhook_logs (admins only)
CREATE POLICY "Webhook logs admin access" ON webhook_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Comments for documentation
COMMENT ON FUNCTION trigger_booking_event_webhook IS 'Automatically triggers webhook when booking events are inserted';
COMMENT ON FUNCTION manually_trigger_webhook IS 'Manually trigger webhook for a specific record';
COMMENT ON FUNCTION cleanup_webhook_logs IS 'Clean up old webhook logs based on retention period';
COMMENT ON FUNCTION retry_failed_webhooks IS 'Retry failed webhook deliveries';
COMMENT ON TABLE webhook_logs IS 'Log of all webhook attempts and their status';
COMMENT ON VIEW webhook_stats IS 'Statistics view for webhook performance monitoring';

-- Example usage comments
/*
-- Set webhook URL (would typically be done via environment or settings)
-- SELECT set_config('app.webhook_url', 'https://your-app.com/api/webhooks/booking-events', false);

-- Manually trigger a webhook for a specific booking event
-- SELECT manually_trigger_webhook('booking_events', 'your-booking-event-id');

-- Clean up old webhook logs (older than 30 days)
-- SELECT cleanup_webhook_logs(30);

-- Retry failed webhooks
-- SELECT retry_failed_webhooks(3);

-- View webhook statistics
-- SELECT * FROM webhook_stats;
*/