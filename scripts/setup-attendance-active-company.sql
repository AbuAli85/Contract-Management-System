-- ============================================================================
-- SETUP ATTENDANCE FOR YOUR ACTIVE COMPANY
-- ============================================================================
-- This script automatically uses your active company from your profile
-- No need to manually enter company ID!
-- ============================================================================

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_company_name TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in. Please authenticate first.';
  END IF;

  -- Get your active company from profile
  SELECT 
    p.active_company_id,
    c.name
  INTO v_company_id, v_company_name
  FROM profiles p
  LEFT JOIN companies c ON c.id = p.active_company_id
  WHERE p.id = v_user_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No active company found. Please set your active company first in the UI or run: UPDATE profiles SET active_company_id = ''your-company-id'' WHERE id = auth.uid();';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP STARTING';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Company: %', v_company_name;
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '========================================';

  -- STEP 1: Create Office Location
  -- ⚠️ IMPORTANT: Update coordinates with your actual office location
  -- Get coordinates from Google Maps: https://maps.google.com
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

  RAISE NOTICE '✓ Office location created (if not exists)';

  -- STEP 2: Verify Employee Records
  RAISE NOTICE 'Employee Records:';
  RAISE NOTICE '  Total employees: %', (
    SELECT COUNT(*) FROM employer_employees 
    WHERE company_id = v_company_id
  );
  RAISE NOTICE '  Active employees: %', (
    SELECT COUNT(*) FROM employer_employees 
    WHERE company_id = v_company_id 
    AND employment_status = 'active'
  );

  -- STEP 3: Create Employee Group
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

  RAISE NOTICE '✓ Employee group created (if not exists)';

  -- STEP 4: Create Attendance Schedule (Optional but Recommended)
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
    saturday,
    sunday,
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
    '09:00:00'::TIME,  -- UPDATE: Your check-in time (24-hour format)
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

  RAISE NOTICE '✓ Attendance schedule created (if not exists)';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Update office location coordinates (currently using example values)';
  RAISE NOTICE '2. Assign employees to groups (via UI: /en/employer/attendance-groups)';
  RAISE NOTICE '3. Test employee check-in (via UI: /en/attendance)';
  RAISE NOTICE '4. Test manager approval (via UI: /en/employer/attendance-approval)';
  RAISE NOTICE '5. Verify cron job is running (check /api/cron/generate-attendance-links)';

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
WHERE company_id = (SELECT active_company_id FROM profiles WHERE id = auth.uid());

-- Check employee records
SELECT 
  ee.id,
  p.full_name,
  p.email,
  ee.company_id,
  ee.employment_status
FROM employer_employees ee
JOIN profiles p ON p.id = ee.employee_id
WHERE ee.company_id = (SELECT active_company_id FROM profiles WHERE id = auth.uid());

-- Check employee groups
SELECT 
  id,
  name,
  group_type,
  employee_count
FROM employee_attendance_groups
WHERE company_id = (SELECT active_company_id FROM profiles WHERE id = auth.uid());

-- Check attendance schedules
SELECT 
  id,
  name,
  is_active,
  check_in_time,
  monday, tuesday, wednesday, thursday, friday, saturday, sunday
FROM attendance_link_schedules
WHERE company_id = (SELECT active_company_id FROM profiles WHERE id = auth.uid());

