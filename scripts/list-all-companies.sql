-- =====================================================
-- List All Companies in Database
-- =====================================================
-- This will show all companies, their structure, and relationships
-- =====================================================

-- List all companies
SELECT 
  c.id,
  c.name,
  c.slug,
  c.is_active,
  c.created_at,
  c.owner_id,
  c.created_by,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = c.id) AS attendance_links_count,
  (SELECT COUNT(*) FROM company_members WHERE company_id = c.id) AS members_count
FROM companies c
ORDER BY c.created_at DESC;

-- List companies with their owners
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  c.is_active,
  p.id AS owner_id,
  p.email AS owner_email,
  p.full_name AS owner_name,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = c.id) AS links_count
FROM companies c
LEFT JOIN profiles p ON p.id = c.owner_id OR p.id = c.created_by
ORDER BY c.name;

-- List companies that have attendance links
SELECT DISTINCT
  c.id AS company_id,
  c.name AS company_name,
  COUNT(al.id) AS total_links,
  COUNT(CASE WHEN al.is_active = true AND al.valid_until > NOW() THEN 1 END) AS active_links
FROM companies c
INNER JOIN attendance_links al ON al.company_id = c.id
GROUP BY c.id, c.name
ORDER BY total_links DESC;

-- Check if there's a company_groups table
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE '%group%'
ORDER BY table_name, ordinal_position;

-- List company_members to see relationships
SELECT 
  cm.company_id,
  c.name AS company_name,
  cm.user_id,
  p.email AS user_email,
  p.full_name AS user_name,
  cm.role,
  cm.status
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
JOIN profiles p ON p.id = cm.user_id
ORDER BY c.name, cm.role;

