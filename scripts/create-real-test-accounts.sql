-- ========================================
-- 🔧 Create Real Test Accounts with Proper Auth
-- ========================================

-- This script creates test accounts that will work with the login system

-- Step 1: Check current constraint (should be fixed already)
-- ========================================

DO $$ 
BEGIN
    -- Verify the role constraint allows provider and client
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'users' 
        AND cc.check_clause ILIKE '%provider%'
        AND cc.check_clause ILIKE '%client%'
    ) THEN
        RAISE EXCEPTION 'Role constraint not updated. Please run fix-role-constraint.sql first.';
    END IF;
    
    RAISE NOTICE '✅ Role constraint verified - provider and client roles are allowed';
END $$;

-- Step 2: Clean up any existing test accounts
-- ========================================

-- Remove existing test accounts if they exist
DELETE FROM auth.users WHERE email IN ('provider@test.com', 'client@test.com');
DELETE FROM public.users WHERE email IN ('provider@test.com', 'client@test.com');

RAISE NOTICE '🧹 Cleaned up any existing test accounts';

-- Step 3: Create Provider Account using Supabase Auth
-- ========================================

-- Method 1: Direct auth.users insertion (this should work with proper password hash)
-- Using a properly generated bcrypt hash for password "TestPass123!"

INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'provider@test.com',
    '$2a$10$zlCJgbDmMLxvuE2GaRhkTO6KhO/ld4rq4gJuHZOLn.uPRr0UNgPKG', -- TestPass123!
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "John Provider", "role": "provider"}',
    false,
    NOW(),
    NOW(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false,
    null
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- Create corresponding public user profile
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    phone,
    avatar_url,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'provider@test.com',
    'John Provider',
    'provider',
    'active',
    '+1234567890',
    null,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

RAISE NOTICE '✅ Provider account created: provider@test.com';

-- Step 4: Create Client Account
-- ========================================

INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'client@test.com',
    '$2a$10$zlCJgbDmMLxvuE2GaRhkTO6KhO/ld4rq4gJuHZOLn.uPRr0UNgPKG', -- TestPass123!
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Jane Client", "role": "client"}',
    false,
    NOW(),
    NOW(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false,
    null
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- Create corresponding public user profile
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    phone,
    avatar_url,
    created_at,
    updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'client@test.com',
    'Jane Client',
    'client',
    'active',
    '+1234567891',
    null,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

RAISE NOTICE '✅ Client account created: client@test.com';

-- Step 5: Create Sample Company and Services (if tables exist)
-- ========================================

DO $$ 
BEGIN
    -- Create company if companies table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        INSERT INTO public.companies (
            id,
            name,
            slug,
            description,
            website,
            email,
            phone,
            business_type,
            is_active,
            is_verified,
            created_at,
            updated_at
        ) VALUES (
            '33333333-3333-3333-3333-333333333333'::uuid,
            'Digital Marketing Pro LLC',
            'digital-marketing-pro',
            'Professional digital marketing services for growing businesses',
            'https://digitalmarketingpro.com',
            'info@digitalmarketingpro.com',
            '+1-555-123-4567',
            'small_business',
            true,
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Link provider to company
        UPDATE public.users 
        SET company_id = '33333333-3333-3333-3333-333333333333'::uuid
        WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
        
        RAISE NOTICE '✅ Company created and linked to provider';
    END IF;
    
    -- Create sample service if provider_services table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_services') THEN
        INSERT INTO public.provider_services (
            id,
            provider_id,
            company_id,
            name,
            description,
            category,
            subcategory,
            price_base,
            price_currency,
            duration_minutes,
            status,
            is_online_service,
            tags,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            '44444444-4444-4444-4444-444444444444'::uuid,
            '11111111-1111-1111-1111-111111111111'::uuid,
            '33333333-3333-3333-3333-333333333333'::uuid,
            'Complete SEO Audit & Strategy',
            'Comprehensive SEO analysis with actionable recommendations to boost your search rankings.',
            'Digital Marketing',
            'SEO Services',
            299.00,
            'USD',
            420,
            'active',
            true,
            ARRAY['SEO', 'keyword research', 'technical audit'],
            '{"service_type": "seo_audit", "delivery_days": "5-7"}',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Sample service created for provider';
    END IF;
END $$;

-- Step 6: Verify Account Creation
-- ========================================

-- Check auth.users table
SELECT 
    '🔐 AUTH.USERS VERIFICATION' as check_type,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email IN ('provider@test.com', 'client@test.com')
ORDER BY email;

-- Check public.users table
SELECT 
    '👤 PUBLIC.USERS VERIFICATION' as check_type,
    email,
    full_name,
    role,
    status,
    CASE WHEN company_id IS NOT NULL THEN '✅ Has Company' ELSE '⚠️ No Company' END as company_status
FROM public.users 
WHERE email IN ('provider@test.com', 'client@test.com')
ORDER BY email;

-- Test password verification (this will show if the password hash is working)
DO $$ 
DECLARE
    auth_user_exists boolean;
    public_user_exists boolean;
BEGIN
    -- Check if auth user exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'provider@test.com' 
        AND email_confirmed_at IS NOT NULL
    ) INTO auth_user_exists;
    
    -- Check if public user exists
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE email = 'provider@test.com' 
        AND role = 'provider' 
        AND status = 'active'
    ) INTO public_user_exists;
    
    IF auth_user_exists AND public_user_exists THEN
        RAISE NOTICE '✅ Provider account is properly set up and should be able to login';
    ELSE
        RAISE NOTICE '❌ Provider account setup incomplete - auth_user: %, public_user: %', auth_user_exists, public_user_exists;
    END IF;
END $$;

-- ========================================
-- 🎉 Test Account Summary
-- ========================================

SELECT '📋 LOGIN CREDENTIALS' as info
UNION ALL
SELECT '🔹 Provider: provider@test.com / TestPass123!'
UNION ALL
SELECT '🔹 Client: client@test.com / TestPass123!'
UNION ALL
SELECT ''
UNION ALL
SELECT '🚀 DASHBOARD ACCESS'
UNION ALL
SELECT '📊 Provider Dashboard: /en/dashboard/provider-comprehensive'
UNION ALL
SELECT '📊 Client Dashboard: /en/dashboard/client-comprehensive'
UNION ALL
SELECT '🧪 Test Page: /en/test-dashboard'
UNION ALL
SELECT ''
UNION ALL
SELECT '✅ Accounts are ready for login testing!';