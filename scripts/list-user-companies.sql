-- =====================================================
-- List Companies for User
-- Run this first to see what companies you have
-- =====================================================

-- Replace with your user ID or email
DO $$
DECLARE
  v_user_id UUID := '6028483d-ed60-45af-a560-ab51c67479b7'; -- Your user ID
  v_user_email TEXT := 'junaidshahid691@gmail.com'; -- Your email
BEGIN
  -- Try to get user ID from email if not provided
  IF v_user_id IS NULL OR v_user_id = '00000000-0000-0000-0000-000000000000' THEN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_user_email
    LIMIT 1;
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found. Please update v_user_id or v_user_email.';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Companies for User: %', v_user_email;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- List all companies owned by this user
  FOR company_rec IN 
    SELECT id, name, is_active, created_at
    FROM companies
    WHERE owner_id = v_user_id
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE 'Company ID: %', company_rec.id;
    RAISE NOTICE 'Company Name: %', company_rec.name;
    RAISE NOTICE 'Is Active: %', company_rec.is_active;
    RAISE NOTICE 'Created: %', company_rec.created_at;
    RAISE NOTICE '---';
  END LOOP;
  
  -- Count companies
  DECLARE
    v_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_count
    FROM companies
    WHERE owner_id = v_user_id;
    
    IF v_count = 0 THEN
      RAISE NOTICE '⚠️ No companies found for this user.';
      RAISE NOTICE '';
      RAISE NOTICE 'To create a company, run:';
      RAISE NOTICE 'INSERT INTO companies (name, owner_id, is_active)';
      RAISE NOTICE 'VALUES (''Your Company Name'', ''%'', true);', v_user_id;
    ELSE
      RAISE NOTICE '✅ Found % company(ies)', v_count;
    END IF;
  END;
  
  RAISE NOTICE '';
END $$;



