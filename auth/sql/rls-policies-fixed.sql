-- Row Level Security (RLS) Policies for Authentication System
-- Fixed version for Supabase execution

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