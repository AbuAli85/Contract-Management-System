-- ========================================
-- 🚀 Create Test Accounts for Real-Time Dashboard
-- ========================================

-- Step 1: Create Provider Test Account
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
  '11111111-1111-1111-1111-111111111111',
  'provider@test.com',
  'John Provider',
  'provider',
  'active',
  '+1234567890',
  null,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'provider',
  status = 'active';

-- Step 2: Create Client Test Account  
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
  'client',
  'active',
  '+1234567891',
  null,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'client',
  status = 'active';

-- Step 3: Create Sample Company
-- ========================================

INSERT INTO public.companies (
  id,
  name,
  type,
  description,
  website,
  industry,
  size,
  location,
  created_at,
  updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Digital Marketing Pro LLC',
  'service_provider',
  'Professional digital marketing services for growing businesses',
  'https://digitalmarketingpro.com',
  'Marketing & Advertising',
  '10-50',
  'New York, NY',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Link provider to company
UPDATE public.users 
SET company_id = '33333333-3333-3333-3333-333333333333'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Step 4: Create Sample Services
-- ========================================

INSERT INTO public.provider_services (
  id,
  provider_id,
  title,
  description,
  price,
  service_type,
  category,
  status,
  featured,
  delivery_time,
  created_at,
  updated_at
) VALUES 
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Complete SEO Audit & Strategy',
    'Comprehensive SEO analysis with actionable recommendations to boost your search rankings. Includes keyword research, technical audit, and content optimization strategy.',
    299,
    'seo_audit',
    'Digital Marketing',
    'active',
    true,
    '5-7 days',
    now(),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Google Ads Campaign Setup',
    'Professional Google Ads campaign creation and optimization for maximum ROI. Includes keyword research, ad creation, and campaign structure.',
    499,
    'google_ads',
    'Digital Marketing',
    'active',
    false,
    '3-5 days',
    now(),
    now()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Social Media Content Calendar',
    '30-day social media content strategy and calendar with engaging posts designed to grow your following and increase engagement.',
    199,
    'social_media',
    'Digital Marketing',
    'paused',
    false,
    '7-10 days',
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

-- Step 5: Create Sample Bookings/Orders
-- ========================================

INSERT INTO public.bookings (
  id,
  client_id,
  provider_id,
  service_id,
  title,
  description,
  status,
  total_amount,
  start_date,
  end_date,
  created_at,
  updated_at
) VALUES 
  (
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'E-commerce SEO Optimization',
    'Complete SEO audit and optimization for online fashion store. Focus on product page optimization and category structure.',
    'active',
    1500,
    now(),
    now() + interval '30 days',
    now(),
    now()
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'Local Business Google Ads',
    'Google Ads campaign setup for local restaurant to increase foot traffic and online orders.',
    'delivered',
    800,
    now() - interval '20 days',
    now() + interval '10 days',
    now() - interval '20 days',
    now()
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'Startup SEO Strategy',
    'SEO foundation setup for new tech startup including keyword research and content strategy.',
    'completed',
    599,
    now() - interval '45 days',
    now() - interval '15 days',
    now() - interval '45 days',
    now() - interval '10 days'
  ) ON CONFLICT (id) DO NOTHING;

-- Step 6: Create Sample Audit Logs
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
    'CREATE',
    'provider_services',
    '44444444-4444-4444-4444-444444444444',
    null,
    '{"title": "Complete SEO Audit & Strategy", "status": "active"}',
    now()
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    'CREATE',
    'bookings',
    '77777777-7777-7777-7777-777777777777',
    null,
    '{"title": "E-commerce SEO Optimization", "status": "active"}',
    now()
  );

-- ========================================
-- 🎉 Test Accounts Created Successfully!
-- ========================================

-- Login Credentials:
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
-- ✅ 3 Sample orders (Active, Delivered, Completed)
-- ✅ Audit logs for tracking

-- Next Steps:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Login with provider@test.com / TestPass123!
-- 3. Access /dashboard/provider-comprehensive
-- 4. Test real-time functionality

SELECT 'Test accounts created successfully! 🎉' as status;