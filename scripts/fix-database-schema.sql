-- Complete Database Schema Fix
-- This script fixes all common database schema issues that cause "Database error querying schema"
-- Run this in Supabase SQL Editor

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Check current schema state
SELECT 'Current Database State' as info;

-- Check if tables exist
SELECT 
    'Tables Check' as check_type,
    COUNT(*) as table_count,
    array_agg(tablename) as existing_tables
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'companies', 'services', 'provider_services', 'bookings');

-- Check if enums exist
SELECT 
    'Enums Check' as check_type,
    COUNT(*) as enum_count,
    array_agg(typname) as existing_enums
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN ('user_role', 'enhanced_user_role', 'user_status', 'service_status');

-- 3. Create missing enums (safe - only creates if not exists)
DO $$ 
BEGIN
    -- Create user_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user', 'viewer');
        RAISE NOTICE 'Created user_role enum';
    END IF;

    -- Create enhanced_user_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enhanced_user_role') THEN
        CREATE TYPE enhanced_user_role AS ENUM ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin');
        RAISE NOTICE 'Created enhanced_user_role enum';
    END IF;

    -- Create user_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
        RAISE NOTICE 'Created user_status enum';
    END IF;

    -- Create service_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
        CREATE TYPE service_status AS ENUM ('active', 'inactive', 'pending', 'approved', 'rejected');
        RAISE NOTICE 'Created service_status enum';
    END IF;

    -- Create company_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_type') THEN
        CREATE TYPE company_type AS ENUM ('client', 'provider', 'both');
        RAISE NOTICE 'Created company_type enum';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating enums: %', SQLERRM;
END $$;

-- 4. Create users table if it doesn't exist or fix its structure
DO $$
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            role enhanced_user_role DEFAULT 'user',
            status user_status DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            phone TEXT,
            avatar_url TEXT
        );
        RAISE NOTICE 'Created users table';
    ELSE
        -- Table exists, let's check and fix the role column
        RAISE NOTICE 'Users table exists, checking role column...';
        
        -- Drop old constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'users' AND constraint_name = 'users_role_check'
        ) THEN
            ALTER TABLE users DROP CONSTRAINT users_role_check;
            RAISE NOTICE 'Dropped old role constraint';
        END IF;
        
        -- Check if role column uses the right type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'role' 
            AND data_type = 'USER-DEFINED'
            AND udt_name != 'enhanced_user_role'
        ) THEN
            -- Need to update the role column type
            ALTER TABLE users ALTER COLUMN role TYPE enhanced_user_role USING role::text::enhanced_user_role;
            RAISE NOTICE 'Updated role column to use enhanced_user_role';
        END IF;
        
        -- Ensure role column exists and has the right constraint
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
            ALTER TABLE users ADD CONSTRAINT users_role_check 
            CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));
            RAISE NOTICE 'Added new role constraint';
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with users table: %', SQLERRM;
END $$;

-- 5. Create a simple test user with proper auth integration
DO $$
DECLARE
    test_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Clean up any existing test user
    DELETE FROM auth.users WHERE email = 'provider@test.com';
    DELETE FROM public.users WHERE email = 'provider@test.com';
    
    -- Create auth user
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        'provider@test.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
        NOW(),
        NOW(),
        NOW(),
        '{"full_name": "Test Provider", "role": "provider"}',
        'authenticated',
        'authenticated'
    );
    
    -- Create public user
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        status,
        phone,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'provider@test.com',
        'Test Provider',
        'provider',
        'active',
        '+1234567890',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created test provider account successfully';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating test user: %', SQLERRM;
END $$;

-- 6. Verify the fix
SELECT 'Schema Fix Verification' as info;

-- Check enums
SELECT 'Available Enums:' as check_name, array_agg(typname) as enums
FROM pg_type WHERE typtype = 'e';

-- Check users table structure
SELECT 'Users Table Columns:' as check_name, 
       column_name, 
       data_type, 
       udt_name,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check test account
SELECT 'Test Account Status:' as check_name,
       au.email as auth_email,
       au.email_confirmed_at IS NOT NULL as confirmed,
       pu.email as public_email,
       pu.role as public_role,
       pu.status as public_status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'provider@test.com' OR pu.email = 'provider@test.com';

-- Final success message
SELECT '✅ Database schema fixed!' as status,
       'Test account: provider@test.com / password' as credentials,
       'You can now try logging in again' as next_step;