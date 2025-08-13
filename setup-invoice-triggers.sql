-- Invoice Triggers for PostgreSQL
-- Run this after the functions are created

-- Function to auto-create invoice when booking is confirmed
CREATE OR REPLACE FUNCTION auto_create_invoice_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    result JSONB;
BEGIN
    -- Create invoice when booking status changes to 'confirmed'
    IF (OLD IS NULL OR OLD.status != 'confirmed') AND NEW.status = 'confirmed' THEN
        
        -- Create invoice from booking
        SELECT create_invoice_from_booking(NEW.id) INTO result;
        
        IF (result->>'success')::boolean THEN
            RAISE NOTICE 'Invoice created automatically for booking %: %', 
                NEW.id, result->>'invoice_number';
        ELSE
            RAISE WARNING 'Failed to create invoice for booking %: %', 
                NEW.id, result->>'error';
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic invoice creation
DROP TRIGGER IF EXISTS auto_create_invoice_trigger ON bookings;
CREATE TRIGGER auto_create_invoice_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'confirmed')
    EXECUTE FUNCTION auto_create_invoice_on_booking();

-- Create webhook logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_type TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL,
    response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple webhook function placeholder
CREATE OR REPLACE FUNCTION safe_webhook_call(webhook_url TEXT, payload JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- This is a placeholder - replace with actual HTTP calls using pg_net or similar
    RAISE NOTICE 'Webhook called: % with payload: %', webhook_url, payload;
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Webhook call failed: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when invoice is created or updated
CREATE OR REPLACE FUNCTION notify_invoice_update()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
    booking_data JSONB;
    webhook_success BOOLEAN;
    event_type TEXT;
BEGIN
    -- Determine event type
    IF TG_OP = 'INSERT' THEN
        event_type := 'invoice.created';
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
        event_type := 'invoice.status_changed';
    ELSE
        event_type := 'invoice.updated';
    END IF;
    
    -- Get booking data
    SELECT to_jsonb(b.*) INTO booking_data
    FROM bookings b
    WHERE b.id = NEW.booking_id;
    
    -- Build webhook payload
    webhook_payload := jsonb_build_object(
        'event', event_type,
        'invoice_id', NEW.id,
        'invoice_number', NEW.invoice_number,
        'booking_id', NEW.booking_id,
        'status', NEW.status,
        'subtotal', NEW.subtotal,
        'vat_amount', NEW.vat_amount,
        'total_amount', NEW.total_amount,
        'currency', NEW.currency,
        'client_email', NEW.client_email,
        'client_name', NEW.client_name,
        'provider_id', NEW.provider_id,
        'invoice_date', NEW.invoice_date,
        'due_date', NEW.due_date,
        'paid_at', NEW.paid_at,
        'booking', booking_data
    );
    
    -- Add old status if this is a status change
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        webhook_payload := webhook_payload || jsonb_build_object('old_status', OLD.status);
    END IF;
    
    -- Call webhook (replace URL with your actual Make.com webhook)
    SELECT safe_webhook_call(
        'https://hook.eu1.make.com/YOUR_INVOICE_WEBHOOK_ID',
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
        event_type,
        webhook_payload,
        CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
        jsonb_build_object('webhook_url', 'invoice-webhook', 'success', webhook_success),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create invoice webhook trigger
DROP TRIGGER IF EXISTS invoice_webhook_trigger ON invoices;
CREATE TRIGGER invoice_webhook_trigger
    AFTER INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION notify_invoice_update();

SELECT 'Invoice triggers created successfully!' as status;
