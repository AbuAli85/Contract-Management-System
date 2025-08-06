-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'booking_created',
        'booking_updated', 
        'booking_cancelled',
        'booking_confirmed',
        'booking_completed',
        'payment_received',
        'payment_failed',
        'review_received',
        'system',
        'reminder',
        'message'
    )),
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- System can delete expired notifications
CREATE POLICY "System can delete expired notifications" ON notifications
    FOR DELETE USING (expires_at IS NOT NULL AND expires_at < NOW());

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'system',
    p_metadata JSONB DEFAULT '{}',
    p_expires_hours INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate expiration if provided
    IF p_expires_hours IS NOT NULL THEN
        expires_at := NOW() + INTERVAL '1 hour' * p_expires_hours;
    END IF;

    -- Insert notification
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        metadata,
        expires_at
    ) VALUES (
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_metadata,
        expires_at
    ) RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create booking notifications
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
    provider_record RECORD;
    client_record RECORD;
    service_record RECORD;
    notification_title TEXT;
    notification_message TEXT;
    metadata JSONB;
BEGIN
    -- Get related records
    SELECT * INTO service_record FROM services WHERE id = NEW.service_id;
    SELECT * INTO provider_record FROM profiles WHERE id = service_record.provider_id;
    
    -- Build metadata
    metadata := jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', NEW.booking_number,
        'service_id', NEW.service_id,
        'service_title', service_record.title,
        'client_name', NEW.client_name,
        'client_email', NEW.client_email,
        'quoted_price', NEW.quoted_price,
        'status', NEW.status,
        'scheduled_start', NEW.scheduled_start
    );

    IF TG_OP = 'INSERT' THEN
        -- New booking notification for provider
        notification_title := '🆕 New Booking Request';
        notification_message := format('New booking for "%s" from %s on %s', 
            service_record.title, 
            NEW.client_name,
            to_char(NEW.scheduled_start, 'Mon DD at HH24:MI')
        );

        PERFORM create_notification(
            service_record.provider_id,
            notification_title,
            notification_message,
            'booking_created',
            metadata,
            72 -- Expires in 3 days
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Status change notifications
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'confirmed' THEN
                    -- Notify provider of confirmation
                    notification_title := '✅ Booking Confirmed';
                    notification_message := format('Booking %s has been confirmed', NEW.booking_number);
                    
                    PERFORM create_notification(
                        service_record.provider_id,
                        notification_title,
                        notification_message,
                        'booking_updated',
                        metadata
                    );

                WHEN 'cancelled' THEN
                    -- Notify provider of cancellation
                    notification_title := '❌ Booking Cancelled';
                    notification_message := format('Booking %s has been cancelled', NEW.booking_number);
                    
                    PERFORM create_notification(
                        service_record.provider_id,
                        notification_title,
                        notification_message,
                        'booking_updated',
                        metadata
                    );

                WHEN 'completed' THEN
                    -- Notify provider of completion
                    notification_title := '🎉 Booking Completed';
                    notification_message := format('Booking %s has been marked as completed', NEW.booking_number);
                    
                    PERFORM create_notification(
                        service_record.provider_id,
                        notification_title,
                        notification_message,
                        'booking_updated',
                        metadata
                    );

                WHEN 'in_progress' THEN
                    -- Notify provider booking started
                    notification_title := '🚀 Booking Started';
                    notification_message := format('Booking %s is now in progress', NEW.booking_number);
                    
                    PERFORM create_notification(
                        service_record.provider_id,
                        notification_title,
                        notification_message,
                        'booking_updated',
                        metadata
                    );
            END CASE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for booking notifications
DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
CREATE TRIGGER booking_notification_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_booking_notification();

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create payment notifications
CREATE OR REPLACE FUNCTION create_payment_notification()
RETURNS TRIGGER AS $$
DECLARE
    booking_record RECORD;
    service_record RECORD;
    metadata JSONB;
BEGIN
    -- Get booking and service details
    SELECT b.*, s.title as service_title, s.provider_id 
    INTO booking_record
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE b.id = NEW.booking_id;

    -- Build metadata
    metadata := jsonb_build_object(
        'payment_id', NEW.id,
        'booking_id', NEW.booking_id,
        'booking_number', booking_record.booking_number,
        'amount', NEW.amount,
        'status', NEW.status,
        'payment_method', NEW.payment_method
    );

    IF NEW.status = 'completed' THEN
        -- Payment received notification for provider
        PERFORM create_notification(
            booking_record.provider_id,
            '💰 Payment Received',
            format('Payment of $%.2f received for booking %s', 
                NEW.amount, 
                booking_record.booking_number
            ),
            'payment_received',
            metadata
        );
    ELSIF NEW.status = 'failed' THEN
        -- Payment failed notification for provider
        PERFORM create_notification(
            booking_record.provider_id,
            '⚠️ Payment Failed',
            format('Payment failed for booking %s - please contact the client', 
                booking_record.booking_number
            ),
            'payment_failed',
            metadata,
            24 -- Expires in 24 hours
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment notifications
DROP TRIGGER IF EXISTS payment_notification_trigger ON payments;
CREATE TRIGGER payment_notification_trigger
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_notification();

-- Function to send reminder notifications
CREATE OR REPLACE FUNCTION send_booking_reminders()
RETURNS INTEGER AS $$
DECLARE
    booking_record RECORD;
    reminder_count INTEGER := 0;
    metadata JSONB;
BEGIN
    -- Find bookings starting in 24 hours
    FOR booking_record IN
        SELECT 
            b.*,
            s.title as service_title,
            s.provider_id,
            p.full_name as provider_name
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN profiles p ON p.id = s.provider_id
        WHERE b.status = 'confirmed'
          AND b.scheduled_start BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
          AND NOT EXISTS (
              SELECT 1 FROM notifications 
              WHERE user_id = s.provider_id 
                AND type = 'reminder'
                AND metadata->>'booking_id' = b.id::text
                AND created_at > NOW() - INTERVAL '12 hours'
          )
    LOOP
        metadata := jsonb_build_object(
            'booking_id', booking_record.id,
            'booking_number', booking_record.booking_number,
            'service_title', booking_record.service_title,
            'client_name', booking_record.client_name,
            'scheduled_start', booking_record.scheduled_start
        );

        PERFORM create_notification(
            booking_record.provider_id,
            '⏰ Upcoming Booking Reminder',
            format('You have a booking for "%s" with %s tomorrow at %s',
                booking_record.service_title,
                booking_record.client_name,
                to_char(booking_record.scheduled_start, 'HH24:MI')
            ),
            'reminder',
            metadata,
            48 -- Expires in 48 hours
        );

        reminder_count := reminder_count + 1;
    END LOOP;

    RETURN reminder_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data for testing
INSERT INTO notifications (user_id, title, message, type, metadata) 
SELECT 
    id as user_id,
    'Welcome to the Platform! 🎉',
    'Your account has been set up successfully. Start by creating your first service listing.',
    'system',
    jsonb_build_object('welcome', true)
FROM profiles 
WHERE role = 'provider'
ON CONFLICT DO NOTHING;
