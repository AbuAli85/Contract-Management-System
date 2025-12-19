-- =====================================================
-- Get Check-In Link for Muhammad Junaid
-- Email: junaidshahid691@gmail.com
-- =====================================================
-- Run this in Supabase SQL Editor to get the check-in link
-- =====================================================

SELECT 
  al.link_code,
  al.title,
  al.valid_from,
  al.valid_until,
  al.is_active,
  al.current_uses,
  al.max_uses,
  CONCAT('https://portal.thesmartpro.io/en/attendance/check-in/', al.link_code) AS check_in_url,
  p.email AS employee_email,
  p.full_name AS employee_name,
  c.name AS company_name
FROM attendance_links al
LEFT JOIN profiles p ON al.created_by = p.id
LEFT JOIN companies c ON al.company_id = c.id
WHERE 
  -- Find links for Muhammad Junaid's company
  al.company_id = '8776a032-5dad-4cd0-b0f8-c3cdd64e2831'
  -- Or find by employee email
  OR p.email = 'junaidshahid691@gmail.com'
  -- Or find the most recent active link
  OR (al.is_active = true AND al.valid_until > NOW())
ORDER BY al.created_at DESC
LIMIT 5;

-- =====================================================
-- Alternative: Get link by employee profile
-- =====================================================

SELECT 
  al.link_code,
  CONCAT('https://portal.thesmartpro.io/en/attendance/check-in/', al.link_code) AS check_in_url,
  al.title,
  al.valid_from,
  al.valid_until,
  al.is_active,
  CASE 
    WHEN al.valid_until < NOW() THEN 'EXPIRED'
    WHEN al.is_active = false THEN 'INACTIVE'
    WHEN al.max_uses IS NOT NULL AND al.current_uses >= al.max_uses THEN 'MAX_USES_REACHED'
    ELSE 'ACTIVE'
  END AS status,
  p.email AS employee_email,
  p.full_name AS employee_name
FROM attendance_links al
INNER JOIN profiles p ON al.created_by = p.id
WHERE p.email = 'junaidshahid691@gmail.com'
ORDER BY al.created_at DESC
LIMIT 1;

-- =====================================================
-- Get ALL active links for today
-- =====================================================

SELECT 
  al.link_code,
  CONCAT('https://portal.thesmartpro.io/en/attendance/check-in/', al.link_code) AS check_in_url,
  al.title,
  al.valid_from,
  al.valid_until,
  al.is_active,
  p.email AS employee_email,
  p.full_name AS employee_name,
  c.name AS company_name
FROM attendance_links al
LEFT JOIN profiles p ON al.created_by = p.id
LEFT JOIN companies c ON al.company_id = c.id
WHERE 
  al.is_active = true
  AND al.valid_from <= NOW()
  AND al.valid_until > NOW()
ORDER BY al.created_at DESC;

