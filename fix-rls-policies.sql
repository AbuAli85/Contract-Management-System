-- Fix RLS policies for app_users table
-- This script addresses the "new row violates row-level security policy" error

-- First, let's check if RLS is enabled and what policies exist
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'app_users';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'app_users';

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON app_users;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON app_users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON app_users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON app_users;

-- Create more permissive policies for development/testing
-- Policy 1: Allow authenticated users to view all users (for admin interface)
CREATE POLICY "Enable select for authenticated users" ON app_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow authenticated users to insert new users (for user management)
CREATE POLICY "Enable insert for authenticated users" ON app_users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Enable update for own profile" ON app_users
    FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Allow admins to update any user
CREATE POLICY "Enable update for admins" ON app_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy 5: Allow admins to delete users
CREATE POLICY "Enable delete for admins" ON app_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Alternative: If you want to temporarily disable RLS for testing
-- ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Or create a super permissive policy for development
-- CREATE POLICY "Allow all operations for authenticated users" ON app_users
--     FOR ALL USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON app_users TO authenticated;
GRANT USAGE ON SEQUENCE app_users_id_seq TO authenticated;

-- Insert a default admin user if none exists
INSERT INTO app_users (email, role, status, full_name)
SELECT 'admin@example.com', 'admin', 'active', 'System Administrator'
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'admin@example.com');

-- Show the final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY policyname; 