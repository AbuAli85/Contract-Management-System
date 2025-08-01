-- Fix RBAC with Permissive RLS Policies
-- Run this in Supabase SQL Editor

-- 1. Drop all existing RLS policies
DROP POLICY IF EXISTS "Allow all authenticated users" ON users;
DROP POLICY IF EXISTS "Allow all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 2. Create very permissive policies for development
CREATE POLICY "Allow all operations for authenticated users" ON users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Create admin user in users table
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

-- 4. Create admin user in profiles table
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

-- 5. Verify the fix
SELECT 'Admin user in users table:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';
SELECT 'Admin user in profiles table:' as info, id, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- 6. Show table counts
SELECT 'Users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Profiles table count:' as info, COUNT(*) as count FROM profiles; 