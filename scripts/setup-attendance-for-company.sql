-- ============================================================================
-- SETUP ATTENDANCE FOR SPECIFIC COMPANY
-- ============================================================================
-- This script sets up attendance for a specific company
-- Replace 'YOUR-COMPANY-ID-HERE' with one of the company IDs from your list
-- ============================================================================

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_company_name TEXT;
BEGIN
  -- ========================================================================
  -- STEP 1: SET YOUR COMPANY ID HERE
  -- ========================================================================
  -- Choose one from your list and paste the ID here:
  -- Examples:
  --   'a7453123-f814-47a5-b3fa-e119eb5f2da6'  -- Amjad Al Maerifa LLC
  --   'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'  -- Digital Morph
  --   '6233e133-3f6f-4c22-b845-afabf81e7962'  -- smartPRO
  --   '29de0cc7-f704-41a1-bd43-1da1e48d0d46'  -- Vision Electronics LLC
  -- ========================================================================
  
  v_company_id := 'YOUR-COMPANY-ID-HERE'::UUID;  -- ⬅️ UPDATE THIS!
  
  -- Verify company exists
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = v_company_id;
  
  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company not found. Please check the company ID.';
  END IF;

  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in. Please authenticate first.';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP STARTING';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Company: %', v_company_name;
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '========================================';

  -- STEP 2: Create Office Location
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

  -- STEP 3: Verify Employee Records
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

  -- STEP 4: Create Employee Group
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

  -- STEP 5: Create Attendance Schedule
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

  RAISE NOTICE '✓ Attendance schedule created (if not exists)';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Update office location coordinates (currently using example values)';
  RAISE NOTICE '2. Assign employees to groups (via UI: /en/employer/attendance-groups)';
  RAISE NOTICE '3. Test employee check-in (via UI: /en/attendance)';
  RAISE NOTICE '4. Test manager approval (via UI: /en/employer/attendance-approval)';

END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify setup (replace with your company ID)
-- ============================================================================

-- SELECT 
--   ol.id,
--   ol.name,
--   ol.latitude,
--   ol.longitude,
--   ol.radius_meters
-- FROM office_locations ol
-- WHERE ol.company_id = 'YOUR-COMPANY-ID-HERE'::UUID;

