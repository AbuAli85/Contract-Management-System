-- =====================================================
-- List All Companies with Group Information
-- =====================================================
-- This will show all 16+ companies and their group structure
-- =====================================================

-- Check if company_groups table exists and list groups
SELECT 
  'company_groups' AS table_name,
  COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'company_groups';

-- List all companies with their group information
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  c.slug,
  c.is_active,
  cg.id AS group_id,
  cg.name AS group_name,
  c.owner_id,
  c.created_by,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = c.id) AS attendance_links_count,
  (SELECT COUNT(*) FROM company_members WHERE company_id = c.id AND status = 'active') AS active_members_count
FROM companies c
LEFT JOIN company_groups cg ON cg.id = c.group_id
ORDER BY 
  COALESCE(cg.name, 'No Group') ASC,
  c.name ASC;

-- List companies that belong to "Falcon Eye" group
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  c.is_active,
  cg.name AS group_name,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = c.id) AS links_count
FROM companies c
LEFT JOIN company_groups cg ON cg.id = c.group_id
WHERE cg.name ILIKE '%falcon%eye%'
   OR c.name ILIKE '%falcon%eye%'
ORDER BY c.name;

-- List all company groups
SELECT 
  cg.id AS group_id,
  cg.name AS group_name,
  COUNT(c.id) AS companies_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) AS company_names
FROM company_groups cg
LEFT JOIN companies c ON c.group_id = cg.id
GROUP BY cg.id, cg.name
ORDER BY companies_count DESC, cg.name;

-- Find which company the attendance link belongs to and its group
SELECT 
  al.link_code,
  al.company_id,
  c.name AS company_name,
  cg.id AS group_id,
  cg.name AS group_name,
  al.title,
  al.is_active,
  al.valid_until
FROM attendance_links al
JOIN companies c ON c.id = al.company_id
LEFT JOIN company_groups cg ON cg.id = c.group_id
WHERE al.link_code = 'AA3555';

-- List all companies for the user (from company_members)
SELECT 
  cm.company_id,
  c.name AS company_name,
  cg.name AS group_name,
  cm.role AS user_role,
  cm.status AS membership_status,
  c.is_active AS company_active,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = c.id) AS links_count
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
LEFT JOIN company_groups cg ON cg.id = c.group_id
WHERE cm.user_id = '6028483d-ed60-45af-a560-ab51c67479b7'
ORDER BY cg.name NULLS LAST, c.name;

