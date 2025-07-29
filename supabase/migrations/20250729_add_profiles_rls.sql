-- Migration: Add RLS policies to profiles table
-- Date: 2025-07-29
-- Description: Tighten RLS policies on profiles table so users can only read/write their own row

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Policy for users to view their own profile only
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile only
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy for users to insert their own profile only
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for admins to view all profiles (optional - remove if not needed)
-- This allows admins to see all user profiles for management purposes
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy for admins to update all profiles (optional - remove if not needed)
-- This allows admins to update user profiles for management purposes
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's own profile
CREATE OR REPLACE FUNCTION get_own_profile()
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.role,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user's own profile
CREATE OR REPLACE FUNCTION update_own_profile(
    p_email TEXT DEFAULT NULL,
    p_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET 
        email = COALESCE(p_email, email),
        role = COALESCE(p_role, role),
        updated_at = NOW()
    WHERE id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance on auth.uid() lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON profiles(id);

-- Add comment to document the RLS policies
COMMENT ON TABLE profiles IS 'User profiles with RLS policies - users can only access their own profile';
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Users can only view their own profile data';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Users can only update their own profile data';
COMMENT ON POLICY "Users can insert own profile" ON profiles IS 'Users can only insert their own profile data';
COMMENT ON POLICY "Admins can view all profiles" ON profiles IS 'Admins can view all user profiles for management';
COMMENT ON POLICY "Admins can update all profiles" ON profiles IS 'Admins can update all user profiles for management';