-- Final Authentication Fix - Comprehensive
-- This script ensures admin user exists and all authentication works

-- ========================================
-- PART 1: CHECK CURRENT STATE
-- ========================================

-- Check current data
SELECT 'Current auth.users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Current users table count:' as info, COUNT(*) as count FROM users;

-- Check if profiles table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
        THEN 'Profiles table exists'
        ELSE 'Profiles table does not exist'
    END as profiles_status;

-- Check admin user in users table
SELECT 'Admin user in users:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';

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
-- PART 4: SYNC OTHER AUTH USERS
-- ========================================

-- Insert other auth users into users table
INSERT INTO users (id, email, full_name, role, status, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
    COALESCE(au.raw_user_meta_data->>'role', 'user') as role,
    CASE 
        WHEN au.confirmed_at IS NOT NULL THEN 'active'
        ELSE 'pending'
    END as status,
    au.created_at
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != 'luxsess2001@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = COALESCE(EXCLUDED.role, users.role),
    status = EXCLUDED.status,
    updated_at = NOW();

-- Insert other users into profiles table
INSERT INTO profiles (id, email, full_name, role, status, created_at)
SELECT id, email, full_name, role, status, created_at
FROM users
WHERE email != 'luxsess2001@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = users.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ========================================
-- PART 5: SET UP RLS POLICIES
-- ========================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable select for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON users;

-- Create permissive policies
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

-- Create permissive policies for profiles
CREATE POLICY "Enable select for authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON profiles
    FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- PART 6: GRANT PERMISSIONS
-- ========================================

-- Grant all permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ========================================
-- PART 7: VERIFICATION
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