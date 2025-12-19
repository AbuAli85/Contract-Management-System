-- =====================================================
-- Quick Company Creation Script
-- Creates a company for the user if none exists
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '6028483d-ed60-45af-a560-ab51c67479b7'; -- Your user ID
  v_company_name TEXT := 'Falcon Eye Modern Investments SPC'; -- Company name
  v_company_id UUID;
BEGIN
  -- Check if company already exists
  SELECT id INTO v_company_id
  FROM companies
  WHERE owner_id = v_user_id
    AND (name = v_company_name OR name ILIKE '%Falcon Eye%')
  LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    RAISE NOTICE '✅ Company already exists: % (ID: %)', v_company_name, v_company_id;
    RETURN;
  END IF;
  
  -- Create company
  INSERT INTO companies (
    name,
    owner_id,
    is_active
  ) VALUES (
    v_company_name,
    v_user_id,
    true
  )
  RETURNING id INTO v_company_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPANY CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Company Name: %', v_company_name;
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Owner ID: %', v_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ You can now run the attendance setup script!';
  RAISE NOTICE '';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating company: %', SQLERRM;
  RAISE EXCEPTION 'Failed to create company: %', SQLERRM;
END $$;


