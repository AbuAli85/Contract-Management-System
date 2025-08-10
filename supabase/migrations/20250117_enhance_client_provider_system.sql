-- Enhanced Client/Provider System Migration
-- Description: Extends existing system with client/provider functionality
-- Date: 2025-01-17
-- Maintains backward compatibility while adding new features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enhanced enums
DO $$ BEGIN
    CREATE TYPE enhanced_user_role AS ENUM ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_status AS ENUM ('active', 'inactive', 'draft', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE company_type AS ENUM ('individual', 'small_business', 'enterprise', 'non_profit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create companies table (service providers)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address JSONB DEFAULT '{}',
    business_type company_type DEFAULT 'small_business',
    registration_number TEXT,
    tax_number TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    lower_email TEXT GENERATED ALWAYS AS (LOWER(email)) STORED,
    
    CONSTRAINT companies_slug_unique UNIQUE (slug),
    CONSTRAINT companies_email_unique UNIQUE (email) WHERE email IS NOT NULL,
    CONSTRAINT companies_lower_email_unique UNIQUE (lower_email) WHERE lower_email IS NOT NULL
);

-- Enhance existing users table for client/provider roles
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'individual' CHECK (user_type IN ('individual', 'business'));
    ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS business_settings JSONB DEFAULT '{}';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create services table for providers
CREATE TABLE IF NOT EXISTS provider_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    price_base DECIMAL(10,2),
    price_currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER DEFAULT 60,
    max_participants INTEGER DEFAULT 1,
    min_advance_booking_hours INTEGER DEFAULT 24,
    max_advance_booking_days INTEGER DEFAULT 90,
    status service_status DEFAULT 'active',
    is_online_service BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    cancellation_policy TEXT,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    availability_schedule JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT provider_services_positive_price CHECK (price_base >= 0),
    CONSTRAINT provider_services_positive_duration CHECK (duration_minutes > 0)
);

-- Enhance existing bookings table
DO $$ BEGIN
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_number TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_start TIMESTAMPTZ;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_end TIMESTAMPTZ;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_notes TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_notes TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_metadata JSONB DEFAULT '{}';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_pattern JSONB;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create booking events table (audit trail)
CREATE TABLE IF NOT EXISTS booking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    created_by UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service reviews table
CREATE TABLE IF NOT EXISTS service_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_public BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    response_text TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create provider availability table
CREATE TABLE IF NOT EXISTS provider_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    timezone TEXT DEFAULT 'UTC',
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT availability_time_order CHECK (start_time < end_time)
);

-- Create provider time blocks (for exceptions)
CREATE TABLE IF NOT EXISTS provider_time_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    block_type TEXT NOT NULL CHECK (block_type IN ('unavailable', 'blocked', 'maintenance')),
    reason TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT time_block_order CHECK (start_datetime < end_datetime)
);

-- Create client favorites table
CREATE TABLE IF NOT EXISTS client_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES provider_services(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_client_service_favorite UNIQUE (client_id, service_id),
    CONSTRAINT unique_client_provider_favorite UNIQUE (client_id, provider_id)
);

-- Create notifications table (enhanced)
CREATE TABLE IF NOT EXISTS enhanced_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMPTZ,
    action_url TEXT,
    action_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_provider_services_updated_at ON provider_services;
CREATE TRIGGER update_provider_services_updated_at
    BEFORE UPDATE ON provider_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_reviews_updated_at ON service_reviews;
CREATE TRIGGER update_service_reviews_updated_at
    BEFORE UPDATE ON service_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Generate booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL THEN
        NEW.booking_number = 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS generate_booking_number_trigger ON bookings;
CREATE TRIGGER generate_booking_number_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_number();

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
DROP POLICY IF EXISTS "Company visibility policy" ON companies;
CREATE POLICY "Company visibility policy" ON companies
    FOR SELECT USING (
        is_active = true OR 
        created_by = auth.uid() OR
        id IN (SELECT company_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Company management policy" ON companies;
CREATE POLICY "Company management policy" ON companies
    FOR ALL USING (
        created_by = auth.uid() OR
        id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- RLS Policies for provider services
DROP POLICY IF EXISTS "Public service visibility" ON provider_services;
CREATE POLICY "Public service visibility" ON provider_services
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Provider service management" ON provider_services;
CREATE POLICY "Provider service management" ON provider_services
    FOR ALL USING (
        provider_id = auth.uid() OR
        company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- RLS Policies for enhanced bookings
DROP POLICY IF EXISTS "Booking visibility policy" ON bookings;
CREATE POLICY "Booking visibility policy" ON bookings
    FOR SELECT USING (
        client_id = auth.uid() OR
        provider_id = auth.uid() OR
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "Client booking creation" ON bookings;
CREATE POLICY "Client booking creation" ON bookings
    FOR INSERT WITH CHECK (
        client_id = auth.uid() OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Booking update policy" ON bookings;
CREATE POLICY "Booking update policy" ON bookings
    FOR UPDATE USING (
        client_id = auth.uid() OR
        provider_id = auth.uid() OR
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- RLS Policies for service reviews
DROP POLICY IF EXISTS "Review visibility policy" ON service_reviews;
CREATE POLICY "Review visibility policy" ON service_reviews
    FOR SELECT USING (
        is_public = true OR
        client_id = auth.uid() OR
        provider_id = auth.uid()
    );

DROP POLICY IF EXISTS "Client review creation" ON service_reviews;
CREATE POLICY "Client review creation" ON service_reviews
    FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Review management policy" ON service_reviews;
CREATE POLICY "Review management policy" ON service_reviews
    FOR UPDATE USING (
        client_id = auth.uid() OR
        provider_id = auth.uid()
    );

-- RLS Policies for provider availability
DROP POLICY IF EXISTS "Availability visibility policy" ON provider_availability;
CREATE POLICY "Availability visibility policy" ON provider_availability
    FOR SELECT USING (
        provider_id = auth.uid() OR
        EXISTS (SELECT 1 FROM provider_services WHERE provider_id = provider_availability.provider_id AND status = 'active')
    );

DROP POLICY IF EXISTS "Provider availability management" ON provider_availability;
CREATE POLICY "Provider availability management" ON provider_availability
    FOR ALL USING (provider_id = auth.uid());

-- RLS Policies for time blocks
DROP POLICY IF EXISTS "Time block management" ON provider_time_blocks;
CREATE POLICY "Time block management" ON provider_time_blocks
    FOR ALL USING (provider_id = auth.uid());

-- RLS Policies for client favorites
DROP POLICY IF EXISTS "Client favorites management" ON client_favorites;
CREATE POLICY "Client favorites management" ON client_favorites
    FOR ALL USING (client_id = auth.uid());

-- RLS Policies for notifications
DROP POLICY IF EXISTS "User notifications policy" ON enhanced_notifications;
CREATE POLICY "User notifications policy" ON enhanced_notifications
    FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role_company ON users(role, company_id);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_company ON provider_services(company_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_status ON provider_services(status);
CREATE INDEX IF NOT EXISTS idx_provider_services_category ON provider_services(category);
CREATE INDEX IF NOT EXISTS idx_provider_services_name_trgm ON provider_services USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_start ON bookings(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking ON booking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_created_at ON booking_events(created_at);

CREATE INDEX IF NOT EXISTS idx_service_reviews_service ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_client ON service_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_provider ON service_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_public ON service_reviews(is_public, rating);

CREATE INDEX IF NOT EXISTS idx_provider_availability_provider ON provider_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_service ON provider_availability(service_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_day ON provider_availability(day_of_week, is_available);

CREATE INDEX IF NOT EXISTS idx_provider_time_blocks_provider ON provider_time_blocks(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_time_blocks_datetime ON provider_time_blocks(start_datetime, end_datetime);

CREATE INDEX IF NOT EXISTS idx_client_favorites_client ON client_favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_client_favorites_service ON client_favorites(service_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_notifications_user ON enhanced_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_notifications_read ON enhanced_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_enhanced_notifications_created_at ON enhanced_notifications(created_at);

-- Create helpful views
CREATE OR REPLACE VIEW provider_dashboard_stats AS
SELECT 
    p.id as provider_id,
    p.full_name as provider_name,
    COUNT(DISTINCT s.id) as total_services,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_services,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price END), 0) as total_revenue
FROM users p
LEFT JOIN provider_services s ON s.provider_id = p.id
LEFT JOIN bookings b ON b.provider_id = p.id
LEFT JOIN service_reviews r ON r.provider_id = p.id
WHERE p.role IN ('provider', 'admin')
GROUP BY p.id, p.full_name;

CREATE OR REPLACE VIEW client_dashboard_stats AS
SELECT 
    c.id as client_id,
    c.full_name as client_name,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as upcoming_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
    COUNT(DISTINCT f.id) as favorite_services,
    COUNT(DISTINCT r.id) as reviews_given,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price END), 0) as total_spent
FROM users c
LEFT JOIN bookings b ON b.client_id = c.id
LEFT JOIN client_favorites f ON f.client_id = c.id
LEFT JOIN service_reviews r ON r.client_id = c.id
WHERE c.role IN ('client', 'user', 'admin')
GROUP BY c.id, c.full_name;

-- Create utility functions
CREATE OR REPLACE FUNCTION get_available_time_slots(
    provider_uuid UUID,
    service_uuid UUID,
    target_date DATE,
    timezone_name TEXT DEFAULT 'UTC'
)
RETURNS TABLE(start_time TIMESTAMPTZ, end_time TIMESTAMPTZ) AS $$
DECLARE
    service_duration INTEGER;
    day_of_week INTEGER;
BEGIN
    -- Get service duration
    SELECT duration_minutes INTO service_duration
    FROM provider_services
    WHERE id = service_uuid AND provider_id = provider_uuid;
    
    IF service_duration IS NULL THEN
        RETURN;
    END IF;
    
    -- Get day of week (0 = Sunday, 6 = Saturday)
    day_of_week := EXTRACT(DOW FROM target_date);
    
    -- Return available slots
    RETURN QUERY
    WITH availability_slots AS (
        SELECT 
            (target_date + pa.start_time)::TIMESTAMPTZ as slot_start,
            (target_date + pa.start_time + (service_duration * INTERVAL '1 minute'))::TIMESTAMPTZ as slot_end
        FROM provider_availability pa
        WHERE pa.provider_id = provider_uuid
        AND pa.day_of_week = day_of_week
        AND pa.is_available = true
        AND (pa.effective_from IS NULL OR pa.effective_from <= target_date)
        AND (pa.effective_until IS NULL OR pa.effective_until >= target_date)
    )
    SELECT slot_start, slot_end
    FROM availability_slots a
    WHERE NOT EXISTS (
        -- Check for existing bookings
        SELECT 1 FROM bookings b
        WHERE b.provider_id = provider_uuid
        AND b.status IN ('confirmed', 'in_progress')
        AND ((b.scheduled_start, b.scheduled_end) OVERLAPS (a.slot_start, a.slot_end))
    )
    AND NOT EXISTS (
        -- Check for time blocks
        SELECT 1 FROM provider_time_blocks tb
        WHERE tb.provider_id = provider_uuid
        AND ((tb.start_datetime, tb.end_datetime) OVERLAPS (a.slot_start, a.slot_end))
    )
    ORDER BY slot_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can book service
CREATE OR REPLACE FUNCTION can_user_book_service(
    user_uuid UUID,
    service_uuid UUID,
    booking_datetime TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
    service_record RECORD;
    advance_hours INTEGER;
    advance_days INTEGER;
BEGIN
    -- Get service details
    SELECT 
        min_advance_booking_hours,
        max_advance_booking_days,
        status,
        requires_approval
    INTO service_record
    FROM provider_services
    WHERE id = service_uuid;
    
    IF service_record IS NULL OR service_record.status != 'active' THEN
        RETURN false;
    END IF;
    
    -- Check advance booking constraints
    advance_hours := EXTRACT(EPOCH FROM (booking_datetime - NOW())) / 3600;
    advance_days := EXTRACT(EPOCH FROM (booking_datetime - NOW())) / 86400;
    
    IF advance_hours < service_record.min_advance_booking_hours THEN
        RETURN false;
    END IF;
    
    IF advance_days > service_record.max_advance_booking_days THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update booking status with validation and audit trail
CREATE OR REPLACE FUNCTION update_booking_status(
    p_id UUID,
    p_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    booking_record RECORD;
    old_status TEXT;
    current_user_id UUID;
BEGIN
    -- Get current user ID from auth context
    current_user_id := auth.uid();
    
    -- Get current booking details
    SELECT 
        b.status,
        b.client_id,
        b.provider_company_id,
        ps.provider_id
    INTO booking_record
    FROM bookings b
    JOIN provider_services ps ON b.service_id = ps.id
    WHERE b.id = p_id;
    
    IF booking_record IS NULL THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;
    
    old_status := booking_record.status;
    
    -- Validate status transition
    IF NOT (
        -- Client can cancel their own pending/confirmed bookings
        (current_user_id = booking_record.client_id AND 
         p_status = 'cancelled' AND 
         old_status IN ('pending', 'confirmed')) OR
        -- Provider can update status for their services
        (current_user_id = booking_record.provider_id AND 
         p_status IN ('confirmed', 'in_progress', 'completed', 'cancelled') AND
         old_status IN ('pending', 'confirmed', 'in_progress')) OR
        -- Admin can make any status change
        (EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = current_user_id 
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        ))
    ) THEN
        RAISE EXCEPTION 'Invalid status transition or insufficient permissions';
    END IF;
    
    -- Update booking status
    UPDATE bookings 
    SET status = p_status::service_booking_status,
        updated_at = NOW()
    WHERE id = p_id;
    
    -- Create audit trail
    INSERT INTO booking_events (
        booking_id,
        event_type,
        old_value,
        new_value,
        description,
        created_by
    ) VALUES (
        p_id,
        'status_change',
        jsonb_build_object('status', old_status),
        jsonb_build_object('status', p_status),
        'Status changed from ' || old_status || ' to ' || p_status,
        current_user_id
    );
    
    -- Create notification for client if status changed by provider
    IF current_user_id != booking_record.client_id AND 
       p_status IN ('confirmed', 'in_progress', 'completed', 'cancelled') THEN
        INSERT INTO enhanced_notifications (
            user_id,
            type,
            title,
            message,
            priority,
            data
        ) VALUES (
            booking_record.client_id,
            'booking_status_change',
            'Booking Status Updated',
            'Your booking status has been updated to: ' || p_status,
            'medium',
            jsonb_build_object(
                'booking_id', p_id,
                'old_status', old_status,
                'new_status', p_status
            )
        );
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create a new booking with validation
CREATE OR REPLACE FUNCTION create_booking(
    p_service_id UUID,
    p_client_id UUID,
    p_scheduled_at TIMESTAMPTZ,
    p_duration_minutes INTEGER DEFAULT NULL,
    p_participant_count INTEGER DEFAULT 1,
    p_total_price DECIMAL(10,2) DEFAULT NULL,
    p_currency TEXT DEFAULT 'USD',
    p_notes TEXT DEFAULT NULL,
    p_client_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    service_record RECORD;
    new_booking_id UUID;
    calculated_duration INTEGER;
    calculated_price DECIMAL(10,2);
    provider_id UUID;
BEGIN
    -- Get current user ID from auth context
    IF auth.uid() != p_client_id THEN
        RAISE EXCEPTION 'Can only create bookings for yourself';
    END IF;
    
    -- Get service details
    SELECT 
        ps.id,
        ps.provider_id,
        ps.duration_minutes,
        ps.price_base,
        ps.price_currency,
        ps.status,
        ps.requires_approval
    INTO service_record
    FROM provider_services ps
    WHERE ps.id = p_service_id;
    
    IF service_record IS NULL THEN
        RAISE EXCEPTION 'Service not found';
    END IF;
    
    IF service_record.status != 'active' THEN
        RAISE EXCEPTION 'Service is not available';
    END IF;
    
    -- Check if user can book this service
    IF NOT can_user_book_service(p_client_id, p_service_id, p_scheduled_at) THEN
        RAISE EXCEPTION 'Cannot book this service at the specified time';
    END IF;
    
    -- Check for conflicts
    IF EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.service_id = p_service_id
        AND b.status IN ('confirmed', 'in_progress')
        AND (
            (b.scheduled_at, b.scheduled_at + (b.duration_minutes * INTERVAL '1 minute')) 
            OVERLAPS 
            (p_scheduled_at, p_scheduled_at + (COALESCE(p_duration_minutes, service_record.duration_minutes) * INTERVAL '1 minute'))
        )
    ) THEN
        RAISE EXCEPTION 'Time slot is not available';
    END IF;
    
    -- Set calculated values
    calculated_duration := COALESCE(p_duration_minutes, service_record.duration_minutes);
    calculated_price := COALESCE(p_total_price, service_record.price_base);
    provider_id := service_record.provider_id;
    
    -- Determine initial status
    DECLARE
        initial_status service_booking_status;
    BEGIN
        IF service_record.requires_approval THEN
            initial_status := 'pending';
        ELSE
            initial_status := 'confirmed';
        END IF;
        
        -- Insert the booking
        INSERT INTO bookings (
            service_id,
            client_id,
            provider_company_id,
            status,
            scheduled_at,
            scheduled_end,
            duration_minutes,
            participant_count,
            total_price,
            currency,
            notes,
            client_notes,
            metadata
        ) VALUES (
            p_service_id,
            p_client_id,
            (SELECT company_id FROM users WHERE id = provider_id),
            initial_status,
            p_scheduled_at,
            p_scheduled_at + (calculated_duration * INTERVAL '1 minute'),
            calculated_duration,
            p_participant_count,
            calculated_price,
            COALESCE(p_currency, service_record.price_currency),
            p_notes,
            p_client_notes,
            jsonb_build_object(
                'created_via', 'rpc',
                'requires_approval', service_record.requires_approval
            )
        ) RETURNING id INTO new_booking_id;
        
        -- Create audit trail
        INSERT INTO booking_events (
            booking_id,
            event_type,
            new_value,
            description,
            created_by
        ) VALUES (
            new_booking_id,
            'booking_created',
            jsonb_build_object(
                'status', initial_status,
                'service_id', p_service_id,
                'scheduled_at', p_scheduled_at
            ),
            'Booking created via RPC',
            p_client_id
        );
        
        -- Create notification for provider if approval required
        IF service_record.requires_approval THEN
            INSERT INTO enhanced_notifications (
                user_id,
                type,
                title,
                message,
                priority,
                data
            ) VALUES (
                provider_id,
                'new_booking_request',
                'New Booking Request',
                'You have a new booking request that requires approval',
                'high',
                jsonb_build_object(
                    'booking_id', new_booking_id,
                    'service_id', p_service_id,
                    'client_id', p_client_id,
                    'scheduled_at', p_scheduled_at
                )
            );
        END IF;
        
        RETURN new_booking_id;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE companies IS 'Service provider companies and business entities';
COMMENT ON TABLE provider_services IS 'Services offered by providers';
COMMENT ON TABLE booking_events IS 'Audit trail for all booking changes';
COMMENT ON TABLE service_reviews IS 'Client reviews and ratings for services';
COMMENT ON TABLE provider_availability IS 'Provider working hours and availability';
COMMENT ON TABLE provider_time_blocks IS 'Provider unavailable time blocks';
COMMENT ON TABLE client_favorites IS 'Client favorite services and providers';
COMMENT ON TABLE enhanced_notifications IS 'Enhanced notification system with priorities';

COMMENT ON FUNCTION get_available_time_slots IS 'Returns available booking time slots for a provider/service on a specific date';
COMMENT ON FUNCTION can_user_book_service IS 'Checks if a user can book a specific service at a given time';
COMMENT ON FUNCTION update_booking_status IS 'Updates booking status with validation, audit trail, and notifications';
COMMENT ON FUNCTION create_booking IS 'Creates a new booking with validation, conflict checking, and proper status handling';