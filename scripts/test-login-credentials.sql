-- ========================================
-- 🧪 Test Login Credentials
-- ========================================

-- This script helps diagnose login issues

-- Step 1: Check if test accounts exist in auth.users
-- ========================================

SELECT 
    '🔐 AUTH.USERS CHECK' as check_type,
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmed,
    LENGTH(encrypted_password) as password_hash_length,
    created_at,
    updated_at,
    raw_user_meta_data->>'full_name' as full_name_in_auth,
    raw_user_meta_data->>'role' as role_in_auth
FROM auth.users 
WHERE email IN ('provider@test.com', 'client@test.com')
ORDER BY email;

-- Step 2: Check if test accounts exist in public.users
-- ========================================

SELECT 
    '👤 PUBLIC.USERS CHECK' as check_type,
    email,
    id,
    full_name,
    role,
    status,
    company_id,
    created_at,
    updated_at
FROM public.users 
WHERE email IN ('provider@test.com', 'client@test.com')
ORDER BY email;

-- Step 3: Check for ID mismatches between auth and public users
-- ========================================

SELECT 
    '🔗 ID SYNC CHECK' as check_type,
    COALESCE(au.email, pu.email) as email,
    au.id as auth_id,
    pu.id as public_id,
    CASE 
        WHEN au.id = pu.id THEN '✅ IDs Match'
        WHEN au.id IS NULL THEN '❌ Missing in auth.users'
        WHEN pu.id IS NULL THEN '❌ Missing in public.users'
        ELSE '❌ ID Mismatch'
    END as sync_status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('provider@test.com', 'client@test.com')
   OR pu.email IN ('provider@test.com', 'client@test.com');

-- Step 4: Check role constraints
-- ========================================

SELECT 
    '🔒 ROLE CONSTRAINT CHECK' as check_type,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
  AND tc.constraint_type = 'CHECK'
  AND cc.check_clause ILIKE '%role%';

-- Step 5: Test password hash format
-- ========================================

DO $$ 
DECLARE
    provider_hash text;
    client_hash text;
BEGIN
    -- Get password hashes
    SELECT encrypted_password INTO provider_hash 
    FROM auth.users WHERE email = 'provider@test.com';
    
    SELECT encrypted_password INTO client_hash 
    FROM auth.users WHERE email = 'client@test.com';
    
    -- Check hash format
    IF provider_hash IS NOT NULL THEN
        IF provider_hash LIKE '$2a$%' OR provider_hash LIKE '$2b$%' THEN
            RAISE NOTICE '✅ Provider password hash format looks correct (bcrypt)';
        ELSE
            RAISE NOTICE '❌ Provider password hash format may be incorrect: %', LEFT(provider_hash, 10) || '...';
        END IF;
    ELSE
        RAISE NOTICE '❌ Provider password hash is NULL';
    END IF;
    
    IF client_hash IS NOT NULL THEN
        IF client_hash LIKE '$2a$%' OR client_hash LIKE '$2b$%' THEN
            RAISE NOTICE '✅ Client password hash format looks correct (bcrypt)';
        ELSE
            RAISE NOTICE '❌ Client password hash format may be incorrect: %', LEFT(client_hash, 10) || '...';
        END IF;
    ELSE
        RAISE NOTICE '❌ Client password hash is NULL';
    END IF;
END $$;

-- Step 6: Check Supabase configuration tables
-- ========================================

-- Check if there are any auth configuration issues
SELECT 
    '⚙️ AUTH CONFIG CHECK' as check_type,
    key,
    value
FROM auth.config
WHERE key IN ('SITE_URL', 'JWT_SECRET', 'JWT_EXP', 'DISABLE_SIGNUP', 'EXTERNAL_EMAIL_ENABLED')
ORDER BY key;

-- Step 7: Summary and recommendations
-- ========================================

DO $$ 
DECLARE
    auth_count int;
    public_count int;
    id_match_count int;
    role_constraint_ok boolean;
BEGIN
    -- Count accounts
    SELECT COUNT(*) INTO auth_count 
    FROM auth.users WHERE email IN ('provider@test.com', 'client@test.com');
    
    SELECT COUNT(*) INTO public_count 
    FROM public.users WHERE email IN ('provider@test.com', 'client@test.com');
    
    SELECT COUNT(*) INTO id_match_count
    FROM auth.users au
    JOIN public.users pu ON au.id = pu.id
    WHERE au.email IN ('provider@test.com', 'client@test.com');
    
    -- Check role constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'users' 
        AND cc.check_clause ILIKE '%provider%'
    ) INTO role_constraint_ok;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 DIAGNOSIS SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auth users found: %', auth_count;
    RAISE NOTICE 'Public users found: %', public_count;
    RAISE NOTICE 'ID matches: %', id_match_count;
    RAISE NOTICE 'Role constraint OK: %', role_constraint_ok;
    RAISE NOTICE '';
    
    IF auth_count = 0 THEN
        RAISE NOTICE '❌ ISSUE: No accounts in auth.users - run create-real-test-accounts.sql';
    ELSIF public_count = 0 THEN
        RAISE NOTICE '❌ ISSUE: No accounts in public.users - run create-real-test-accounts.sql';
    ELSIF id_match_count != auth_count THEN
        RAISE NOTICE '❌ ISSUE: ID mismatch between auth and public users';
    ELSIF NOT role_constraint_ok THEN
        RAISE NOTICE '❌ ISSUE: Role constraint does not allow provider role - run fix-role-constraint.sql';
    ELSE
        RAISE NOTICE '✅ All checks passed - accounts should work for login';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 TRY LOGGING IN WITH:';
        RAISE NOTICE 'Email: provider@test.com';
        RAISE NOTICE 'Password: TestPass123!';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

SELECT '🎉 Diagnostic complete! Check the notices above for results.' as result;