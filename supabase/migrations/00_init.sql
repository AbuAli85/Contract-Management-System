-- Migration: Initial schema setup with RLS policies
-- Description: Creates all core tables with proper relationships, RLS policies, and indexes
-- Date: 2025-01-17

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'provider', 'manager', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_status AS ENUM ('active', 'inactive', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'system', 'marketing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address JSONB,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT profiles_user_id_unique UNIQUE (user_id),
    CONSTRAINT profiles_email_unique UNIQUE (email)
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address JSONB,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT companies_slug_unique UNIQUE (slug)
);

-- Create user_roles table (junction table for many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'client',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(user_id),
    
    -- A user can have only one role per company
    CONSTRAINT user_roles_user_company_unique UNIQUE (user_id, company_id)
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price_base DECIMAL(10,2),
    price_currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER,
    max_participants INTEGER DEFAULT 1,
    status service_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
    provider_company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    status booking_status DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    participant_count INTEGER DEFAULT 1,
    total_price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    client_notes TEXT,
    provider_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure scheduled time is in the future (at creation)
    CONSTRAINT bookings_future_schedule CHECK (scheduled_at > created_at)
);

-- Create booking_events table (audit trail for booking changes)
CREATE TABLE IF NOT EXISTS booking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'status_change', 'reschedule', 'note_added', etc.
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    created_by UUID REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for companies
DROP POLICY IF EXISTS "Company members can view company" ON companies;
CREATE POLICY "Company members can view company" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Company admins can update company" ON companies;
CREATE POLICY "Company admins can update company" ON companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
        )
    );

-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Company admins can manage roles" ON user_roles;
CREATE POLICY "Company admins can manage roles" ON user_roles
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
        )
    );

-- RLS Policies for services
DROP POLICY IF EXISTS "Public can view active services" ON services;
CREATE POLICY "Public can view active services" ON services
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Company members can CRUD services" ON services;
CREATE POLICY "Company members can CRUD services" ON services
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('provider', 'manager', 'admin') 
            AND is_active = true
        )
    );

-- RLS Policies for bookings
DROP POLICY IF EXISTS "Clients can insert their own bookings" ON bookings;
CREATE POLICY "Clients can insert their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Provider companies can update bookings" ON bookings;
CREATE POLICY "Provider companies can update bookings" ON bookings
    FOR UPDATE USING (
        provider_company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('provider', 'manager', 'admin') 
            AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Related users can select bookings" ON bookings;
CREATE POLICY "Related users can select bookings" ON bookings
    FOR SELECT USING (
        auth.uid() = client_id OR
        provider_company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policies for booking_events
DROP POLICY IF EXISTS "Related users can view booking events" ON booking_events;
CREATE POLICY "Related users can view booking events" ON booking_events
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM bookings 
            WHERE client_id = auth.uid() OR
            provider_company_id IN (
                SELECT company_id FROM user_roles 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "Related users can insert booking events" ON booking_events;
CREATE POLICY "Related users can insert booking events" ON booking_events
    FOR INSERT WITH CHECK (
        booking_id IN (
            SELECT id FROM bookings 
            WHERE client_id = auth.uid() OR
            provider_company_id IN (
                SELECT company_id FROM user_roles 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, company_id, is_active);

CREATE INDEX IF NOT EXISTS idx_services_company_id ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_name_trgm ON services USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_company_id ON bookings(provider_company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON booking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_created_at ON booking_events(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create helpful views
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    ur.user_id,
    ur.company_id,
    c.name as company_name,
    ur.role,
    ur.permissions,
    ur.is_active,
    p.email,
    p.full_name
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.user_id
JOIN companies c ON ur.company_id = c.id
WHERE ur.is_active = true;

-- Create function to get user role for a company
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID, company_uuid UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM user_roles 
        WHERE user_id = user_uuid 
        AND company_id = company_uuid 
        AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    user_uuid UUID, 
    company_uuid UUID, 
    required_roles user_role[]
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid 
        AND company_id = company_uuid 
        AND role = ANY(required_roles)
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create automatic profile creation trigger
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE companies IS 'Companies that provide services';
COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and companies with roles';
COMMENT ON TABLE services IS 'Services offered by companies';
COMMENT ON TABLE bookings IS 'Service bookings made by clients';
COMMENT ON TABLE booking_events IS 'Audit trail for booking changes';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE audit_logs IS 'System-wide audit logs';

COMMENT ON COLUMN bookings.scheduled_at IS 'When the service is scheduled to occur';
COMMENT ON COLUMN bookings.duration_minutes IS 'Duration of the booked service in minutes';
COMMENT ON COLUMN services.duration_minutes IS 'Default duration for this service in minutes';
COMMENT ON COLUMN services.max_participants IS 'Maximum number of participants for this service';