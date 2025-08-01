-- Fix Authentication - Bypass RLS
-- This script temporarily disables RLS to create admin user

-- ========================================
-- PART 1: TEMPORARILY DISABLE RLS
-- ========================================

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 2: CREATE PROFILES TABLE IF MISSING
-- ========================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ========================================
-- PART 3: FORCE CREATE ADMIN USER
-- ========================================

-- Delete any existing admin user to avoid conflicts
DELETE FROM users WHERE email = 'luxsess2001@gmail.com';
DELETE FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- Create admin user with fixed UUID
INSERT INTO users (id, email, full_name, role, status, created_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'luxsess2001@gmail.com',
    'Admin User',
    'admin',
    'active',
    NOW()
);

-- Create admin profile
INSERT INTO profiles (id, email, full_name, role, status, created_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'luxsess2001@gmail.com',
    'Admin User',
    'admin',
    'active',
    NOW()
);

-- ========================================
-- PART 4: RE-ENABLE RLS WITH PERMISSIVE POLICIES
-- ========================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable select for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON users;

-- Create very permissive policies for development
CREATE POLICY "Enable select for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON users
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON users
    FOR DELETE USING (auth.role() = 'authenticated');

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Enable select for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON profiles;

-- Create very permissive policies for profiles
CREATE POLICY "Enable select for authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON profiles
    FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- PART 5: GRANT PERMISSIONS
-- ========================================

-- Grant all permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ========================================
-- PART 6: VERIFICATION
-- ========================================

-- Check final state
SELECT 'Final auth.users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Final users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Final profiles table count:' as info, COUNT(*) as count FROM profiles;

-- Check admin user
SELECT 'Final admin user in users:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';
SELECT 'Final admin user in profiles:' as info, id, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- Check all users
SELECT 'All users:' as info, id, email, role, status, created_at FROM users ORDER BY created_at;

-- Check RLS policies
SELECT 'RLS policies on users:' as info;
SELECT policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'; 