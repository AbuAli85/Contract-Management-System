-- =====================================================
-- Find Correct Company for Muhammad Junaid
-- =====================================================
-- This will help identify which of the 16 companies should be used
-- =====================================================

-- Step 1: See which company the attendance link is using
SELECT 
  'Attendance Link Company' AS source,
  al.company_id,
  c.name AS company_name,
  cg.name AS group_name,
  al.link_code,
  al.title
FROM attendance_links al
JOIN companies c ON c.id = al.company_id
LEFT JOIN company_groups cg ON cg.id = c.group_id
WHERE al.link_code = 'AA3555';

-- Step 2: List all companies the user has access to
SELECT 
  'User Access' AS source,
  cm.company_id,
  c.name AS company_name,
  cg.name AS group_name,
  cm.role,
  cm.status,
  c.is_active
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
LEFT JOIN company_groups cg ON cg.id = c.group_id
WHERE cm.user_id = '6028483d-ed60-45af-a560-ab51c67479b7'
ORDER BY cm.role, c.name;

-- Step 3: Show all companies in the system (to see the 16 companies)
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  cg.name AS group_name,
  c.is_active,
  CASE 
    WHEN EXISTS (SELECT 1 FROM company_members cm WHERE cm.company_id = c.id AND cm.user_id = '6028483d-ed60-45af-a560-ab51c67479b7') 
    THEN '✅ Has Access'
    ELSE '❌ No Access'
  END AS access_status,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = c.id) AS links_count
FROM companies c
LEFT JOIN company_groups cg ON cg.id = c.group_id
ORDER BY cg.name NULLS LAST, c.name;

-- Step 4: Recommendation - Which company should be active?
SELECT 
  'RECOMMENDATION' AS info,
  al.company_id AS recommended_company_id,
  c.name AS recommended_company_name,
  cg.name AS group_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM company_members cm 
      WHERE cm.company_id = al.company_id 
      AND cm.user_id = '6028483d-ed60-45af-a560-ab51c67479b7'
      AND cm.status = 'active'
    ) THEN '✅ User has access - Good choice'
    ELSE '⚠️ User may not have access - Check company_members table'
  END AS access_check
FROM attendance_links al
JOIN companies c ON c.id = al.company_id
LEFT JOIN company_groups cg ON cg.id = c.group_id
WHERE al.link_code = 'AA3555'
LIMIT 1;

