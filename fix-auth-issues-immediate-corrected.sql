-- Immediate Fix for Authentication Issues (CORRECTED)
-- This script addresses the specific 406, 400, and 404 errors
-- Handles existing data to avoid duplicate key violations

-- ========================================
-- PART 1: CHECK EXISTING DATA
-- ========================================

-- First, let's see what we have
SELECT 'Current auth.users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Current users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Current profiles table count:' as info, COUNT(*) as count FROM profiles;

-- Check if admin user already exists
SELECT 'Admin user check in users:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';
SELECT 'Admin user check in profiles:' as info, id, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- ========================================
-- PART 2: CLEAN UP EXISTING DATA
-- ========================================

-- Drop all existing user tables to start fresh
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- ========================================
-- PART 3: CREATE SIMPLE USERS TABLE
-- ========================================

-- Create a simple users table that matches auth.users exactly
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    avatar_url TEXT,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    permissions TEXT[],
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ========================================
-- PART 4: CREATE SIMPLE PROFILES TABLE
-- ========================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ========================================
-- PART 5: SYNC EXISTING AUTH USERS
-- ========================================

-- Insert all existing auth users into the users table
INSERT INTO users (id, email, full_name, role, status, email_verified, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
    COALESCE(au.raw_user_meta_data->>'role', 'user') as role,
    CASE 
        WHEN au.confirmed_at IS NOT NULL THEN 'active'
        ELSE 'pending'
    END as status,
    au.confirmed_at IS NOT NULL as email_verified,
    au.created_at
FROM auth.users au
WHERE au.email IS NOT NULL;

-- Sync to profiles table
INSERT INTO profiles (id, email, full_name, role, status, created_at)
SELECT id, email, full_name, role, status, created_at
FROM users;

-- ========================================
-- PART 6: ENSURE ADMIN USER EXISTS
-- ========================================

-- Check if admin user exists in users table
DO $$
DECLARE
    admin_exists BOOLEAN;
    admin_id UUID;
BEGIN
    -- Check if admin email exists
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'luxsess2001@gmail.com') INTO admin_exists;
    
    IF admin_exists THEN
        -- Update existing admin user to ensure correct role
        UPDATE users 
        SET role = 'admin', 
            status = 'active', 
            email_verified = true,
            updated_at = NOW()
        WHERE email = 'luxsess2001@gmail.com';
        
        -- Get the admin user ID
        SELECT id INTO admin_id FROM users WHERE email = 'luxsess2001@gmail.com';
        
        -- Update profiles table too
        UPDATE profiles 
        SET role = 'admin', 
            status = 'active',
            updated_at = NOW()
        WHERE email = 'luxsess2001@gmail.com';
        
        RAISE NOTICE 'Admin user updated with ID: %', admin_id;
    ELSE
        -- Create new admin user with a known UUID
        INSERT INTO users (id, email, full_name, role, status, email_verified, created_at)
        VALUES (
            '550e8400-e29b-41d4-a716-446655440000', -- Fixed UUID for admin
            'luxsess2001@gmail.com',
            'Admin User',
            'admin',
            'active',
            true,
            NOW()
        );
        
        -- Also insert into profiles
        INSERT INTO profiles (id, email, full_name, role, status, created_at)
        VALUES (
            '550e8400-e29b-41d4-a716-446655440000', -- Same UUID as users
            'luxsess2001@gmail.com',
            'Admin User',
            'admin',
            'active',
            NOW()
        );
        
        RAISE NOTICE 'Admin user created with ID: 550e8400-e29b-41d4-a716-446655440000';
    END IF;
END $$;

-- ========================================
-- PART 7: SET UP PERMISSIVE RLS
-- ========================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;
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

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all users" ON profiles;
DROP POLICY IF EXISTS "Admins can update all users" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
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
-- PART 8: GRANT PERMISSIONS
-- ========================================

-- Grant all permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ========================================
-- PART 9: VERIFICATION
-- ========================================

-- Check what we have
SELECT 'Auth users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Profiles table count:' as info, COUNT(*) as count FROM profiles;

-- Check admin user
SELECT 'Admin user in users:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';
SELECT 'Admin user in profiles:' as info, id, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- Check table structure
SELECT 'Users table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS policies on users:' as info;
SELECT policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'; 