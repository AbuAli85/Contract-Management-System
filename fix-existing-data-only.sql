-- Fix Existing Data Only (No Table Drops)
-- This script fixes authentication issues without dropping existing tables

-- ========================================
-- PART 1: CHECK CURRENT STATE
-- ========================================

-- Check current data
SELECT 'Current auth.users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Current users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Current profiles table count:' as info, COUNT(*) as count FROM profiles;

-- Check admin user
SELECT 'Admin user in users:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';
SELECT 'Admin user in profiles:' as info, id, email, role, status FROM profiles WHERE email = 'luxsess2001@gmail.com';

-- ========================================
-- PART 2: SYNC AUTH USERS TO USERS TABLE
-- ========================================

-- Insert missing auth users into users table
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
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = COALESCE(EXCLUDED.role, users.role),
    status = EXCLUDED.status,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- ========================================
-- PART 3: ENSURE ADMIN USER EXISTS
-- ========================================

-- Check if admin user exists and update/create as needed
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
        
        RAISE NOTICE 'Admin user created with ID: 550e8400-e29b-41d4-a716-446655440000';
    END IF;
END $$;

-- ========================================
-- PART 4: SYNC TO PROFILES TABLE
-- ========================================

-- Insert missing users into profiles table
INSERT INTO profiles (id, email, full_name, role, status, created_at)
SELECT id, email, full_name, role, status, created_at
FROM users
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = users.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Ensure admin user exists in profiles
DO $$
DECLARE
    admin_profile_exists BOOLEAN;
    admin_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE email = 'luxsess2001@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Check if admin profile exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE id = admin_user_id) INTO admin_profile_exists;
        
        IF admin_profile_exists THEN
            -- Update existing admin profile
            UPDATE profiles 
            SET role = 'admin', 
                status = 'active',
                updated_at = NOW()
            WHERE id = admin_user_id;
            
            RAISE NOTICE 'Admin profile updated';
        ELSE
            -- Create new admin profile
            INSERT INTO profiles (id, email, full_name, role, status, created_at)
            SELECT id, email, full_name, role, status, created_at
            FROM users
            WHERE email = 'luxsess2001@gmail.com';
            
            RAISE NOTICE 'Admin profile created';
        END IF;
    END IF;
END $$;

-- ========================================
-- PART 5: SET UP PERMISSIVE RLS
-- ========================================

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Create very permissive policies for development
CREATE POLICY "Enable select for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON users
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON users
    FOR DELETE USING (auth.role() = 'authenticated');

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all users" ON profiles;
DROP POLICY IF EXISTS "Admins can update all users" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

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

-- Check RLS policies
SELECT 'RLS policies on users:' as info;
SELECT policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'; 