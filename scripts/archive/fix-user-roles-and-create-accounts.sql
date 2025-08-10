-- ========================================
-- 🚀 Fix User Roles & Create Test Accounts
-- ========================================

-- Step 1: Check current role constraint and update if needed
-- ========================================

-- First, let's see what the current constraint allows
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%role%';

-- If the constraint doesn't allow 'provider' and 'client', let's update it
-- Drop old constraint if exists
DO $$ 
BEGIN
    -- Try to drop the existing constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
END $$;

-- Add new constraint that supports all roles including provider and client
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));

-- Step 2: Create Provider Test Account
-- ========================================

-- Insert into auth.users (Supabase Auth)
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

-- Insert into public.users (App Profile) with correct role
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  phone,
  company_id,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'provider@test.com',
  'John Provider',
  'provider', -- This should now work with updated constraint
  'active',
  '+1234567890',
  null,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'provider',
  status = 'active';

-- Step 3: Create Client Test Account  
-- ========================================

-- Insert into auth.users (Supabase Auth)
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

-- Insert into public.users (App Profile)
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  phone,
  company_id,
  created_at,
  updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'client@test.com',
  'Jane Client',
  'client', -- This should now work with updated constraint
  'active',
  '+1234567891',
  null,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'client',
  status = 'active';

-- Step 4: Create Sample Company
-- ========================================

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

-- Step 5: Create Sample Services (Check Table Structure First)
-- ========================================

-- Check if provider_services table exists and show its structure
DO $$ 
DECLARE
    table_exists boolean;
    column_exists boolean;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'provider_services'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'provider_services table does not exist. You may need to run the migrations first.';
        RETURN;
    END IF;
    
    -- Check if provider_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'provider_services' 
        AND column_name = 'provider_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'provider_id column does not exist in provider_services table.';
        
        -- Show available columns
        RAISE NOTICE 'Available columns in provider_services:';
        FOR rec IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'provider_services' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
        END LOOP;
        RETURN;
    END IF;
    
    RAISE NOTICE 'provider_services table structure is correct, proceeding with data insertion...';
END $$;

-- Insert services only if table structure is correct
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
) 
SELECT 
  '44444444-4444-4444-4444-444444444444'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Complete SEO Audit & Strategy',
  'Comprehensive SEO analysis with actionable recommendations to boost your search rankings. Includes keyword research, technical audit, and content optimization strategy.',
  'Digital Marketing',
  'SEO Services',
  299.00,
  'USD',
  420, -- 7 hours
  'active'::service_status,
  true,
  ARRAY['SEO', 'keyword research', 'technical audit', 'content strategy'],
  '{"service_type": "seo_audit", "delivery_days": "5-7", "revisions": 2}'::jsonb,
  now(),
  now()
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'provider_services' AND column_name = 'provider_id'
)

UNION ALL

SELECT 
  '55555555-5555-5555-5555-555555555555'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Google Ads Campaign Setup',
  'Professional Google Ads campaign creation and optimization for maximum ROI. Includes keyword research, ad creation, and campaign structure.',
  'Digital Marketing',
  'Paid Advertising',
  499.00,
  'USD',
  300, -- 5 hours
  'active'::service_status,
  true,
  ARRAY['Google Ads', 'PPC', 'campaign setup', 'keyword bidding'],
  '{"service_type": "google_ads", "delivery_days": "3-5", "ad_groups": 5}'::jsonb,
  now(),
  now()
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'provider_services' AND column_name = 'provider_id'
)

UNION ALL

SELECT 
  '66666666-6666-6666-6666-666666666666'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Social Media Content Calendar',
  '30-day social media content strategy and calendar with engaging posts designed to grow your following and increase engagement.',
  'Digital Marketing',
  'Social Media',
  199.00,
  'USD',
  480, -- 8 hours
  'active'::service_status,
  false,
  ARRAY['social media', 'content calendar', 'content strategy', 'engagement'],
  '{"service_type": "social_media", "delivery_days": "7-10", "posts_per_week": 5}'::jsonb,
  now(),
  now()
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'provider_services' AND column_name = 'provider_id'
)

ON CONFLICT (id) DO NOTHING;

-- Step 6: Create Sample Bookings/Orders
-- ========================================

INSERT INTO public.bookings (
  id,
  client_id,
  provider_id,
  service_id,
  booking_number,
  status,
  scheduled_start,
  scheduled_end,
  total_price,
  currency,
  notes,
  metadata,
  created_at,
  updated_at
) VALUES 
  (
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'BK-' || TO_CHAR(now(), 'YYYYMMDD') || '-001',
    'in_progress',
    now(),
    now() + interval '7 days',
    1500.00,
    'USD',
    'Complete SEO audit and optimization for online fashion store. Focus on product page optimization and category structure.',
    '{"project_type": "ecommerce", "priority": "high", "client_website": "fashionstore.com"}',
    now(),
    now()
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'BK-' || TO_CHAR(now(), 'YYYYMMDD') || '-002',
    'completed',
    now() - interval '20 days',
    now() - interval '15 days',
    800.00,
    'USD',
    'Google Ads campaign setup for local restaurant to increase foot traffic and online orders.',
    '{"project_type": "local_business", "industry": "restaurant", "target_radius": "10_miles"}',
    now() - interval '20 days',
    now() - interval '10 days'
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'BK-' || TO_CHAR(now(), 'YYYYMMDD') || '-003',
    'completed',
    now() - interval '45 days',
    now() - interval '30 days',
    599.00,
    'USD',
    'SEO foundation setup for new tech startup including keyword research and content strategy.',
    '{"project_type": "startup", "industry": "technology", "target_market": "B2B"}',
    now() - interval '45 days',
    now() - interval '25 days'
  ) ON CONFLICT (id) DO NOTHING;

-- Step 7: Create Sample Reviews
-- ========================================

INSERT INTO public.service_reviews (
  id,
  service_id,
  client_id,
  provider_id,
  booking_id,
  rating,
  title,
  review_text,
  is_public,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888888',
    5,
    'Excellent Google Ads Setup!',
    'John did an amazing job setting up our Google Ads campaign. We saw immediate results with increased foot traffic. Highly recommended!',
    true,
    now() - interval '5 days'
  ),
  (
    gen_random_uuid(),
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '99999999-9999-9999-9999-999999999999',
    5,
    'Comprehensive SEO Analysis',
    'The SEO audit was incredibly detailed and provided actionable insights. Our startup ranking improved significantly after implementing the recommendations.',
    true,
    now() - interval '20 days'
  ) ON CONFLICT (id) DO NOTHING;

-- Step 8: Create Sample Audit Logs
-- ========================================

INSERT INTO public.audit_logs (
  id,
  user_id,
  action,
  table_name,
  record_id,
  old_values,
  new_values,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'create',
    'provider_services',
    '44444444-4444-4444-4444-444444444444',
    null,
    '{"name": "Complete SEO Audit & Strategy", "status": "active", "price": 299}',
    now()
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    'create',
    'bookings',
    '77777777-7777-7777-7777-777777777777',
    null,
    '{"status": "in_progress", "total_price": 1500, "service": "SEO Audit"}',
    now()
  );

-- ========================================
-- 🎉 Test Accounts Created Successfully!
-- ========================================

-- Check if everything was created correctly
SELECT 
    'Provider Account' as account_type,
    u.email,
    u.full_name,
    u.role,
    u.status,
    c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'provider@test.com'

UNION ALL

SELECT 
    'Client Account' as account_type,
    u.email,
    u.full_name,
    u.role,
    u.status,
    null as company_name
FROM users u
WHERE u.email = 'client@test.com';

-- Show created services
SELECT 
    'Services Created' as info,
    ps.name,
    ps.category,
    ps.price_base::text || ' ' || ps.price_currency as price,
    ps.status
FROM provider_services ps
WHERE ps.provider_id = '11111111-1111-1111-1111-111111111111';

-- Show created bookings
SELECT 
    'Bookings Created' as info,
    b.booking_number,
    b.status,
    b.total_price::text || ' ' || b.currency as amount,
    s.name as service_name
FROM bookings b
JOIN provider_services s ON b.service_id = s.id
WHERE b.provider_id = '11111111-1111-1111-1111-111111111111';

-- ========================================
-- Login Credentials:
-- ========================================
-- Provider Account:
--   Email: provider@test.com
--   Password: TestPass123!
--   Role: provider
--   Dashboard: /dashboard/provider-comprehensive

-- Client Account:
--   Email: client@test.com  
--   Password: TestPass123!
--   Role: client
--   Dashboard: /dashboard/client-comprehensive

-- Sample Data Created:
-- ✅ 1 Provider account with company profile
-- ✅ 1 Client account
-- ✅ 3 Sample services (SEO, Google Ads, Social Media)
-- ✅ 3 Sample bookings (In Progress, Completed x2)
-- ✅ 2 Service reviews with 5-star ratings
-- ✅ Audit logs for tracking

SELECT '🎉 Test accounts and sample data created successfully!' as result;