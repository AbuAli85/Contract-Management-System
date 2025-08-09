-- ========================================
-- 🛡️ Safe Provider Account Creation
-- ========================================

-- This script safely creates provider accounts regardless of table structure

-- Step 1: Fix role constraint first
-- ========================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
        RAISE NOTICE 'Dropped existing users_role_check constraint';
    END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));

-- Step 2: Create Provider Account
-- ========================================

-- Create auth user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'provider@test.com',
  '$2a$10$7A9QmUTZS.LvDlx8LLg8gOaIbCFGSGMQDGcf4r3mQOzYwTQXr6.3G', -- password: TestPass123!
  now(),
  now(),
  now(),
  '{"provider": "email"}',
  '{"full_name": "John Provider"}'
) ON CONFLICT (id) DO NOTHING;

-- Create public user profile
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
  '11111111-1111-1111-1111-111111111111',
  'provider@test.com',
  'John Provider',
  'provider',
  'active',
  '+1234567890',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'provider',
  status = 'active';

-- Step 3: Create Client Account
-- ========================================

-- Create auth user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'client@test.com',
  '$2a$10$7A9QmUTZS.LvDlx8LLg8gOaIbCFGSGMQDGcf4r3mQOzYwTQXr6.3G', -- password: TestPass123!
  now(),
  now(),
  now(),
  '{"provider": "email"}',
  '{"full_name": "Jane Client"}'
) ON CONFLICT (id) DO NOTHING;

-- Create public user profile
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
  '22222222-2222-2222-2222-222222222222',
  'client@test.com',
  'Jane Client',
  'client',
  'active',
  '+1234567891',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'client',
  status = 'active';

-- Step 4: Create Sample Service (Adaptive)
-- ========================================

-- Check which services table exists and use the appropriate one
DO $$ 
DECLARE
    has_provider_services boolean;
    has_services boolean;
BEGIN
    -- Check table existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'provider_services'
    ) INTO has_provider_services;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'services'
    ) INTO has_services;
    
    IF has_provider_services THEN
        RAISE NOTICE 'Using provider_services table for service creation';
        
        -- Create company first if needed
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
          '33333333-3333-3333-3333-333333333333',
          'Digital Marketing Pro LLC',
          'digital-marketing-pro',
          'Professional digital marketing services for growing businesses',
          'https://digitalmarketingpro.com',
          'info@digitalmarketingpro.com',
          '+1-555-123-4567',
          'small_business',
          true,
          true,
          now(),
          now()
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Link provider to company
        UPDATE public.users 
        SET company_id = '33333333-3333-3333-3333-333333333333'
        WHERE id = '11111111-1111-1111-1111-111111111111';
        
        -- Create service in provider_services table
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
          '44444444-4444-4444-4444-444444444444',
          '11111111-1111-1111-1111-111111111111',
          '33333333-3333-3333-3333-333333333333',
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
          now(),
          now()
        ) ON CONFLICT (id) DO NOTHING;
        
    ELSIF has_services THEN
        RAISE NOTICE 'Using services table for service creation';
        
        -- Create service in services table (different structure)
        INSERT INTO public.services (
          id,
          name,
          description,
          category,
          price_base,
          price_currency,
          duration_minutes,
          status,
          metadata,
          created_at,
          updated_at
        ) VALUES (
          '44444444-4444-4444-4444-444444444444',
          'Complete SEO Audit & Strategy',
          'Comprehensive SEO analysis with actionable recommendations to boost your search rankings.',
          'Digital Marketing',
          299.00,
          'USD',
          420,
          'active',
          '{"service_type": "seo_audit", "delivery_days": "5-7", "provider_id": "11111111-1111-1111-1111-111111111111"}',
          now(),
          now()
        ) ON CONFLICT (id) DO NOTHING;
        
    ELSE
        RAISE NOTICE 'No services table found. You may need to run migrations first.';
    END IF;
END $$;

-- Step 5: Verify Account Creation
-- ========================================

SELECT 
    'Test Accounts Created' as result,
    u.email,
    u.full_name,
    u.role,
    u.status,
    CASE WHEN c.name IS NOT NULL THEN c.name ELSE 'No Company' END as company
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email IN ('provider@test.com', 'client@test.com')
ORDER BY u.role DESC;

-- Show available services
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_services') THEN
        RAISE NOTICE '=== PROVIDER SERVICES CREATED ===';
        FOR rec IN 
            SELECT name, category, price_base, status 
            FROM provider_services 
            WHERE provider_id = '11111111-1111-1111-1111-111111111111'
        LOOP
            RAISE NOTICE '  Service: % (% - %)', rec.name, rec.category, rec.price_base;
        END LOOP;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
        RAISE NOTICE '=== SERVICES CREATED ===';
        FOR rec IN 
            SELECT name, category, price_base, status 
            FROM services 
            WHERE metadata->>'provider_id' = '11111111-1111-1111-1111-111111111111'
        LOOP
            RAISE NOTICE '  Service: % (% - %)', rec.name, rec.category, rec.price_base;
        END LOOP;
    END IF;
END $$;

-- ========================================
-- 🎉 Success! Test Accounts Created
-- ========================================

SELECT '✅ Provider and Client accounts created successfully!' as final_result
UNION ALL
SELECT '📧 Provider Login: provider@test.com / TestPass123!'
UNION ALL  
SELECT '📧 Client Login: client@test.com / TestPass123!'
UNION ALL
SELECT '🚀 Access Provider Dashboard: /en/dashboard/provider-comprehensive'
UNION ALL
SELECT '🚀 Access Client Dashboard: /en/dashboard/client-comprehensive';