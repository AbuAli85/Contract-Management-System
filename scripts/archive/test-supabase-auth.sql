-- ========================================
-- 🧪 TEST SUPABASE AUTH DIRECTLY
-- ========================================

-- This script tests the exact auth setup that Supabase expects

-- Step 1: Show current auth configuration
-- ========================================

-- Check auth.config if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'config' AND table_schema = 'auth') THEN
        RAISE NOTICE '=== AUTH CONFIG ===';
        FOR rec IN 
            SELECT key, value FROM auth.config 
            WHERE key IN ('SITE_URL', 'JWT_SECRET', 'DISABLE_SIGNUP', 'EXTERNAL_EMAIL_ENABLED')
        LOOP
            RAISE NOTICE '%: %', rec.key, LEFT(rec.value, 50) || CASE WHEN LENGTH(rec.value) > 50 THEN '...' ELSE '' END;
        END LOOP;
    ELSE
        RAISE NOTICE 'No auth.config table found';
    END IF;
END $$;

-- Step 2: Check the exact auth.users record
-- ========================================

SELECT 
    '🔐 COMPLETE AUTH USER RECORD' as section,
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    LENGTH(encrypted_password) as pwd_length,
    email_confirmed_at,
    phone_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    confirmation_token = '' as token_empty,
    recovery_token = '' as recovery_empty
FROM auth.users 
WHERE email = 'provider@test.com';

-- Step 3: Create a completely fresh account with minimal data
-- ========================================

-- First, backup the current account
CREATE TEMP TABLE temp_backup AS 
SELECT * FROM auth.users WHERE email = 'provider@test.com';

-- Delete and recreate with absolute minimal requirements
DELETE FROM auth.users WHERE email = 'provider@test.com';

-- Insert with only essential fields
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
) VALUES (
    '11111111-1111-1111-1111-111111111111'::UUID,
    'provider@test.com',
    '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123! - verified working hash
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
);

-- Step 4: Verify the minimal account
-- ========================================

SELECT 
    '✅ MINIMAL AUTH ACCOUNT' as status,
    email,
    id,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    aud,
    role
FROM auth.users 
WHERE email = 'provider@test.com';

-- Step 5: Make sure public user still exists and matches
-- ========================================

-- Update public user to ensure sync
UPDATE public.users 
SET 
    email = 'provider@test.com',
    full_name = 'John Provider',
    role = 'provider',
    status = 'active',
    updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111'::UUID;

-- Verify sync
SELECT 
    '🔗 AUTH-PUBLIC SYNC' as sync_check,
    au.email as auth_email,
    pu.email as public_email,
    au.id as auth_id,
    pu.id as public_id,
    au.id = pu.id as ids_match
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'provider@test.com' OR pu.email = 'provider@test.com';

-- Step 6: Test with a different email/password combination
-- ========================================

-- Create a secondary test account to verify the system works
DO $$
BEGIN
    -- Clean up any existing test2 account
    DELETE FROM auth.users WHERE email = 'test@test.com';
    DELETE FROM public.users WHERE email = 'test@test.com';
    
    -- Create simple test account
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at
    ) VALUES (
        '22222222-2222-2222-2222-222222222222'::UUID,
        'test@test.com',
        '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123!
        NOW(),
        NOW(),
        NOW()
    );
    
    -- Create public user
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        '22222222-2222-2222-2222-222222222222'::UUID,
        'test@test.com',
        'Test User',
        'user',
        'active',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Created secondary test account: test@test.com / TestPass123!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Secondary account creation failed: %', SQLERRM;
END $$;

-- Step 7: Final summary
-- ========================================

SELECT 
    '📋 TEST ACCOUNTS SUMMARY' as summary,
    email,
    id,
    email_confirmed_at IS NOT NULL as confirmed,
    LENGTH(encrypted_password) as pwd_len
FROM auth.users 
WHERE email IN ('provider@test.com', 'test@test.com')
ORDER BY email;

-- Instructions
SELECT '🎯 TESTING INSTRUCTIONS' as instructions
UNION ALL SELECT ''
UNION ALL SELECT '1. Primary Account:'
UNION ALL SELECT '   Email: provider@test.com'
UNION ALL SELECT '   Password: TestPass123!'
UNION ALL SELECT '   Role: provider'
UNION ALL SELECT ''
UNION ALL SELECT '2. Secondary Account:'
UNION ALL SELECT '   Email: test@test.com'
UNION ALL SELECT '   Password: TestPass123!'
UNION ALL SELECT '   Role: user'
UNION ALL SELECT ''
UNION ALL SELECT '3. Clear browser cache completely'
UNION ALL SELECT '4. Try both accounts to see if auth system works'
UNION ALL SELECT '5. If both fail, issue is with frontend/environment'
UNION ALL SELECT '6. If one works, issue is with specific account setup';