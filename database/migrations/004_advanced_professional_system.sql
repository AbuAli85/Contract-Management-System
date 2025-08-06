-- =====================================================
-- Phase 4: Advanced Professional System Database Schema
-- Contract Management System - Advanced Features
-- =====================================================

-- Enable RLS and necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables that might have type conflicts (in correct order)
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS system_announcements CASCADE;
DROP TABLE IF EXISTS delivery_tracking CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS booking_resources CASCADE;
DROP TABLE IF EXISTS tracking_entities CASCADE;

-- =====================================================
-- 1. BOOKING SYSTEM TABLES
-- =====================================================

-- Resources table for bookable items
CREATE TABLE booking_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('meeting_room', 'vehicle', 'equipment', 'facility')),
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 1,
    location VARCHAR(255),
    amenities JSONB DEFAULT '[]',
    hourly_rate DECIMAL(10,2),
    availability_hours JSONB DEFAULT '{"start": "08:00", "end": "17:00"}',
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES booking_resources(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')),
    attendees JSONB DEFAULT '[]',
    total_cost DECIMAL(10,2),
    recurring_pattern JSONB,
    parent_booking_id UUID REFERENCES bookings(id),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking conflicts check function
CREATE OR REPLACE FUNCTION check_booking_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for time conflicts with other bookings for the same resource
    IF EXISTS (
        SELECT 1 FROM bookings 
        WHERE resource_id = NEW.resource_id
        AND id != COALESCE(NEW.id, uuid_generate_v4())
        AND status IN ('confirmed', 'pending')
        AND (
            (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Booking conflict detected for resource % during the specified time period', NEW.resource_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking conflicts
DROP TRIGGER IF EXISTS booking_conflict_check ON bookings;
CREATE TRIGGER booking_conflict_check
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION check_booking_conflicts();

-- =====================================================
-- 2. TRACKING SYSTEM TABLES
-- =====================================================

-- Tracking entities table
CREATE TABLE tracking_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('contract', 'document', 'project', 'delivery')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tracking events table for activity history
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint after table creation to avoid type conflicts
ALTER TABLE tracking_events 
ADD CONSTRAINT tracking_events_entity_id_fkey 
FOREIGN KEY (entity_id) REFERENCES tracking_entities(id) ON DELETE CASCADE;

-- Delivery tracking table
CREATE TABLE delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'delayed', 'cancelled')),
    carrier VARCHAR(100),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    checkpoints JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 3. NOTIFICATION SYSTEM TABLES
-- =====================================================

-- User notifications table
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'message')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(50) DEFAULT 'system' CHECK (category IN ('system', 'contract', 'document', 'project', 'reminder', 'announcement')),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    sender_id UUID REFERENCES auth.users(id),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sound_notifications BOOLEAN DEFAULT false,
    notification_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily')),
    categories JSONB DEFAULT '{"system": true, "contract": true, "document": true, "project": true, "reminder": true, "announcement": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- System announcements table
CREATE TABLE system_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'admins', 'users', 'specific')),
    target_user_ids JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 4. ADVANCED ANALYTICS TABLES
-- =====================================================

-- System metrics table for dashboard analytics
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
    dimension_tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Activity logs for comprehensive tracking
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Booking system indexes
CREATE INDEX IF NOT EXISTS idx_bookings_resource_time ON bookings(resource_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_booking_resources_type_active ON booking_resources(type, is_active);

-- Tracking system indexes
CREATE INDEX IF NOT EXISTS idx_tracking_entities_type_status ON tracking_entities(type, status);
CREATE INDEX IF NOT EXISTS idx_tracking_entities_assigned ON tracking_entities(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tracking_entities_due_date ON tracking_entities(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_events_entity ON tracking_events(entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_number ON delivery_tracking(tracking_number);

-- Notification system indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON user_notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_category ON user_notifications(category, created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_starred ON user_notifications(user_id, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_system_announcements_active ON system_announcements(is_active, starts_at, ends_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id, created_at);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE booking_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Booking Resources Policies
CREATE POLICY "booking_resources_select" ON booking_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "booking_resources_insert" ON booking_resources FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "booking_resources_update" ON booking_resources FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Bookings Policies
CREATE POLICY "bookings_select" ON bookings FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM booking_resources 
        WHERE id = bookings.resource_id 
        AND created_by = auth.uid()
    )
);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bookings_delete" ON bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tracking Entities Policies
CREATE POLICY "tracking_entities_select" ON tracking_entities FOR SELECT TO authenticated USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "tracking_entities_insert" ON tracking_entities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tracking_entities_update" ON tracking_entities FOR UPDATE TO authenticated USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Tracking Events Policies
CREATE POLICY "tracking_events_select" ON tracking_events FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM tracking_entities 
        WHERE id = tracking_events.entity_id 
        AND (created_by = auth.uid() OR assigned_to = auth.uid())
    )
);
CREATE POLICY "tracking_events_insert" ON tracking_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User Notifications Policies
CREATE POLICY "user_notifications_select" ON user_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_notifications_update" ON user_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_notifications_delete" ON user_notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notification Preferences Policies
CREATE POLICY "notification_preferences_all" ON notification_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- System Announcements Policies
CREATE POLICY "system_announcements_select" ON system_announcements FOR SELECT TO authenticated USING (
    is_active = true AND 
    (starts_at IS NULL OR starts_at <= NOW()) AND 
    (ends_at IS NULL OR ends_at >= NOW()) AND
    (
        target_audience = 'all' OR
        (target_audience = 'users' AND EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())) OR
        (target_audience = 'admins' AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) OR
        (target_audience = 'specific' AND target_user_ids ? auth.uid()::text)
    )
);

-- =====================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_booking_resources_updated_at BEFORE UPDATE ON booking_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracking_entities_updated_at BEFORE UPDATE ON tracking_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_tracking_updated_at BEFORE UPDATE ON delivery_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create automatic notifications
CREATE OR REPLACE FUNCTION create_automatic_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_category TEXT;
BEGIN
    -- Determine notification content based on table and operation
    IF TG_TABLE_NAME = 'tracking_entities' THEN
        notification_category := 'project';
        IF TG_OP = 'INSERT' THEN
            notification_title := 'New ' || NEW.type || ' Created';
            notification_message := 'A new ' || NEW.type || ' "' || NEW.name || '" has been created and assigned to you.';
        ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
            notification_title := NEW.type || ' Status Updated';
            notification_message := 'The status of "' || NEW.name || '" has been changed from ' || OLD.status || ' to ' || NEW.status || '.';
        END IF;
        
        -- Create notification for assigned user
        IF NEW.assigned_to IS NOT NULL AND notification_title IS NOT NULL THEN
            INSERT INTO user_notifications (
                user_id, type, title, message, category, 
                related_entity_type, related_entity_id, metadata
            ) VALUES (
                NEW.assigned_to, 'info', notification_title, notification_message, notification_category,
                NEW.type, NEW.id, jsonb_build_object('entity_name', NEW.name, 'old_status', OLD.status, 'new_status', NEW.status)
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply automatic notification trigger
CREATE TRIGGER tracking_entities_notification AFTER INSERT OR UPDATE ON tracking_entities FOR EACH ROW EXECUTE FUNCTION create_automatic_notification();

-- =====================================================
-- 8. INITIAL DATA SETUP
-- =====================================================

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample booking resources
INSERT INTO booking_resources (name, type, description, capacity, location, amenities, hourly_rate, created_by) VALUES
('Conference Room A', 'meeting_room', 'Large conference room with video conferencing capabilities', 12, 'Floor 3, West Wing', '["Projector", "Whiteboard", "Video Conferencing", "WiFi"]', 50.00, (SELECT id FROM auth.users LIMIT 1)),
('Executive Boardroom', 'meeting_room', 'Premium boardroom for executive meetings', 8, 'Floor 5, Executive Suite', '["4K Display", "Premium Audio", "Coffee Station", "WiFi"]', 100.00, (SELECT id FROM auth.users LIMIT 1)),
('Company Van', 'vehicle', 'Transportation for business trips and client visits', 8, 'Parking Garage Level 1', '["GPS", "Air Conditioning", "First Aid Kit"]', 25.00, (SELECT id FROM auth.users LIMIT 1)),
('Presentation Equipment', 'equipment', 'Portable presentation setup for external meetings', 1, 'Equipment Storage', '["Portable Projector", "Laptop", "Cables", "Remote"]', 15.00, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert sample system announcement
INSERT INTO system_announcements (title, message, type, priority, target_audience, created_by) VALUES
('Welcome to Advanced Contract Management System', 'We have upgraded to Phase 4 with advanced booking, tracking, and notification features. Explore the new capabilities!', 'info', 'medium', 'all', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

COMMIT;
