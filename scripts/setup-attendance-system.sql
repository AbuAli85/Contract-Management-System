-- ============================================================================
-- ATTENDANCE SYSTEM SETUP SCRIPT
-- ============================================================================
-- This script helps you configure the attendance system for your company
-- Run this in Supabase SQL Editor after applying all migrations
-- ============================================================================
--
-- IMPORTANT: Before running this script, run list-companies.sql first
-- to find your company ID and user ID!
-- ============================================================================

-- STEP 1: Get Your Company ID
-- Option A: Use company ID directly (RECOMMENDED - more reliable)
-- Option B: Use company name (if you know the exact name)

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- ========================================================================
  -- OPTION A: Use Company ID (RECOMMENDED)
  -- ========================================================================
  -- Get your company ID by running: SELECT id, name FROM companies;
  -- Then paste the ID below:
  v_company_id := 'PASTE-YOUR-COMPANY-ID-HERE'::UUID;  -- UPDATE THIS
  
  -- ========================================================================
  -- OPTION B: Use Company Name (Alternative)
  -- ========================================================================
  -- Uncomment the lines below and comment out Option A if you prefer:
  -- SELECT id INTO v_company_id
  -- FROM companies
  -- WHERE name = 'Your Company Name'  -- UPDATE THIS with exact name
  -- LIMIT 1;
  
  -- Verify company exists
  IF v_company_id IS NULL OR NOT EXISTS (SELECT 1 FROM companies WHERE id = v_company_id) THEN
    RAISE EXCEPTION 'Company not found. Please run list-companies.sql first to find your company ID, then update the script.';
  END IF;

  -- ========================================================================
  -- Get Your User ID
  -- ========================================================================
  -- Option A: Use user ID directly (RECOMMENDED)
  v_user_id := 'PASTE-YOUR-USER-ID-HERE'::UUID;  -- UPDATE THIS
  
  -- Option B: Use email (Alternative)
  -- Uncomment the lines below and comment out Option A if you prefer:
  -- SELECT id INTO v_user_id
  -- FROM profiles
  -- WHERE email = 'your-email@example.com'  -- UPDATE THIS
  -- LIMIT 1;
  
  -- Verify user exists
  IF v_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User not found. Please run list-companies.sql first to find your user ID, then update the script.';
  END IF;

  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'User ID: %', v_user_id;

  -- STEP 2: Create Office Location
  -- Update coordinates with your actual office location
  INSERT INTO office_locations (
    company_id,
    name,
    address,
    latitude,
    longitude,
    radius_meters,
    is_active
  ) VALUES (
    v_company_id,
    'Main Office',  -- UPDATE: Your office name
    'Your Office Address',  -- UPDATE: Your address
    24.7136,  -- UPDATE: Your latitude (get from Google Maps)
    46.6753,  -- UPDATE: Your longitude (get from Google Maps)
    50,  -- UPDATE: Radius in meters (50m = ~164 feet)
    true
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Office location created (if not exists)';

  -- STEP 3: Verify Employee Records
  -- Check that employees have correct company_id
  RAISE NOTICE 'Employee Records:';
  RAISE NOTICE 'Total employees: %', (
    SELECT COUNT(*) FROM employer_employees 
    WHERE company_id = v_company_id
  );
  RAISE NOTICE 'Active employees: %', (
    SELECT COUNT(*) FROM employer_employees 
    WHERE company_id = v_company_id 
    AND employment_status = 'active'
  );

  -- STEP 4: Create Employee Group (Optional but Recommended)
  -- This groups employees for easier management
  INSERT INTO employee_attendance_groups (
    company_id,
    name,
    group_type,
    office_location_id,
    created_by
  )
  SELECT 
    v_company_id,
    'Main Office Team',
    'location',
    ol.id,
    v_user_id
  FROM office_locations ol
  WHERE ol.company_id = v_company_id
    AND ol.name = 'Main Office'  -- UPDATE: Match your office name
  LIMIT 1
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Employee group created (if not exists)';

  -- STEP 5: Create Attendance Schedule (Optional)
  -- This enables automated daily link generation
  INSERT INTO attendance_link_schedules (
    company_id,
    created_by,
    name,
    description,
    is_active,
    office_location_id,
    check_in_time,
    link_valid_duration_hours,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    send_check_in_link,
    notification_method,
    send_before_minutes,
    send_to_all_employees,
    require_photo,
    require_location_verification
  )
  SELECT 
    v_company_id,
    v_user_id,
    'Daily Office Check-In',
    'Automated daily attendance for main office',
    true,  -- IMPORTANT: Must be true for automation
    ol.id,
    '09:00:00'::TIME,  -- UPDATE: Your check-in time
    2,  -- Link valid for 2 hours
    true,  -- Monday
    true,  -- Tuesday
    true,  -- Wednesday
    true,  -- Thursday
    true,  -- Friday
    false,  -- Saturday
    false,  -- Sunday
    true,  -- Send check-in link
    ARRAY['email']::TEXT[],  -- Notification method
    15,  -- Send 15 minutes before
    true,  -- Send to all employees
    true,  -- Require photo
    true  -- Require location verification
  FROM office_locations ol
  WHERE ol.company_id = v_company_id
    AND ol.name = 'Main Office'  -- UPDATE: Match your office name
  LIMIT 1
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Attendance schedule created (if not exists)';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Verify office location coordinates are correct';
  RAISE NOTICE '2. Assign employees to groups (via UI)';
  RAISE NOTICE '3. Test employee check-in';
  RAISE NOTICE '4. Test manager approval';
  RAISE NOTICE '5. Verify cron job is running';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify your setup

-- Check office locations
SELECT 
  id,
  name,
  address,
  latitude,
  longitude,
  radius_meters,
  is_active
FROM office_locations
WHERE company_id = (SELECT id FROM companies WHERE name = 'Your Company Name' LIMIT 1);

-- Check employee records
SELECT 
  ee.id,
  p.full_name,
  p.email,
  ee.company_id,
  ee.employment_status
FROM employer_employees ee
JOIN profiles p ON p.id = ee.employee_id
WHERE ee.company_id = (SELECT id FROM companies WHERE name = 'Your Company Name' LIMIT 1);

-- Check employee groups
SELECT 
  id,
  name,
  group_type,
  employee_count
FROM employee_attendance_groups
WHERE company_id = (SELECT id FROM companies WHERE name = 'Your Company Name' LIMIT 1);

-- Check attendance schedules
SELECT 
  id,
  name,
  is_active,
  check_in_time,
  monday, tuesday, wednesday, thursday, friday
FROM attendance_link_schedules
WHERE company_id = (SELECT id FROM companies WHERE name = 'Your Company Name' LIMIT 1);

-- ============================================================================
-- QUICK FIXES
-- ============================================================================

-- Fix: Update employee company_id if wrong
-- UPDATE employer_employees
-- SET company_id = 'correct-company-id'
-- WHERE employee_id = 'employee-user-id';

-- Fix: Activate a schedule
-- UPDATE attendance_link_schedules
-- SET is_active = true
-- WHERE id = 'schedule-id';

-- Fix: Update office location coordinates
-- UPDATE office_locations
-- SET latitude = 24.7136, longitude = 46.6753
-- WHERE id = 'location-id';

