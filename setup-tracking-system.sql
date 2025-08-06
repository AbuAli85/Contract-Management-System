-- Real-time Tracking System with Make.com Integration
-- This extends the webhook system to handle tracking updates

-- ============================================================================
-- TRACKING TABLE SETUP
-- ============================================================================

-- Create tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS trackings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'confirmed', 
        'in_progress',
        'on_route',
        'arrived',
        'service_started',
        'service_completed',
        'payment_processing',
        'completed',
        'cancelled'
    )),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    provider_id UUID NOT NULL REFERENCES profiles(id),
    client_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trackings_booking_id ON trackings(booking_id);
CREATE INDEX IF NOT EXISTS idx_trackings_status ON trackings(status);
CREATE INDEX IF NOT EXISTS idx_trackings_provider_id ON trackings(provider_id);
CREATE INDEX IF NOT EXISTS idx_trackings_client_id ON trackings(client_id);
CREATE INDEX IF NOT EXISTS idx_trackings_updated_at ON trackings(updated_at DESC);

-- Enable RLS
ALTER TABLE trackings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own trackings" ON trackings
    FOR SELECT USING (
        auth.uid() = provider_id OR 
        auth.uid() = client_id OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Providers can update their trackings" ON trackings
    FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "System can insert trackings" ON trackings
    FOR INSERT WITH CHECK (true);

-- Updated at trigger
CREATE TRIGGER update_trackings_updated_at 
    BEFORE UPDATE ON trackings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRACKING WEBHOOK TRIGGER FUNCTION
-- ============================================================================

-- Function to notify when tracking status changes
CREATE OR REPLACE FUNCTION notify_tracking_update()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
    booking_data JSONB;
    service_data JSONB;
    provider_data JSONB;
    client_data JSONB;
    webhook_success BOOLEAN;
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        
        -- Get enriched data for webhook
        SELECT to_jsonb(b.*) INTO booking_data
        FROM bookings b
        WHERE b.id = NEW.booking_id;
        
        SELECT to_jsonb(s.*) INTO service_data
        FROM services s
        JOIN bookings b ON b.service_id = s.id
        WHERE b.id = NEW.booking_id;
        
        SELECT to_jsonb(p.*) INTO provider_data
        FROM profiles p
        WHERE p.id = NEW.provider_id;
        
        SELECT to_jsonb(c.*) INTO client_data
        FROM profiles c
        WHERE c.id = NEW.client_id;
        
        -- Build comprehensive webhook payload
        webhook_payload := jsonb_build_object(
            'event', 'tracking.status_changed',
            'tracking_id', NEW.id,
            'booking_id', NEW.booking_id,
            'booking_number', booking_data->>'booking_number',
            'old_status', OLD.status,
            'new_status', NEW.status,
            'location', jsonb_build_object(
                'lat', NEW.location_lat,
                'lng', NEW.location_lng,
                'address', NEW.location_address
            ),
            'estimated_arrival', NEW.estimated_arrival,
            'actual_arrival', NEW.actual_arrival,
            'notes', NEW.notes,
            'updated_at', NEW.updated_at,
            'booking', booking_data,
            'service', service_data,
            'provider', provider_data,
            'client', client_data,
            'tracking_history', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'status', status,
                        'updated_at', updated_at,
                        'notes', notes
                    ) ORDER BY updated_at DESC
                ) 
                FROM trackings 
                WHERE booking_id = NEW.booking_id
            )
        );
        
        -- Call Make.com webhook for tracking updates
        SELECT safe_webhook_call(
            'https://hook.eu1.make.com/YOUR_TRACKING_UPDATE_WEBHOOK_ID',
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
            'tracking_updated',
            webhook_payload,
            CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
            jsonb_build_object(
                'webhook_url', 'tracking-updated', 
                'success', webhook_success,
                'old_status', OLD.status,
                'new_status', NEW.status
            ),
            NOW()
        );
        
        -- Create notification for client about tracking update
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            metadata
        ) VALUES (
            NEW.client_id,
            'Service Update: ' || initcap(replace(NEW.status, '_', ' ')),
            CASE NEW.status
                WHEN 'confirmed' THEN 'Your service booking has been confirmed by the provider.'
                WHEN 'on_route' THEN 'Your service provider is on the way to your location.'
                WHEN 'arrived' THEN 'Your service provider has arrived at the location.'
                WHEN 'service_started' THEN 'Your service has started.'
                WHEN 'service_completed' THEN 'Your service has been completed successfully.'
                WHEN 'completed' THEN 'Your booking is now complete. Thank you for using our service!'
                WHEN 'cancelled' THEN 'Your service booking has been cancelled.'
                ELSE 'Your service status has been updated to: ' || replace(NEW.status, '_', ' ')
            END,
            'booking_updated',
            jsonb_build_object(
                'booking_id', NEW.booking_id,
                'booking_number', booking_data->>'booking_number',
                'tracking_id', NEW.id,
                'status', NEW.status,
                'location', jsonb_build_object(
                    'lat', NEW.location_lat,
                    'lng', NEW.location_lng,
                    'address', NEW.location_address
                )
            )
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRACKING TRIGGER
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_tracking_update ON trackings;

-- Create trigger for tracking updates
CREATE TRIGGER on_tracking_update
    AFTER UPDATE ON trackings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_tracking_update();

-- ============================================================================
-- TRACKING HELPER FUNCTIONS
-- ============================================================================

-- Function to create initial tracking record when booking is created
CREATE OR REPLACE FUNCTION create_initial_tracking()
RETURNS TRIGGER AS $$
DECLARE
    provider_id_val UUID;
    client_id_val UUID;
BEGIN
    -- Get provider and client IDs from the booking
    SELECT 
        s.provider_id,
        NEW.client_id
    INTO provider_id_val, client_id_val
    FROM services s
    WHERE s.id = NEW.service_id;
    
    -- Create initial tracking record
    INSERT INTO trackings (
        booking_id,
        status,
        provider_id,
        client_id,
        notes
    ) VALUES (
        NEW.id,
        'pending',
        provider_id_val,
        COALESCE(client_id_val, NEW.client_id),
        'Booking created - waiting for provider confirmation'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create tracking when booking is created
DROP TRIGGER IF EXISTS create_tracking_on_booking ON bookings;
CREATE TRIGGER create_tracking_on_booking
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_tracking();

-- Function to update tracking when booking status changes
CREATE OR REPLACE FUNCTION sync_tracking_with_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Update tracking status when booking status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        UPDATE trackings 
        SET 
            status = NEW.status,
            updated_at = NOW(),
            notes = CASE NEW.status
                WHEN 'confirmed' THEN 'Booking confirmed by provider'
                WHEN 'cancelled' THEN 'Booking cancelled'
                WHEN 'completed' THEN 'Service completed'
                ELSE 'Status updated to: ' || NEW.status
            END
        WHERE booking_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync tracking with booking status
DROP TRIGGER IF EXISTS sync_tracking_status ON bookings;
CREATE TRIGGER sync_tracking_status
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION sync_tracking_with_booking();

-- ============================================================================
-- TRACKING API FUNCTIONS
-- ============================================================================

-- Function to update tracking status (for use in Edge Functions/API)
CREATE OR REPLACE FUNCTION update_tracking_status(
    p_booking_id UUID,
    p_new_status TEXT,
    p_location_lat DECIMAL DEFAULT NULL,
    p_location_lng DECIMAL DEFAULT NULL,
    p_location_address TEXT DEFAULT NULL,
    p_estimated_arrival TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_actual_arrival TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    tracking_record RECORD;
    result JSONB;
BEGIN
    -- Update the tracking record
    UPDATE trackings 
    SET 
        status = p_new_status,
        location_lat = COALESCE(p_location_lat, location_lat),
        location_lng = COALESCE(p_location_lng, location_lng),
        location_address = COALESCE(p_location_address, location_address),
        estimated_arrival = COALESCE(p_estimated_arrival, estimated_arrival),
        actual_arrival = COALESCE(p_actual_arrival, actual_arrival),
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE booking_id = p_booking_id
    RETURNING * INTO tracking_record;
    
    IF tracking_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tracking record not found for booking'
        );
    END IF;
    
    -- Return success with tracking data
    result := jsonb_build_object(
        'success', true,
        'tracking', row_to_json(tracking_record),
        'webhook_triggered', true,
        'updated_at', tracking_record.updated_at
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tracking history for a booking
CREATE OR REPLACE FUNCTION get_tracking_history(p_booking_id UUID)
RETURNS TABLE (
    id UUID,
    status TEXT,
    location_lat DECIMAL,
    location_lng DECIMAL,
    location_address TEXT,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.status,
        t.location_lat,
        t.location_lng,
        t.location_address,
        t.estimated_arrival,
        t.actual_arrival,
        t.notes,
        t.updated_at
    FROM trackings t
    WHERE t.booking_id = p_booking_id
    ORDER BY t.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CONFIGURATION NOTES
-- ============================================================================

/*
TO USE THIS TRACKING SYSTEM:

1. Replace webhook URL in notify_tracking_update() function:
   'https://hook.eu1.make.com/YOUR_TRACKING_UPDATE_WEBHOOK_ID'

2. Update tracking status via API:
   SELECT update_tracking_status(
     'booking-uuid',
     'on_route',
     40.7128,
     -74.0060,
     '123 Main St, New York, NY',
     NOW() + INTERVAL '30 minutes',
     NULL,
     'Provider is on the way'
   );

3. Get tracking history:
   SELECT * FROM get_tracking_history('booking-uuid');

4. The system will automatically:
   - Create tracking record when booking is created
   - Sync tracking status with booking status
   - Trigger webhooks on status changes
   - Create notifications for clients
   - Log all webhook calls

5. Status flow typically follows:
   pending → confirmed → on_route → arrived → service_started → service_completed → completed
*/
