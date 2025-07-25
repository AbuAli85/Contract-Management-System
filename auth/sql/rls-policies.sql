-- Row Level Security (RLS) Policies for Authentication System
-- This file contains all the necessary RLS policies for secure data access

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on permissions table
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_activity_log table
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role and status)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Users cannot change their own role or status
        role = OLD.role AND
        status = OLD.status
    );

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can create users
CREATE POLICY "Admins can create users" ON users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update all users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Managers can view users in their department
CREATE POLICY "Managers can view department users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users manager
            WHERE manager.id = auth.uid() 
            AND manager.role = 'manager'
            AND manager.department = users.department
        )
    );

-- ============================================================================
-- PERMISSIONS TABLE POLICIES
-- ============================================================================

-- Policy: All authenticated users can view permissions
CREATE POLICY "Authenticated users can view permissions" ON permissions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only admins can manage permissions
CREATE POLICY "Admins can manage permissions" ON permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- USER_ACTIVITY_LOG TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON user_activity_log
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: System can insert activity logs
CREATE POLICY "System can insert activity logs" ON user_activity_log
    FOR INSERT
    WITH CHECK (true);

-- Policy: Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON user_activity_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- AUTHENTICATION TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        COALESCE(NEW.raw_user_meta_data->>'status', 'pending'),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_login timestamp
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET last_login = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.update_last_login();

-- ============================================================================
-- HELPER FUNCTIONS FOR ROLE AND PERMISSION CHECKING
-- ============================================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role VARCHAR, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = required_role
        FROM public.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the required roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles VARCHAR[], user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = ANY(required_roles)
        FROM public.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(required_permission VARCHAR, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT required_permission = ANY(permissions)
        FROM public.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the required permissions
CREATE OR REPLACE FUNCTION public.has_any_permission(required_permissions VARCHAR[], user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS (
            SELECT 1 
            FROM unnest(required_permissions) AS perm
            WHERE perm = ANY(permissions)
        )
        FROM public.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DEFAULT USER CREATION
-- ============================================================================

-- Insert default admin user (you should change this password)
-- This is only for initial setup - remove after first admin is created
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "System Administrator", "role": "admin", "status": "active"}'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- GRANTS FOR AUTHENTICATED USERS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.user_activity_log TO authenticated;
GRANT INSERT ON public.user_activity_log TO authenticated;

-- Grant permissions to service role (for admin operations)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.user_activity_log TO service_role; 