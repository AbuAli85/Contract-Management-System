-- Migration: Enforce RLS Policies for Profiles and Auth Tables
-- Date: 2025-07-29
-- Description: Implements comprehensive RLS policies for user data security

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Admin policies for profiles (assuming admin role exists)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own user record" ON users;
DROP POLICY IF EXISTS "Users can update own user record" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can view own user record" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own user record" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin policies for users table
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert users" ON users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Enable RLS on auth_sessions table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth_sessions') THEN
        ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own sessions" ON auth_sessions;
        DROP POLICY IF EXISTS "Users can delete own sessions" ON auth_sessions;
        
        -- Create policies for auth_sessions
        CREATE POLICY "Users can view own sessions" ON auth_sessions
            FOR SELECT
            USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete own sessions" ON auth_sessions
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on user_sessions table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
        DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
        DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;
        
        -- Create policies for user_sessions
        CREATE POLICY "Users can view own sessions" ON user_sessions
            FOR SELECT
            USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can update own sessions" ON user_sessions
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete own sessions" ON user_sessions
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on user_roles table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
        DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
        
        -- Create policies for user_roles
        CREATE POLICY "Users can view own roles" ON user_roles
            FOR SELECT
            USING (auth.uid() = user_id);
            
        CREATE POLICY "Admins can manage all roles" ON user_roles
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'super_admin')
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

-- Enable RLS on user_permissions table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_permissions') THEN
        ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
        DROP POLICY IF EXISTS "Admins can manage all permissions" ON user_permissions;
        
        -- Create policies for user_permissions
        CREATE POLICY "Users can view own permissions" ON user_permissions
            FOR SELECT
            USING (auth.uid() = user_id);
            
        CREATE POLICY "Admins can manage all permissions" ON user_permissions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'super_admin')
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE users.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = auth.uid() 
        AND p.name = permission_name
    ) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(TEXT) TO authenticated;

-- Create indexes for better performance on auth-related queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profile information with RLS enforced';
COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON FUNCTION is_admin() IS 'Check if current user has admin role';
COMMENT ON FUNCTION is_super_admin() IS 'Check if current user has super admin role';
COMMENT ON FUNCTION get_user_role() IS 'Get current user role';
COMMENT ON FUNCTION has_permission(TEXT) IS 'Check if current user has specific permission';