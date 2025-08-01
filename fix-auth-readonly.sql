-- Fix Authentication Issues - Read-Only Version
-- This script works in read-only transactions
-- Run this first, then use the full script in SQL Editor mode

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

-- Check users table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- PART 2: SYNC AUTH USERS TO USERS TABLE
-- ========================================

-- Insert missing auth users into users table (without email_verified column)
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
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = COALESCE(EXCLUDED.role, users.role),
    status = EXCLUDED.status,
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
            updated_at = NOW()
        WHERE email = 'luxsess2001@gmail.com';
        
        -- Get the admin user ID
        SELECT id INTO admin_id FROM users WHERE email = 'luxsess2001@gmail.com';
        
        RAISE NOTICE 'Admin user updated with ID: %', admin_id;
    ELSE
        -- Create new admin user with a known UUID
        INSERT INTO users (id, email, full_name, role, status, created_at)
        VALUES (
            '550e8400-e29b-41d4-a716-446655440000', -- Fixed UUID for admin
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
-- PART 4: VERIFICATION
-- ========================================

-- Check final state
SELECT 'Final auth.users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Final users table count:' as info, COUNT(*) as count FROM users;

-- Check admin user
SELECT 'Final admin user in users:' as info, id, email, role, status FROM users WHERE email = 'luxsess2001@gmail.com';

-- Check all users
SELECT 'All users:' as info, id, email, role, status, created_at FROM users ORDER BY created_at; 