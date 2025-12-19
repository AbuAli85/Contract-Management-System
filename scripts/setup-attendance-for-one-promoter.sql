-- =====================================================
-- Setup Attendance for One Promoter - Best Practice
-- =====================================================
-- This script configures complete attendance system for a single promoter
-- Run this in Supabase SQL Editor after updating the variables below
-- =====================================================

DO $$
DECLARE
  -- ✅ STEP 1: UPDATE THESE VARIABLES
  v_promoter_email TEXT := 'promoter@example.com'; -- UPDATE: Promoter's email
  v_company_name TEXT := 'Your Company Name'; -- UPDATE: Your company name
  v_location_name TEXT := 'Work Location Name'; -- UPDATE: Location name
  v_location_lat DECIMAL(10, 8) := 23.6145; -- UPDATE: Latitude
  v_location_lng DECIMAL(11, 8) := 58.5459; -- UPDATE: Longitude
  v_check_in_time TIME := '09:00:00'; -- UPDATE: Check-in time
  v_check_out_time TIME := '17:00:00'; -- UPDATE: Check-out time
  
  -- Variables (don't modify)
  v_user_id UUID;
  v_company_id UUID;
  v_profile_id UUID;
  v_employer_employee_id UUID;
  v_office_location_id UUID;
  v_schedule_id UUID;
  v_link_id UUID;
  v_link_code TEXT;
BEGIN
  -- ✅ STEP 2: Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in. Please authenticate first.';
  END IF;
  
  -- ✅ STEP 3: Get company ID
  SELECT id INTO v_company_id
  FROM companies
  WHERE name = v_company_name
    AND owner_id = v_user_id
  LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company "%" not found. Please check the company name.', v_company_name;
  END IF;
  
  -- ✅ STEP 4: Get promoter profile ID
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE email = v_promoter_email
  LIMIT 1;
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for email: %. Please ensure the promoter has a profile.', v_promoter_email;
  END IF;
  
  -- ✅ STEP 5: Ensure employer_employee record exists
  SELECT id INTO v_employer_employee_id
  FROM employer_employees
  WHERE employee_id = v_profile_id
    AND employer_id = v_user_id
    AND company_id = v_company_id
  LIMIT 1;
  
  IF v_employer_employee_id IS NULL THEN
    -- Create employer_employee record
    INSERT INTO employer_employees (
      employer_id,
      employee_id,
      company_id,
      employment_status,
      employment_type,
      employee_code,
      created_by
    ) VALUES (
      v_user_id,
      v_profile_id,
      v_company_id,
      'active',
      'full_time',
      'EMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(v_profile_id::TEXT, -4)),
      v_user_id
    )
    RETURNING id INTO v_employer_employee_id;
    
    RAISE NOTICE '✅ Created employer_employee record: %', v_employer_employee_id;
  ELSE
    RAISE NOTICE '✅ Employer_employee record already exists: %', v_employer_employee_id;
  END IF;
  
  -- ✅ STEP 6: Create or get office location
  SELECT id INTO v_office_location_id
  FROM office_locations
  WHERE company_id = v_company_id
    AND name = v_location_name
  LIMIT 1;
  
  IF v_office_location_id IS NULL THEN
    INSERT INTO office_locations (
      company_id,
      name,
      address,
      latitude,
      longitude,
      radius_meters,
      created_by
    ) VALUES (
      v_company_id,
      v_location_name,
      v_location_name, -- Update with full address if available
      v_location_lat,
      v_location_lng,
      50, -- Default 50 meters radius
      v_user_id
    )
    RETURNING id INTO v_office_location_id;
    
    RAISE NOTICE '✅ Created office location: %', v_office_location_id;
  ELSE
    RAISE NOTICE '✅ Office location already exists: %', v_office_location_id;
  END IF;
  
  -- ✅ STEP 7: Create attendance schedule
  INSERT INTO attendance_link_schedules (
    company_id,
    name,
    description,
    office_location_id,
    target_latitude,
    target_longitude,
    allowed_radius_meters,
    check_in_time,
    check_out_time,
    assignment_type,
    specific_employee_ids,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
    is_active,
    send_check_in_link,
    send_check_out_link,
    notification_method,
    send_before_minutes,
    created_by
  ) VALUES (
    v_company_id,
    'Daily Check-In - ' || v_promoter_email,
    'Automated daily check-in schedule for ' || v_promoter_email,
    v_office_location_id,
    v_location_lat,
    v_location_lng,
    50,
    v_check_in_time,
    v_check_out_time,
    'selected',
    ARRAY[v_employer_employee_id]::UUID[],
    true,  -- Monday
    true,  -- Tuesday
    true,  -- Wednesday
    true,  -- Thursday
    true,  -- Friday
    false, -- Saturday
    false, -- Sunday
    true,  -- Active
    true,  -- Send check-in link
    true,  -- Send check-out link
    ARRAY['email']::TEXT[], -- Notification method
    15,    -- Send 15 minutes before
    v_user_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_schedule_id;
  
  IF v_schedule_id IS NULL THEN
    -- Schedule might already exist, get it
    SELECT id INTO v_schedule_id
    FROM attendance_link_schedules
    WHERE company_id = v_company_id
      AND name = 'Daily Check-In - ' || v_promoter_email
    LIMIT 1;
    
    RAISE NOTICE '✅ Attendance schedule already exists: %', v_schedule_id;
  ELSE
    RAISE NOTICE '✅ Created attendance schedule: %', v_schedule_id;
  END IF;
  
  -- ✅ STEP 8: Generate attendance link for today (optional)
  -- Generate link code
  SELECT code INTO v_link_code
  FROM (
    SELECT UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 6)) AS code
  ) AS codes
  WHERE NOT EXISTS (
    SELECT 1 FROM attendance_links WHERE link_code = codes.code
  )
  LIMIT 1;
  
  IF v_link_code IS NULL THEN
    v_link_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 6));
  END IF;
  
  -- Create attendance link for today
  INSERT INTO attendance_links (
    company_id,
    created_by,
    link_code,
    title,
    target_latitude,
    target_longitude,
    allowed_radius_meters,
    valid_from,
    valid_until,
    is_active,
    max_uses,
    office_location_id
  ) VALUES (
    v_company_id,
    v_user_id,
    v_link_code,
    'Check-In Link - ' || TO_CHAR(NOW(), 'YYYY-MM-DD'),
    v_location_lat,
    v_location_lng,
    50,
    NOW() - INTERVAL '15 minutes', -- Valid from 15 min ago
    NOW() + INTERVAL '8 hours',    -- Valid until end of day
    true,
    1, -- Single use
    v_office_location_id
  )
  ON CONFLICT (link_code) DO NOTHING
  RETURNING id INTO v_link_id;
  
  IF v_link_id IS NULL THEN
    SELECT id INTO v_link_id
    FROM attendance_links
    WHERE link_code = v_link_code
    LIMIT 1;
  END IF;
  
  -- ✅ STEP 9: Display results
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ATTENDANCE SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Employee ID: %', v_employer_employee_id;
  RAISE NOTICE 'Office Location ID: %', v_office_location_id;
  RAISE NOTICE 'Schedule ID: %', v_schedule_id;
  RAISE NOTICE '';
  RAISE NOTICE '📋 CHECK-IN LINK FOR TODAY:';
  RAISE NOTICE 'https://portal.thesmartpro.io/en/attendance/check-in/%', v_link_code;
  RAISE NOTICE '';
  RAISE NOTICE '📧 Share this link with the employee:';
  RAISE NOTICE 'Email: %', v_promoter_email;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Next Steps:';
  RAISE NOTICE '1. Share the check-in link with the employee';
  RAISE NOTICE '2. Schedule will auto-generate links daily';
  RAISE NOTICE '3. Employee will receive email notifications';
  RAISE NOTICE '4. Review attendance in Team Management → Attendance';
  RAISE NOTICE '';
  
END $$;

