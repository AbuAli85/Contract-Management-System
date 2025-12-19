-- =====================================================
-- Ensure Muhammad Junaid Has Company Access
-- =====================================================
-- This ensures the user can see the attendance link in UI
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '6028483d-ed60-45af-a560-ab51c67479b7';
  v_company_id UUID := '31741f22-7372-4f5f-9c3d-0fe7455b46dd'; -- falcon eye group
  v_company_name TEXT;
  v_has_access BOOLEAN;
BEGIN
  -- Get company name
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = v_company_id;
  
  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', v_company_id;
  END IF;
  
  -- Check if user already has access
  SELECT EXISTS(
    SELECT 1 FROM company_members 
    WHERE company_id = v_company_id 
    AND user_id = v_user_id
    AND status = 'active'
  ) INTO v_has_access;
  
  IF NOT v_has_access THEN
    -- Add user to company_members
    INSERT INTO company_members (
      company_id,
      user_id,
      role,
      status,
      is_primary
    ) VALUES (
      v_company_id,
      v_user_id,
      'member',
      'active',
      false
    )
    ON CONFLICT (company_id, user_id) 
    DO UPDATE SET 
      status = 'active',
      updated_at = NOW();
    
    RAISE NOTICE '✅ Added user to company_members for: %', v_company_name;
  ELSE
    RAISE NOTICE '✅ User already has access to: %', v_company_name;
  END IF;
  
  -- Ensure active_company_id is set
  UPDATE profiles
  SET active_company_id = v_company_id,
      updated_at = NOW()
  WHERE id = v_user_id
    AND (active_company_id IS NULL OR active_company_id != v_company_id);
  
  IF FOUND THEN
    RAISE NOTICE '✅ Updated active_company_id to: %', v_company_name;
  ELSE
    RAISE NOTICE '✅ active_company_id already set correctly';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Company: %', v_company_name;
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE '';
  RAISE NOTICE 'The attendance link should now appear in the UI!';
  RAISE NOTICE 'Link Code: AA3555';
  RAISE NOTICE 'URL: https://portal.thesmartpro.io/en/attendance/check-in/AA3555';
  RAISE NOTICE '';
  
END $$;

