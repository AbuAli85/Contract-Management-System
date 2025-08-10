-- ========================================
-- 🔧 CREATE WORKING TEST ACCOUNT
-- ========================================

-- Check what accounts currently exist and create one that definitely works

-- Step 1: Show all current test accounts
-- ========================================

SELECT 
    '🔍 CURRENT AUTH ACCOUNTS' as section,
    email,
    id,
    email_confirmed_at IS NOT NULL as confirmed,
    LENGTH(encrypted_password) as pwd_len,
    created_at
FROM auth.users 
WHERE email LIKE '%test%' OR email LIKE '%provider%'
ORDER BY created_at DESC;

SELECT 
    '👤 CURRENT PUBLIC ACCOUNTS' as section,
    email,
    id,
    full_name,
    role,
    status,
    created_at
FROM public.users 
WHERE email LIKE '%test%' OR email LIKE '%provider%'
ORDER BY created_at DESC;

-- Step 2: Clean up and create fresh working account
-- ========================================

-- Remove any existing problematic accounts
DELETE FROM public.users WHERE email IN ('test@test.com', 'provider@test.com');
DELETE FROM auth.users WHERE email IN ('test@test.com', 'provider@test.com');

-- Step 3: Create test@test.com account (since you're trying to use it)
-- ========================================

-- First fix role constraint
DO $$ 
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create auth user with working hash
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
) VALUES (
    '33333333-3333-3333-3333-333333333333'::UUID,
    'test@test.com',
    '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123! verified hash
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
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
    '33333333-3333-3333-3333-333333333333'::UUID,
    'test@test.com',
    'Test Provider',
    'provider',
    'active',
    '+1234567890',
    NOW(),
    NOW()
);

-- Step 4: Also create provider@test.com for backup
-- ========================================

INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
) VALUES (
    '11111111-1111-1111-1111-111111111111'::UUID,
    'provider@test.com',
    '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123! verified hash
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "John Provider", "role": "provider"}',
    'authenticated',
    'authenticated'
);

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

-- Step 5: Create a simple user account for testing
-- ========================================

INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
) VALUES (
    '44444444-4444-4444-4444-444444444444'::UUID,
    'user@test.com',
    '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123! verified hash
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test User", "role": "user"}',
    'authenticated',
    'authenticated'
);

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
    '44444444-4444-4444-4444-444444444444'::UUID,
    'user@test.com',
    'Test User',
    'user',
    'active',
    '+1234567891',
    NOW(),
    NOW()
);

-- Step 6: Verification
-- ========================================

SELECT 
    '✅ CREATED ACCOUNTS' as verification,
    au.email,
    pu.email as public_email,
    au.id = pu.id as ids_match,
    au.email_confirmed_at IS NOT NULL as confirmed,
    pu.role,
    pu.status,
    LENGTH(au.encrypted_password) as pwd_len
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('test@test.com', 'provider@test.com', 'user@test.com')
ORDER BY au.email;

-- Step 7: Instructions
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 TEST ACCOUNTS CREATED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 LOGIN OPTIONS (all use password: TestPass123!):';
    RAISE NOTICE '';
    RAISE NOTICE '1. test@test.com (Provider role)';
    RAISE NOTICE '   - Access: /en/dashboard/provider-comprehensive';
    RAISE NOTICE '';
    RAISE NOTICE '2. provider@test.com (Provider role)';
    RAISE NOTICE '   - Access: /en/dashboard/provider-comprehensive';
    RAISE NOTICE '';
    RAISE NOTICE '3. user@test.com (User role)';
    RAISE NOTICE '   - Access: /en/dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Clear browser cache/cookies completely';
    RAISE NOTICE '2. Go to: http://localhost:3000/en/auth/login';
    RAISE NOTICE '3. Try any of the accounts above';
    RAISE NOTICE '4. Password for all: TestPass123!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 TIP: Try user@test.com first to test basic auth';
    RAISE NOTICE '      then test@test.com for provider features';
    RAISE NOTICE '========================================';
END $$;

-- Show final account summary
SELECT '📋 ACCOUNT SUMMARY' as summary
UNION ALL SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
UNION ALL SELECT 'test@test.com      → Provider Dashboard'
UNION ALL SELECT 'provider@test.com  → Provider Dashboard' 
UNION ALL SELECT 'user@test.com      → Basic Dashboard'
UNION ALL SELECT ''
UNION ALL SELECT 'Password for all: TestPass123!'
UNION ALL SELECT ''
UNION ALL SELECT '🎯 Try test@test.com first!';