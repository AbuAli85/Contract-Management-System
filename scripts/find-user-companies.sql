-- =====================================================
-- Find Companies for User
-- =====================================================
-- Run this to see what companies exist for the user
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '6028483d-ed60-45af-a560-ab51c67479b7'; -- Muhammad Junaid's user ID
  v_user_email TEXT := 'junaidshahid691@gmail.com';
  company_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINDING COMPANIES FOR USER';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: %', v_user_email;
  RAISE NOTICE '';
  
  -- Check current active company
  RAISE NOTICE 'Current Active Company:';
  FOR company_rec IN
    SELECT 
      p.active_company_id,
      c.name AS company_name
    FROM profiles p
    LEFT JOIN companies c ON c.id = p.active_company_id
    WHERE p.id = v_user_id
  LOOP
    IF company_rec.active_company_id IS NOT NULL THEN
      RAISE NOTICE '  ✅ Active: % (ID: %)', company_rec.company_name, company_rec.active_company_id;
    ELSE
      RAISE NOTICE '  ❌ No active company set';
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Companies from company_members table:';
  FOR company_rec IN
    SELECT 
      cm.company_id,
      c.name AS company_name,
      cm.role,
      cm.status
    FROM company_members cm
    JOIN companies c ON c.id = cm.company_id
    WHERE cm.user_id = v_user_id
    ORDER BY cm.created_at DESC
  LOOP
    RAISE NOTICE '  - Company: %', company_rec.company_name;
    RAISE NOTICE '    ID: %', company_rec.company_id;
    RAISE NOTICE '    Role: %', company_rec.role;
    RAISE NOTICE '    Status: %', company_rec.status;
    RAISE NOTICE '';
  END LOOP;
  
  -- Check companies owned by user
  RAISE NOTICE 'Companies owned by user:';
  FOR company_rec IN
    SELECT 
      c.id AS company_id,
      c.name AS company_name
    FROM companies c
    WHERE c.owner_id = v_user_id
       OR c.created_by = v_user_id
    ORDER BY c.created_at DESC
  LOOP
    RAISE NOTICE '  - Company: %', company_rec.company_name;
    RAISE NOTICE '    ID: %', company_rec.company_id;
    RAISE NOTICE '';
  END LOOP;
  
  -- Check attendance links and their companies
  RAISE NOTICE 'Attendance Links and their Companies:';
  FOR company_rec IN
    SELECT DISTINCT
      al.company_id,
      c.name AS company_name,
      COUNT(*) AS link_count
    FROM attendance_links al
    LEFT JOIN companies c ON c.id = al.company_id
    WHERE al.created_by = v_user_id
       OR EXISTS (
         SELECT 1 FROM profiles p 
         WHERE p.id = v_user_id 
         AND p.active_company_id = al.company_id
       )
    GROUP BY al.company_id, c.name
    ORDER BY link_count DESC
  LOOP
    RAISE NOTICE '  - Company: %', company_rec.company_name;
    RAISE NOTICE '    ID: %', company_rec.company_id;
    RAISE NOTICE '    Links: %', company_rec.link_count;
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
END $$;

-- =====================================================
-- SIMPLE QUERY: Just get the companies
-- =====================================================

SELECT 
  'company_members' AS source,
  cm.company_id,
  c.name AS company_name,
  cm.role,
  cm.status
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
WHERE cm.user_id = '6028483d-ed60-45af-a560-ab51c67479b7'

UNION ALL

SELECT 
  'owned' AS source,
  c.id AS company_id,
  c.name AS company_name,
  'owner' AS role,
  'active' AS status
FROM companies c
WHERE c.owner_id = '6028483d-ed60-45af-a560-ab51c67479b7'
   OR c.created_by = '6028483d-ed60-45af-a560-ab51c67479b7'

ORDER BY company_name;

