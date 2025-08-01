-- Final RBAC Fix - Ensure Admin User Exists
-- Run this in Supabase SQL Editor

-- 1. Ensure admin user exists in users table
INSERT INTO users (id, email, full_name, role, status, created_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'luxsess2001@gmail.com',
    'Admin User',
    'admin',
    'active',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- 2. Ensure admin user exists in profiles table
INSERT INTO profiles (id, email, full_name, role, status, created_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'luxsess2001@gmail.com',
    'Admin User',
    'admin',
    'active',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- 3. Set permissive RLS policies for development
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create permissive policies for development
CREATE POLICY "Allow all authenticated users" ON users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Verify the fix
SELECT 'Admin user in users table:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';
SELECT 'Admin user in profiles table:' as info, id, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- 5. Show table counts
SELECT 'Users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Profiles table count:' as info, COUNT(*) as count FROM profiles; 