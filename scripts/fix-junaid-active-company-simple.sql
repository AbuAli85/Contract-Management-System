-- =====================================================
-- SIMPLE FIX: Set Active Company (Direct)
-- =====================================================
-- Company ID found from attendance link: 31741f22-7372-4f5f-9c3d-0fe7455b46dd
-- =====================================================

-- Set active company directly
UPDATE profiles
SET active_company_id = '31741f22-7372-4f5f-9c3d-0fe7455b46dd',
    updated_at = NOW()
WHERE id = '6028483d-ed60-45af-a560-ab51c67479b7';

-- Verify the update
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

-- Show the attendance links that should now be visible
SELECT 
  al.link_code,
  al.title,
  al.is_active,
  al.valid_from,
  al.valid_until,
  CONCAT('https://portal.thesmartpro.io/en/attendance/check-in/', al.link_code) AS check_in_url
FROM attendance_links al
WHERE al.company_id = '31741f22-7372-4f5f-9c3d-0fe7455b46dd'
ORDER BY al.created_at DESC;

