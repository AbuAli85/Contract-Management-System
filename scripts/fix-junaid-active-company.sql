-- =====================================================
-- FIX: Set Active Company for Muhammad Junaid Setup
-- =====================================================
-- This ensures the attendance link shows in the UI
-- Run this AFTER running setup-attendance-muhammad-junaid.sql
-- This script will AUTO-DETECT the correct company
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '6028483d-ed60-45af-a560-ab51c67479b7'; -- Muhammad Junaid's user ID
  v_company_id UUID := NULL;
  v_company_name TEXT;
  v_profile_exists BOOLEAN;
  v_attendance_link_company_id UUID;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    RAISE EXCEPTION 'Profile not found for user ID: %', v_user_id;
  END IF;
  
  -- Strategy 1: Find company from attendance links created by this user
  SELECT company_id INTO v_attendance_link_company_id
  FROM attendance_links
  WHERE created_by = v_user_id
    AND company_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_attendance_link_company_id IS NOT NULL THEN
    v_company_id := v_attendance_link_company_id;
    RAISE NOTICE 'Found company from attendance links: %', v_company_id;
  END IF;
  
  -- Strategy 2: Find company from company_members
  IF v_company_id IS NULL THEN
    SELECT company_id INTO v_company_id
    FROM company_members
    WHERE user_id = v_user_id
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_company_id IS NOT NULL THEN
      RAISE NOTICE 'Found company from company_members: %', v_company_id;
    END IF;
  END IF;
  
  -- Strategy 3: Find company owned by user
  IF v_company_id IS NULL THEN
    BEGIN
      SELECT id INTO v_company_id
      FROM companies
      WHERE owner_id = v_user_id
         OR created_by = v_user_id
      ORDER BY created_at DESC
      LIMIT 1;
      
      IF v_company_id IS NOT NULL THEN
        RAISE NOTICE 'Found company owned by user: %', v_company_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- owner_id or created_by column might not exist
      NULL;
    END;
  END IF;
  
  -- Strategy 4: Find any company that has attendance links (fallback)
  IF v_company_id IS NULL THEN
    SELECT company_id INTO v_company_id
    FROM attendance_links
    WHERE company_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_company_id IS NOT NULL THEN
      RAISE NOTICE 'Found company from any attendance link: %', v_company_id;
    END IF;
  END IF;
  
  -- Verify company exists
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company found. Please: 1) Run scripts/find-user-companies.sql to see available companies, OR 2) Create a company first, OR 3) Manually set active_company_id';
  END IF;
  
  -- Get company name
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = v_company_id;
  
  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company ID % exists but name not found', v_company_id;
  END IF;
  
  -- Update profile with active company
  UPDATE profiles
  SET active_company_id = v_company_id,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ACTIVE COMPANY UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Company: %', v_company_name;
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ The attendance link should now appear in the UI!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Refresh the attendance links page in the UI';
  RAISE NOTICE '2. The link should now be visible';
  RAISE NOTICE '';
  
END $$;

-- =====================================================
-- VERIFY: Check current active company
-- =====================================================

SELECT 
  p.id AS user_id,
  p.email,
  p.full_name,
  p.active_company_id,
  c.name AS active_company_name,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = p.active_company_id) AS attendance_links_count
FROM profiles p
LEFT JOIN companies c ON c.id = p.active_company_id
WHERE p.id = '6028483d-ed60-45af-a560-ab51c67479b7';

