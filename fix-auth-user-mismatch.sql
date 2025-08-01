-- Fix Authentication User Mismatch
-- This script fixes the mismatch between Supabase Auth users and custom users table

-- ========================================
-- PART 1: CLEAN UP EXISTING DATA
-- ========================================

-- First, let's see what we have
SELECT 'Current auth.users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Current users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Current profiles table count:' as info, COUNT(*) as count FROM profiles;

-- ========================================
-- PART 2: FIX USERS TABLE STRUCTURE
-- ========================================

-- Drop and recreate users table to match auth.users structure
DROP TABLE IF EXISTS users CASCADE;

-- Create users table that properly links to auth.users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ========================================
-- PART 3: SYNC AUTH USERS TO USERS TABLE
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
WHERE au.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = COALESCE(EXCLUDED.role, users.role),
    status = EXCLUDED.status,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- ========================================
-- PART 4: CREATE ADMIN USER IF NOT EXISTS
-- ========================================

-- Check if admin user exists in auth.users
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin email exists in auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'luxsess2001@gmail.com';
    
    -- If admin user doesn't exist in auth.users, create it
    IF admin_user_id IS NULL THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin
        ) VALUES (
            gen_random_uuid(),
            'luxsess2001@gmail.com',
            crypt('TestPassword123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "Admin User", "role": "admin"}'::jsonb,
            true
        );
        
        -- Get the newly created admin user ID
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = 'luxsess2001@gmail.com';
    END IF;
    
    -- Ensure admin user exists in users table
    INSERT INTO users (id, email, full_name, role, status, email_verified)
    VALUES (
        admin_user_id,
        'luxsess2001@gmail.com',
        'Admin User',
        'admin',
        'active',
        true
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        status = 'active',
        email_verified = true,
        updated_at = NOW();
END $$;

-- ========================================
-- PART 5: FIX PROFILES TABLE
-- ========================================

-- Drop and recreate profiles table for compatibility
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Sync users to profiles table
INSERT INTO profiles (id, email, full_name, role, status, created_at)
SELECT id, email, full_name, role, status, created_at
FROM users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ========================================
-- PART 6: SET UP RLS POLICIES
-- ========================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Create permissive policies for development
CREATE POLICY "Authenticated users can view users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- PART 7: GRANT PERMISSIONS
-- ========================================

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ========================================
-- PART 8: VERIFICATION QUERIES
-- ========================================

-- Verify the setup
SELECT 'Auth users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Profiles table count:' as info, COUNT(*) as count FROM profiles;

-- Check admin user
SELECT 'Admin user in auth.users:' as info, email, created_at FROM auth.users WHERE email = 'luxsess2001@gmail.com';
SELECT 'Admin user in users table:' as info, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';
SELECT 'Admin user in profiles table:' as info, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- Check table structure
SELECT 'Users table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS policies on users:' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'; 