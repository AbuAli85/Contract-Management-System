-- =====================================================
-- Setup Attendance for Muhammad Junaid (Manual User ID)
-- Email: junaidshahid691@gmail.com
-- Daily: 1 PM to 10 PM (with 1 hour break)
-- Week Off: Tuesday
-- Location: Lulu Sohar
-- Client: OMASCO
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================
-- IMPORTANT: Update v_user_id below with your actual user ID
-- =====================================================

DO $$
DECLARE
  -- ✅ UPDATE THIS: Your User ID (get from auth.users table or your profile)
  v_user_id UUID := 'YOUR-USER-ID-HERE'; -- UPDATE THIS!
  
  -- Employee Details
  v_promoter_email TEXT := 'junaidshahid691@gmail.com';
  v_employee_name TEXT := 'Muhammad Junaid';
  
  -- Company Details
  v_company_name TEXT := 'Falcon Eye Modern Investments SPC'; -- UPDATE if different
  
  -- Location Details - Lulu Sohar
  v_location_name TEXT := 'Lulu Sohar';
  v_location_address TEXT := 'Lulu Hypermarket, Sohar, Oman';
  v_location_lat DECIMAL(10, 8) := 24.3647; -- Lulu Sohar coordinates
  v_location_lng DECIMAL(11, 8) := 56.7436; -- Lulu Sohar coordinates
  
  -- Work Schedule
  v_check_in_time TIME := '13:00:00'; -- 1:00 PM
  v_check_out_time TIME := '22:00:00'; -- 10:00 PM
  v_break_duration_hours DECIMAL := 1.0; -- 1 hour break
  
  -- Client Information
  v_client_name TEXT := 'OMASCO';
  
  -- Variables (don't modify)
  v_company_id UUID;
  v_profile_id UUID;
  v_employer_employee_id UUID;
  v_office_location_id UUID;
  v_schedule_id UUID;
  v_link_id UUID;
  v_link_code TEXT;
  v_party_id UUID;
BEGIN
  -- ✅ STEP 1: Validate user ID
  IF v_user_id = 'YOUR-USER-ID-HERE' OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please update v_user_id with your actual user ID. Run: SELECT id FROM auth.users WHERE email = ''your-email@example.com'';';
  END IF;
  
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User ID % not found in auth.users. Please verify your user ID.', v_user_id;
  END IF;
  
  -- ✅ STEP 2: Get company ID (try Falcon Eye Group first, then any company)
  SELECT id INTO v_company_id
  FROM companies
  WHERE (name ILIKE '%Falcon Eye%' OR name = v_company_name)
    AND owner_id = v_user_id
  LIMIT 1;
  
  IF v_company_id IS NULL THEN
    -- Try to get any company owned by user
    SELECT id INTO v_company_id
    FROM companies
    WHERE owner_id = v_user_id
    LIMIT 1;
    
    IF v_company_id IS NULL THEN
      RAISE EXCEPTION 'No company found for user %. Please create a company first.', v_user_id;
    END IF;
    
    RAISE NOTICE '⚠️ Using company ID: % (name may differ)', v_company_id;
  END IF;
  
  -- ✅ STEP 3: Get or create client party (OMASCO)
  SELECT id INTO v_party_id
  FROM parties
  WHERE name ILIKE '%OMASCO%'
    OR name ILIKE '%Omasco%'
  LIMIT 1;
  
  IF v_party_id IS NULL THEN
    -- Create OMASCO party if doesn't exist
    INSERT INTO parties (
      name,
      party_type,
      contact_email,
      created_by
    ) VALUES (
      'OMASCO',
      'client',
      NULL,
      v_user_id
    )
    RETURNING id INTO v_party_id;
    
    RAISE NOTICE '✅ Created OMASCO party: %', v_party_id;
  ELSE
    RAISE NOTICE '✅ OMASCO party already exists: %', v_party_id;
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
      job_title,
      department,
      party_id, -- Link to OMASCO client
      created_by
    ) VALUES (
      v_user_id,
      v_profile_id,
      v_company_id,
      'active',
      'full_time',
      'EMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(v_profile_id::TEXT, -4)),
      'Promoter', -- Job title
      'Sales', -- Department
      v_party_id, -- Link to OMASCO
      v_user_id
    )
    RETURNING id INTO v_employer_employee_id;
    
    RAISE NOTICE '✅ Created employer_employee record: %', v_employer_employee_id;
  ELSE
    -- Update existing record to link to OMASCO
    UPDATE employer_employees
    SET party_id = COALESCE(party_id, v_party_id),
        updated_at = NOW()
    WHERE id = v_employer_employee_id;
    
    RAISE NOTICE '✅ Employer_employee record already exists: % (updated with OMASCO link)', v_employer_employee_id;
  END IF;
  
  -- ✅ STEP 6: Create or get office location (Lulu Sohar)
  SELECT id INTO v_office_location_id
  FROM office_locations
  WHERE company_id = v_company_id
    AND (name = v_location_name OR name ILIKE '%lulu%sohar%')
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
      v_location_address,
      v_location_lat,
      v_location_lng,
      50, -- 50 meters radius
      v_user_id
    )
    RETURNING id INTO v_office_location_id;
    
    RAISE NOTICE '✅ Created office location (Lulu Sohar): %', v_office_location_id;
  ELSE
    RAISE NOTICE '✅ Office location (Lulu Sohar) already exists: %', v_office_location_id;
  END IF;
  
  -- ✅ STEP 7: Create attendance schedule
  -- Delete existing schedule if exists (to avoid duplicates)
  DELETE FROM attendance_link_schedules
  WHERE company_id = v_company_id
    AND name = 'Daily Check-In - ' || v_promoter_email;
  
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
    monday,    -- Monday: Working
    tuesday,   -- Tuesday: OFF (Week Off)
    wednesday, -- Wednesday: Working
    thursday,  -- Thursday: Working
    friday,    -- Friday: Working
    saturday,  -- Saturday: Working
    sunday,    -- Sunday: Working
    is_active,
    send_check_in_link,
    send_check_out_link,
    notification_method,
    send_before_minutes,
    created_by
  ) VALUES (
    v_company_id,
    'Daily Check-In - ' || v_promoter_email || ' (Lulu Sohar - OMASCO)',
    'Daily attendance schedule for ' || v_employee_name || ' at Lulu Sohar. Client: OMASCO. Working hours: 1 PM to 10 PM with 1 hour break. Week off: Tuesday.',
    v_office_location_id,
    v_location_lat,
    v_location_lng,
    50, -- 50 meters radius
    v_check_in_time, -- 1:00 PM
    v_check_out_time, -- 10:00 PM
    'selected',
    ARRAY[v_employer_employee_id]::UUID[],
    true,  -- Monday: Working
    false, -- Tuesday: OFF (Week Off)
    true,  -- Wednesday: Working
    true,  -- Thursday: Working
    true,  -- Friday: Working
    true,  -- Saturday: Working
    true,  -- Sunday: Working
    true,  -- Active
    true,  -- Send check-in link
    true,  -- Send check-out link
    ARRAY['email']::TEXT[], -- Notification method
    15,    -- Send 15 minutes before check-in
    v_user_id
  )
  RETURNING id INTO v_schedule_id;
  
  RAISE NOTICE '✅ Created attendance schedule: %', v_schedule_id;
  
  -- ✅ STEP 8: Generate attendance link for today
  -- Generate unique link code
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
    'Check-In Link - ' || v_employee_name || ' - ' || TO_CHAR(NOW(), 'YYYY-MM-DD'),
    v_location_lat,
    v_location_lng,
    50,
    NOW() - INTERVAL '15 minutes', -- Valid from 15 min ago
    NOW() + INTERVAL '12 hours',    -- Valid until end of day
    true,
    1, -- Single use
    v_office_location_id
  )
  ON CONFLICT (link_code) DO UPDATE
  SET valid_until = NOW() + INTERVAL '12 hours',
      updated_at = NOW()
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
  RAISE NOTICE '👤 Employee: %', v_employee_name;
  RAISE NOTICE '📧 Email: %', v_promoter_email;
  RAISE NOTICE '🏢 Company: %', v_company_id;
  RAISE NOTICE '📍 Location: Lulu Sohar';
  RAISE NOTICE '👔 Client: OMASCO';
  RAISE NOTICE '';
  RAISE NOTICE '⏰ Work Schedule:';
  RAISE NOTICE '   Check-In: 1:00 PM (13:00)';
  RAISE NOTICE '   Check-Out: 10:00 PM (22:00)';
  RAISE NOTICE '   Break: 1 hour';
  RAISE NOTICE '   Week Off: Tuesday';
  RAISE NOTICE '';
  RAISE NOTICE '📋 IDs:';
  RAISE NOTICE '   Employee ID: %', v_employer_employee_id;
  RAISE NOTICE '   Office Location ID: %', v_office_location_id;
  RAISE NOTICE '   Schedule ID: %', v_schedule_id;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 CHECK-IN LINK FOR TODAY:';
  RAISE NOTICE 'https://portal.thesmartpro.io/en/attendance/check-in/%', v_link_code;
  RAISE NOTICE '';
  RAISE NOTICE '📧 Share this link with:';
  RAISE NOTICE '   %', v_promoter_email;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Next Steps:';
  RAISE NOTICE '1. Share the check-in link with the employee';
  RAISE NOTICE '2. Schedule will auto-generate links daily (except Tuesday)';
  RAISE NOTICE '3. Employee will receive email notifications';
  RAISE NOTICE '4. Review attendance in Team Management → Attendance Approval';
  RAISE NOTICE '5. Generate reports in Team Management → Reports';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Setup Complete!';
  RAISE NOTICE '';
  
END $$;

