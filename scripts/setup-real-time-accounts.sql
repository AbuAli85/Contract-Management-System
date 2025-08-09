-- ========================================
-- 🚀 Setup Real-Time Accounts for Development
-- ========================================

-- This script creates test accounts that work with the enhanced auth system

-- Step 1: Fix role constraint (ensure it supports all needed roles)
-- ========================================

DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Add comprehensive role constraint
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));
    
    RAISE NOTICE '✅ Role constraint updated to support all user types';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Role constraint update failed: %', SQLERRM;
END $$;

-- Step 2: Clean up existing test accounts
-- ========================================

-- Remove any existing test accounts to start fresh
DELETE FROM public.users WHERE email IN (
    'provider@test.com', 
    'test@test.com', 
    'user@test.com',
    'client@test.com',
    'admin@test.com'
);

DELETE FROM auth.users WHERE email IN (
    'provider@test.com', 
    'test@test.com', 
    'user@test.com',
    'client@test.com',
    'admin@test.com'
);

RAISE NOTICE '🧹 Cleaned up existing test accounts';

-- Step 3: Create Provider Test Account
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
    '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123!
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "John Provider", "role": "provider", "phone": "+1234567890"}',
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

-- Step 4: Create Client Test Account
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
    '22222222-2222-2222-2222-222222222222'::UUID,
    'client@test.com',
    '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123!
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Jane Client", "role": "client", "phone": "+1234567891"}',
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
    '22222222-2222-2222-2222-222222222222'::UUID,
    'client@test.com',
    'Jane Client',
    'client',
    'active',
    '+1234567891',
    NOW(),
    NOW()
);

-- Step 5: Create Admin Test Account
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
    '33333333-3333-3333-3333-333333333333'::UUID,
    'admin@test.com',
    '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123!
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User", "role": "admin", "phone": "+1234567892"}',
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
    '33333333-3333-3333-3333-333333333333'::UUID,
    'admin@test.com',
    'Admin User',
    'admin',
    'active',
    '+1234567892',
    NOW(),
    NOW()
);

-- Step 6: Create Regular User Test Account
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
    '$2a$10$EuGYOIXwsxOL.t1yGS8O2.TvQ1JGBwu8V6FhgT0uu0nLKLCy8IuEu', -- TestPass123!
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Regular User", "role": "user", "phone": "+1234567893"}',
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
    'Regular User',
    'user',
    'active',
    '+1234567893',
    NOW(),
    NOW()
);

-- Step 7: Create Sample Company for Provider
-- ========================================

DO $$
BEGIN
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
            updated_at,
            created_by
        ) VALUES (
            '55555555-5555-5555-5555-555555555555'::UUID,
            'Digital Marketing Solutions',
            'digital-marketing-solutions',
            'Professional digital marketing services for growing businesses',
            'https://digitalmarketingsolutions.com',
            'info@digitalmarketingsolutions.com',
            '+1-555-123-4567',
            'small_business',
            true,
            true,
            NOW(),
            NOW(),
            '11111111-1111-1111-1111-111111111111'::UUID
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Link provider to company
        UPDATE public.users 
        SET company_id = '55555555-5555-5555-5555-555555555555'::UUID
        WHERE id = '11111111-1111-1111-1111-111111111111'::UUID;
        
        RAISE NOTICE '✅ Company created and linked to provider';
    END IF;
END $$;

-- Step 8: Verification
-- ========================================

SELECT 
    '🎉 ACCOUNT VERIFICATION' as section,
    au.email,
    pu.full_name,
    pu.role,
    pu.status,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    au.id = pu.id as ids_synced,
    LENGTH(au.encrypted_password) as pwd_hash_length
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email IN (
    'provider@test.com', 
    'client@test.com', 
    'admin@test.com',
    'user@test.com'
)
ORDER BY au.email;

-- Step 9: Instructions
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 REAL-TIME ACCOUNTS SETUP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 TEST ACCOUNTS (Password: TestPass123! for all):';
    RAISE NOTICE '';
    RAISE NOTICE '1. 👤 provider@test.com (Provider)';
    RAISE NOTICE '   → Dashboard: /en/dashboard/provider-comprehensive';
    RAISE NOTICE '   → Features: Service management, orders, earnings';
    RAISE NOTICE '';
    RAISE NOTICE '2. 👤 client@test.com (Client)';  
    RAISE NOTICE '   → Dashboard: /en/dashboard/client-comprehensive';
    RAISE NOTICE '   → Features: Project tracking, service booking';
    RAISE NOTICE '';
    RAISE NOTICE '3. 👤 admin@test.com (Admin)';
    RAISE NOTICE '   → Dashboard: /en/dashboard/admin';
    RAISE NOTICE '   → Features: Full system access, user management';
    RAISE NOTICE '';
    RAISE NOTICE '4. 👤 user@test.com (User)';
    RAISE NOTICE '   → Dashboard: /en/dashboard';
    RAISE NOTICE '   → Features: Basic access, contracts';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TESTING INSTRUCTIONS:';
    RAISE NOTICE '1. Server: http://localhost:3001';
    RAISE NOTICE '2. Login: http://localhost:3001/en/auth/login';
    RAISE NOTICE '3. Register: http://localhost:3001/en/auth/register';
    RAISE NOTICE '4. Clear browser cache before testing';
    RAISE NOTICE '';
    RAISE NOTICE '💡 FEATURES TO TEST:';
    RAISE NOTICE '• Real-time login/logout';
    RAISE NOTICE '• Role-based dashboard access';
    RAISE NOTICE '• Registration with validation';
    RAISE NOTICE '• Provider service management';
    RAISE NOTICE '• Client project tracking';
    RAISE NOTICE '========================================';
END $$;

-- Show final summary
SELECT '📋 ACCOUNT SUMMARY' as info
UNION ALL SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
UNION ALL SELECT 'provider@test.com → Provider Dashboard (Services & Orders)'
UNION ALL SELECT 'client@test.com   → Client Dashboard (Projects & Booking)'
UNION ALL SELECT 'admin@test.com    → Admin Dashboard (Full Access)'
UNION ALL SELECT 'user@test.com     → User Dashboard (Basic Features)'
UNION ALL SELECT ''
UNION ALL SELECT 'Password: TestPass123! (all accounts)'
UNION ALL SELECT 'Server: http://localhost:3001'
UNION ALL SELECT ''
UNION ALL SELECT '✅ Ready for real-time testing!';