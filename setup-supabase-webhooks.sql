-- Supabase Webhook Triggers Setup
-- This file sets up automatic webhook calls from Supabase to Make.com

-- Enable HTTP extension for making webhook calls
CREATE EXTENSION IF NOT EXISTS http;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO postgres, anon, authenticated, service_role;

-- Helper function to safely call webhooks with error handling
CREATE OR REPLACE FUNCTION safe_webhook_call(
    webhook_url TEXT,
    payload JSONB,
    headers http_header[] DEFAULT ARRAY[('Content-Type', 'application/json')]::http_header[]
)
RETURNS BOOLEAN AS $$
DECLARE
    result net.http_response_result;
    success BOOLEAN := FALSE;
BEGIN
    -- Attempt to call webhook
    BEGIN
        SELECT INTO result net.http_post(
            url := webhook_url,
            body := payload::TEXT,
            headers := headers
        );
        
        -- Check if successful (2xx status code)
        IF result.status_code >= 200 AND result.status_code < 300 THEN
            success := TRUE;
            RAISE LOG 'Webhook call successful: % - Status: %', webhook_url, result.status_code;
        ELSE
            RAISE WARNING 'Webhook call failed: % - Status: % - Response: %', 
                webhook_url, result.status_code, result.content;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Webhook call exception: % - Error: %', webhook_url, SQLERRM;
    END;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BOOKING TRIGGERS
-- ============================================================================

-- Function to notify when a booking is created
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
    service_data JSONB;
    provider_data JSONB;
    webhook_success BOOLEAN;
BEGIN
    -- Get enriched data for webhook
    SELECT to_jsonb(s.*) INTO service_data
    FROM services s
    WHERE s.id = NEW.service_id;
    
    SELECT to_jsonb(p.*) INTO provider_data
    FROM profiles p
    JOIN services s ON s.provider_id = p.id
    WHERE s.id = NEW.service_id;
    
    -- Build webhook payload with enriched data
    webhook_payload := jsonb_build_object(
        'event', 'booking.created',
        'booking_id', NEW.id,
        'booking_number', NEW.booking_number,
        'service_id', NEW.service_id,
        'client_id', NEW.client_id,
        'client_email', NEW.client_email,
        'client_name', NEW.client_name,
        'client_phone', NEW.client_phone,
        'scheduled_start', NEW.scheduled_start,
        'scheduled_end', NEW.scheduled_end,
        'quoted_price', NEW.quoted_price,
        'status', NEW.status,
        'created_at', NEW.created_at,
        'service', service_data,
        'provider', provider_data
    );
    
    -- Call Make.com webhook
    SELECT safe_webhook_call(
        'https://hook.eu1.make.com/YOUR_BOOKING_CREATED_WEBHOOK_ID',
        webhook_payload
    ) INTO webhook_success;
    
    -- Log webhook attempt
    INSERT INTO webhook_logs (
        webhook_type,
        payload,
        status,
        response,
        created_at
    ) VALUES (
        'booking_created',
        webhook_payload,
        CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
        jsonb_build_object('webhook_url', 'booking-created', 'success', webhook_success),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when booking status changes
CREATE OR REPLACE FUNCTION notify_booking_status_changed()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
    service_data JSONB;
    provider_data JSONB;
    webhook_success BOOLEAN;
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        
        -- Get enriched data
        SELECT to_jsonb(s.*) INTO service_data
        FROM services s
        WHERE s.id = NEW.service_id;
        
        SELECT to_jsonb(p.*) INTO provider_data
        FROM profiles p
        JOIN services s ON s.provider_id = p.id
        WHERE s.id = NEW.service_id;
        
        -- Build webhook payload
        webhook_payload := jsonb_build_object(
            'event', 'booking.status_changed',
            'booking_id', NEW.id,
            'booking_number', NEW.booking_number,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'client_email', NEW.client_email,
            'client_name', NEW.client_name,
            'provider_id', provider_data->>'id',
            'service_id', NEW.service_id,
            'service_title', service_data->>'title',
            'scheduled_start', NEW.scheduled_start,
            'quoted_price', NEW.quoted_price,
            'updated_at', NOW(),
            'service', service_data,
            'provider', provider_data
        );
        
        -- Call Make.com webhook
        SELECT safe_webhook_call(
            'https://hook.eu1.make.com/YOUR_BOOKING_STATUS_CHANGED_WEBHOOK_ID',
            webhook_payload
        ) INTO webhook_success;
        
        -- Log webhook attempt
        INSERT INTO webhook_logs (
            webhook_type,
            payload,
            status,
            response,
            created_at
        ) VALUES (
            'booking_status_changed',
            webhook_payload,
            CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
            jsonb_build_object('webhook_url', 'booking-status-changed', 'success', webhook_success),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PAYMENT TRIGGERS
-- ============================================================================

-- Function to notify when payment is processed
CREATE OR REPLACE FUNCTION notify_payment_processed()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
    booking_data JSONB;
    webhook_success BOOLEAN;
BEGIN
    -- Get booking data
    SELECT to_jsonb(b.*) INTO booking_data
    FROM bookings b
    WHERE b.id = NEW.booking_id;
    
    -- Build webhook payload
    webhook_payload := jsonb_build_object(
        'event', 'payment.processed',
        'payment_id', NEW.id,
        'booking_id', NEW.booking_id,
        'booking_number', booking_data->>'booking_number',
        'amount', NEW.amount,
        'currency', NEW.currency,
        'status', NEW.status,
        'payment_method', NEW.payment_method,
        'processed_at', NEW.processed_at,
        'booking', booking_data
    );
    
    -- Call Make.com webhook
    SELECT safe_webhook_call(
        'https://hook.eu1.make.com/YOUR_PAYMENT_PROCESSED_WEBHOOK_ID',
        webhook_payload
    ) INTO webhook_success;
    
    -- Log webhook attempt
    INSERT INTO webhook_logs (
        webhook_type,
        payload,
        status,
        response,
        created_at
    ) VALUES (
        'payment_processed',
        webhook_payload,
        CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
        jsonb_build_object('webhook_url', 'payment-processed', 'success', webhook_success),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USER REGISTRATION TRIGGER
-- ============================================================================

-- Function to notify when new user registers
CREATE OR REPLACE FUNCTION notify_user_registered()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
    webhook_success BOOLEAN;
BEGIN
    -- Build webhook payload
    webhook_payload := jsonb_build_object(
        'event', 'user.registered',
        'user_id', NEW.id,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'role', NEW.role,
        'status', NEW.status,
        'company_name', NEW.company_name,
        'business_type', NEW.business_type,
        'created_at', NEW.created_at
    );
    
    -- Call Make.com webhook
    SELECT safe_webhook_call(
        'https://hook.eu1.make.com/YOUR_USER_REGISTERED_WEBHOOK_ID',
        webhook_payload
    ) INTO webhook_success;
    
    -- Log webhook attempt
    INSERT INTO webhook_logs (
        webhook_type,
        payload,
        status,
        response,
        created_at
    ) VALUES (
        'user_registered',
        webhook_payload,
        CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
        jsonb_build_object('webhook_url', 'user-registered', 'success', webhook_success),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SERVICE TRIGGERS
-- ============================================================================

-- Function to notify when service is created
CREATE OR REPLACE FUNCTION notify_service_created()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
    provider_data JSONB;
    webhook_success BOOLEAN;
BEGIN
    -- Get provider data
    SELECT to_jsonb(p.*) INTO provider_data
    FROM profiles p
    WHERE p.id = NEW.provider_id;
    
    -- Build webhook payload
    webhook_payload := jsonb_build_object(
        'event', 'service.created',
        'service_id', NEW.id,
        'provider_id', NEW.provider_id,
        'title', NEW.title,
        'description', NEW.description,
        'category', NEW.category,
        'subcategory', NEW.subcategory,
        'base_price', NEW.base_price,
        'currency', NEW.currency,
        'status', NEW.status,
        'location_type', NEW.location_type,
        'created_at', NEW.created_at,
        'provider', provider_data
    );
    
    -- Call Make.com webhook
    SELECT safe_webhook_call(
        'https://hook.eu1.make.com/YOUR_SERVICE_CREATED_WEBHOOK_ID',
        webhook_payload
    ) INTO webhook_success;
    
    -- Log webhook attempt
    INSERT INTO webhook_logs (
        webhook_type,
        payload,
        status,
        response,
        created_at
    ) VALUES (
        'service_created',
        webhook_payload,
        CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
        jsonb_build_object('webhook_url', 'service-created', 'success', webhook_success),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Booking created trigger
DROP TRIGGER IF EXISTS on_booking_created ON bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_booking_created();

-- Booking status changed trigger
DROP TRIGGER IF EXISTS on_booking_status_changed ON bookings;
CREATE TRIGGER on_booking_status_changed
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_booking_status_changed();

-- Payment processed trigger
DROP TRIGGER IF EXISTS on_payment_processed ON payments;
CREATE TRIGGER on_payment_processed
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    WHEN (NEW.status = 'completed' OR NEW.status = 'failed')
    EXECUTE FUNCTION notify_payment_processed();

-- User registered trigger
DROP TRIGGER IF EXISTS on_user_registered ON profiles;
CREATE TRIGGER on_user_registered
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION notify_user_registered();

-- Service created trigger
DROP TRIGGER IF EXISTS on_service_created ON services;
CREATE TRIGGER on_service_created
    AFTER INSERT ON services
    FOR EACH ROW
    EXECUTE FUNCTION notify_service_created();

-- ============================================================================
-- WEBHOOK LOGS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    response JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_type ON webhook_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- ============================================================================
-- WEBHOOK MONITORING FUNCTIONS
-- ============================================================================

-- Function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_stats(
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    webhook_type TEXT,
    total_calls INTEGER,
    successful_calls INTEGER,
    failed_calls INTEGER,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wl.webhook_type,
        COUNT(*)::INTEGER as total_calls,
        COUNT(CASE WHEN wl.status = 'success' THEN 1 END)::INTEGER as successful_calls,
        COUNT(CASE WHEN wl.status = 'failed' THEN 1 END)::INTEGER as failed_calls,
        ROUND(
            COUNT(CASE WHEN wl.status = 'success' THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(*)::NUMERIC, 0) * 100, 
            2
        ) as success_rate
    FROM webhook_logs wl
    WHERE wl.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY wl.webhook_type
    ORDER BY total_calls DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retry failed webhooks
CREATE OR REPLACE FUNCTION retry_failed_webhooks(
    max_retries INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
    webhook_record RECORD;
    retry_count INTEGER := 0;
    webhook_success BOOLEAN;
BEGIN
    FOR webhook_record IN 
        SELECT * FROM webhook_logs 
        WHERE status = 'failed' 
          AND retry_count < max_retries
          AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 10
    LOOP
        -- Determine webhook URL based on type
        DECLARE
            webhook_url TEXT;
        BEGIN
            webhook_url := CASE webhook_record.webhook_type
                WHEN 'booking_created' THEN 'https://hook.eu1.make.com/YOUR_BOOKING_CREATED_WEBHOOK_ID'
                WHEN 'booking_status_changed' THEN 'https://hook.eu1.make.com/YOUR_BOOKING_STATUS_CHANGED_WEBHOOK_ID'
                WHEN 'payment_processed' THEN 'https://hook.eu1.make.com/YOUR_PAYMENT_PROCESSED_WEBHOOK_ID'
                WHEN 'user_registered' THEN 'https://hook.eu1.make.com/YOUR_USER_REGISTERED_WEBHOOK_ID'
                WHEN 'service_created' THEN 'https://hook.eu1.make.com/YOUR_SERVICE_CREATED_WEBHOOK_ID'
                ELSE NULL
            END;
            
            IF webhook_url IS NOT NULL THEN
                -- Retry webhook call
                SELECT safe_webhook_call(webhook_url, webhook_record.payload) INTO webhook_success;
                
                -- Update log
                UPDATE webhook_logs SET
                    status = CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
                    retry_count = retry_count + 1,
                    processed_at = NOW()
                WHERE id = webhook_record.id;
                
                retry_count := retry_count + 1;
            END IF;
        END;
    END LOOP;
    
    RETURN retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CONFIGURATION NOTES
-- ============================================================================

/*
TO CONFIGURE THIS SETUP:

1. Replace webhook URLs with your actual Make.com webhook URLs:
   - YOUR_BOOKING_CREATED_WEBHOOK_ID
   - YOUR_BOOKING_STATUS_CHANGED_WEBHOOK_ID
   - YOUR_PAYMENT_PROCESSED_WEBHOOK_ID
   - YOUR_USER_REGISTERED_WEBHOOK_ID
   - YOUR_SERVICE_CREATED_WEBHOOK_ID

2. Grant HTTP permissions to your service role in Supabase dashboard:
   - Go to Database → Extensions
   - Enable 'http' extension
   - Go to Database → Roles
   - Grant net schema permissions

3. Test webhooks:
   SELECT safe_webhook_call(
     'https://hook.eu1.make.com/YOUR_WEBHOOK_ID',
     '{"test": "data"}'::jsonb
   );

4. Monitor webhook performance:
   SELECT * FROM get_webhook_stats(7);

5. Retry failed webhooks:
   SELECT retry_failed_webhooks(3);
*/
