-- ========================================
-- 🔍 DEBUG AND FIX AUTH ISSUE
-- ========================================

-- Step 1: Check what currently exists
-- ========================================

SELECT '=== CURRENT AUTH.USERS ===' as debug_section;

SELECT 
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmed,
    LENGTH(encrypted_password) as pwd_length,
    LEFT(encrypted_password, 10) || '...' as pwd_preview,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email LIKE '%test.com%' OR email LIKE '%provider%'
ORDER BY created_at DESC;

SELECT '=== CURRENT PUBLIC.USERS ===' as debug_section;

SELECT 
    email,
    id,
    full_name,
    role,
    status,
    created_at
FROM public.users 
WHERE email LIKE '%test.com%' OR email LIKE '%provider%'
ORDER BY created_at DESC;

-- Step 2: Check for orphaned records
-- ========================================

SELECT '=== ID MISMATCH CHECK ===' as debug_section;

SELECT 
    'Orphaned auth users' as type,
    au.email,
    au.id as auth_id,
    'NO MATCH' as public_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
  AND au.email LIKE '%test.com%'

UNION ALL

SELECT 
    'Orphaned public users' as type,
    pu.email,
    'NO MATCH' as auth_id,
    pu.id as public_id
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL
  AND pu.email LIKE '%test.com%';

-- Step 3: Clean up and create fresh account
-- ========================================

SELECT '=== CLEANING UP EXISTING ACCOUNTS ===' as debug_section;

-- Remove any existing test accounts
DELETE FROM public.users WHERE email = 'provider@test.com';
DELETE FROM auth.users WHERE email = 'provider@test.com';

SELECT 'Cleaned up existing accounts' as status;

-- Step 4: Create proper auth user
-- ========================================

SELECT '=== CREATING NEW AUTH USER ===' as debug_section;

-- Get instance_id from existing auth users or use default
DO $$ 
DECLARE
    instance_uuid UUID;
    success BOOLEAN := false;
BEGIN
    -- Get instance_id from existing users or use default
    SELECT COALESCE(
        (SELECT instance_id FROM auth.users LIMIT 1),
        '00000000-0000-0000-0000-000000000000'::UUID
    ) INTO instance_uuid;
    
    -- Try comprehensive insert first
    BEGIN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            aud,
            role
        ) VALUES (
            '11111111-1111-1111-1111-111111111111'::UUID,
            instance_uuid,
            'provider@test.com',
            '$2a$10$VQ8a7VEL8/bNx.v1qQR8K.rEAGSTOD0Bn6r6lx8nH8JzPQhCGhJNW', -- TestPass123!
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "John Provider", "role": "provider"}',
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
        success := true;
        RAISE NOTICE '✅ Full auth user created successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Full insert failed: %, trying minimal...', SQLERRM;
    END;
    
    -- If comprehensive insert failed, try minimal
    IF NOT success THEN
        BEGIN
            INSERT INTO auth.users (
                id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at
            ) VALUES (
                '11111111-1111-1111-1111-111111111111'::UUID,
                'provider@test.com',
                '$2a$10$VQ8a7VEL8/bNx.v1qQR8K.rEAGSTOD0Bn6r6lx8nH8JzPQhCGhJNW', -- TestPass123!
                NOW(),
                NOW(),
                NOW()
            );
            RAISE NOTICE '✅ Minimal auth user created successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Both auth user creation methods failed: %', SQLERRM;
        END;
    END IF;
END $$;

-- Step 5: Fix role constraint and create public user
-- ========================================

SELECT '=== CREATING PUBLIC USER ===' as debug_section;

-- Fix role constraint first
DO $$ 
BEGIN
    -- Drop existing constraint
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Add correct constraint
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));
    
    RAISE NOTICE '✅ Role constraint fixed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Role constraint fix failed: %', SQLERRM;
END $$;

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
    '11111111-1111-1111-1111-111111111111'::UUID,
    'provider@test.com',
    'John Provider',
    'provider',
    'active',
    '+1234567890',
    NOW(),
    NOW()
);

-- Step 6: Verify the fix
-- ========================================

SELECT '=== VERIFICATION ===' as debug_section;

-- Check auth user
SELECT 
    '🔐 AUTH USER' as type,
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmed,
    LENGTH(encrypted_password) as pwd_hash_length,
    CASE 
        WHEN encrypted_password LIKE '$2a$%' OR encrypted_password LIKE '$2b$%' 
        THEN '✅ Valid bcrypt'
        ELSE '❌ Invalid hash'
    END as hash_validity,
    created_at
FROM auth.users 
WHERE email = 'provider@test.com';

-- Check public user
SELECT 
    '👤 PUBLIC USER' as type,
    email,
    id,
    full_name,
    role,
    status,
    created_at
FROM public.users 
WHERE email = 'provider@test.com';

-- Check ID sync
SELECT 
    '🔗 ID SYNC' as type,
    CASE 
        WHEN au.id = pu.id THEN '✅ IDs Match'
        WHEN au.id IS NULL THEN '❌ No auth user'
        WHEN pu.id IS NULL THEN '❌ No public user'
        ELSE '❌ ID Mismatch'
    END as sync_status,
    au.id as auth_id,
    pu.id as public_id
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'provider@test.com' OR pu.email = 'provider@test.com';

-- Step 7: Final status and instructions
-- ========================================

DO $$ 
DECLARE
    auth_exists BOOLEAN;
    public_exists BOOLEAN;
    ids_match BOOLEAN;
BEGIN
    -- Check existence
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'provider@test.com') INTO auth_exists;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'provider@test.com') INTO public_exists;
    
    -- Check ID match
    SELECT EXISTS(
        SELECT 1 FROM auth.users au
        JOIN public.users pu ON au.id = pu.id
        WHERE au.email = 'provider@test.com'
    ) INTO ids_match;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎯 FINAL STATUS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auth user exists: %', auth_exists;
    RAISE NOTICE 'Public user exists: %', public_exists;
    RAISE NOTICE 'IDs match: %', ids_match;
    RAISE NOTICE '';
    
    IF auth_exists AND public_exists AND ids_match THEN
        RAISE NOTICE '🎉 SUCCESS! Account is ready';
        RAISE NOTICE '';
        RAISE NOTICE '📧 Login with:';
        RAISE NOTICE '   Email: provider@test.com';
        RAISE NOTICE '   Password: TestPass123!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Access dashboard at:';
        RAISE NOTICE '   /en/dashboard/provider-comprehensive';
    ELSE
        RAISE NOTICE '❌ SETUP INCOMPLETE';
        RAISE NOTICE 'Please check the verification results above';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Show login test query
SELECT '🧪 TEST LOGIN READY' as final_status
UNION ALL
SELECT 'Now try logging in at: http://localhost:3000/en/auth/login'
UNION ALL
SELECT 'Email: provider@test.com'
UNION ALL
SELECT 'Password: TestPass123!';