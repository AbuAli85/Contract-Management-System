-- =====================================================
-- Update Muhammad Junaid to Correct Company
-- =====================================================
-- INSTRUCTIONS:
-- 1. First run: scripts/identify-junaid-company.sql
-- 2. Find the correct company_id from the results
-- 3. Update the COMPANY_ID below
-- 4. Run this script
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '6028483d-ed60-45af-a560-ab51c67479b7';
  v_employee_profile_id UUID;
  v_correct_company_id UUID := NULL; -- ⚠️ UPDATE THIS with the correct company ID
  v_company_name TEXT;
  v_employer_employee_id UUID;
BEGIN
  -- Get employee profile ID
  SELECT id INTO v_employee_profile_id
  FROM profiles
  WHERE email = 'junaidshahid691@gmail.com';
  
  IF v_employee_profile_id IS NULL THEN
    RAISE EXCEPTION 'Employee profile not found for junaidshahid691@gmail.com';
  END IF;
  
  -- ⚠️ IMPORTANT: Set the correct company ID here
  -- Get it from running scripts/find-omasco-lulu-company.sql first
  IF v_correct_company_id IS NULL THEN
    -- Strategy 1: Find company that has BOTH OMASCO client AND Lulu Sohar location
    SELECT c.id INTO v_correct_company_id
    FROM companies c
    WHERE c.name ILIKE '%falcon%eye%'
      AND c.name != 'falcon eye group'  -- Exclude the group
      AND EXISTS (
        SELECT 1 FROM employer_employees ee
        JOIN parties p ON p.id = ee.party_id
        WHERE ee.company_id = c.id 
        AND p.name_en ILIKE '%OMASCO%'
      )
      AND EXISTS (
        SELECT 1 FROM office_locations ol
        WHERE ol.company_id = c.id
        AND (ol.name ILIKE '%lulu%sohar%' OR ol.address ILIKE '%lulu%sohar%' OR ol.address ILIKE '%sohar%')
      )
    ORDER BY c.name
    LIMIT 1;
    
    IF v_correct_company_id IS NOT NULL THEN
      RAISE NOTICE 'Auto-detected company with both OMASCO and Lulu Sohar: %', v_correct_company_id;
    END IF;
  END IF;
  
  -- Strategy 2: If not found, try company with OMASCO client
  IF v_correct_company_id IS NULL THEN
    SELECT DISTINCT c.id INTO v_correct_company_id
    FROM companies c
    JOIN employer_employees ee ON ee.company_id = c.id
    JOIN parties p ON p.id = ee.party_id
    WHERE c.name ILIKE '%falcon%eye%'
      AND c.name != 'falcon eye group'
      AND p.name_en ILIKE '%OMASCO%'
      AND ee.employee_id = v_employee_profile_id
    ORDER BY c.name
    LIMIT 1;
    
    IF v_correct_company_id IS NOT NULL THEN
      RAISE NOTICE 'Auto-detected company with OMASCO client: %', v_correct_company_id;
    END IF;
  END IF;
  
  -- Strategy 3: If still not found, try company with Lulu Sohar location
  IF v_correct_company_id IS NULL THEN
    SELECT DISTINCT c.id INTO v_correct_company_id
    FROM companies c
    JOIN office_locations ol ON ol.company_id = c.id
    WHERE c.name ILIKE '%falcon%eye%'
      AND c.name != 'falcon eye group'
      AND (ol.name ILIKE '%lulu%sohar%' OR ol.address ILIKE '%lulu%sohar%' OR ol.address ILIKE '%sohar%')
    ORDER BY c.name
    LIMIT 1;
    
    IF v_correct_company_id IS NOT NULL THEN
      RAISE NOTICE 'Auto-detected company with Lulu Sohar location: %', v_correct_company_id;
    END IF;
  END IF;
  
  -- Strategy 4: Fallback to employer_employees
  IF v_correct_company_id IS NULL THEN
    SELECT company_id INTO v_correct_company_id
    FROM employer_employees
    WHERE employee_id = v_employee_profile_id
      AND company_id IN (SELECT id FROM companies WHERE name ILIKE '%falcon%eye%' AND name != 'falcon eye group')
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_correct_company_id IS NOT NULL THEN
      RAISE NOTICE 'Auto-detected from employer_employees: %', v_correct_company_id;
    END IF;
  END IF;
  
  IF v_correct_company_id IS NULL THEN
    RAISE EXCEPTION 'No company found. Please: 1) Run scripts/find-omasco-lulu-company.sql to find the correct company, 2) Manually set v_correct_company_id in this script with the correct company ID';
  END IF;
  
  -- Get company name
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = v_correct_company_id;
  
  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', v_correct_company_id;
  END IF;
  
  -- Step 1: Update active_company_id in profile
  UPDATE profiles
  SET active_company_id = v_correct_company_id,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Updated active_company_id to: % (%)', v_company_name, v_correct_company_id;
  
  -- Step 2: Ensure user has access in company_members
  IF NOT EXISTS (
    SELECT 1 FROM company_members 
    WHERE company_id = v_correct_company_id 
    AND user_id = v_user_id
  ) THEN
    INSERT INTO company_members (
      company_id,
      user_id,
      role,
      status,
      is_primary
    ) VALUES (
      v_correct_company_id,
      v_user_id,
      'member',
      'active',
      false
    );
    
    RAISE NOTICE '✅ Added user to company_members table';
  ELSE
    RAISE NOTICE '✅ User already has access in company_members';
  END IF;
  
  -- Step 3: Update attendance link to use correct company (if different)
  UPDATE attendance_links
  SET company_id = v_correct_company_id,
      updated_at = NOW()
  WHERE link_code = 'AA3555'
    AND company_id != v_correct_company_id;
  
  IF FOUND THEN
    RAISE NOTICE '✅ Updated attendance link AA3555 to use company: %', v_company_name;
  ELSE
    RAISE NOTICE '✅ Attendance link already uses correct company';
  END IF;
  
  -- Step 4: Update employer_employees company_id if different
  SELECT id INTO v_employer_employee_id
  FROM employer_employees
  WHERE employee_id = v_employee_profile_id
  LIMIT 1;
  
  IF v_employer_employee_id IS NOT NULL THEN
    UPDATE employer_employees
    SET company_id = v_correct_company_id,
        updated_at = NOW()
    WHERE id = v_employer_employee_id
      AND company_id != v_correct_company_id;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Updated employer_employees record to use company: %', v_company_name;
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ UPDATE COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Company: %', v_company_name;
  RAISE NOTICE 'Company ID: %', v_correct_company_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Refresh the attendance links page in UI';
  RAISE NOTICE '2. The link should now appear';
  RAISE NOTICE '';
  
END $$;

