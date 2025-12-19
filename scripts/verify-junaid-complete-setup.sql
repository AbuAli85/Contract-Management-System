-- =====================================================
-- Verify Complete Setup for Muhammad Junaid
-- =====================================================
-- This confirms everything is properly connected
-- =====================================================

-- Complete setup verification
SELECT 
  '✅ COMPLETE SETUP VERIFICATION' AS status,
  p.id AS user_id,
  p.email,
  p.full_name,
  p.active_company_id,
  c.name AS active_company_name,
  CASE 
    WHEN p.active_company_id = '31741f22-7372-4f5f-9c3d-0fe7455b46dd' THEN '✅ Correct'
    ELSE '❌ Wrong company'
  END AS company_check
FROM profiles p
LEFT JOIN companies c ON c.id = p.active_company_id
WHERE p.id = '6028483d-ed60-45af-a560-ab51c67479b7';

-- Check employer_employee record
SELECT 
  '✅ EMPLOYER_EMPLOYEE RECORD' AS status,
  ee.id AS employer_employee_id,
  ee.company_id,
  c.name AS company_name,
  ee.party_id,
  p.name_en AS client_name,
  ee.employment_status,
  ee.job_title
FROM employer_employees ee
JOIN companies c ON c.id = ee.company_id
LEFT JOIN parties p ON p.id = ee.party_id
WHERE ee.employee_id = (
  SELECT id FROM profiles WHERE email = 'junaidshahid691@gmail.com'
);

-- Check office location
SELECT 
  '✅ OFFICE LOCATION' AS status,
  ol.id AS location_id,
  ol.company_id,
  c.name AS company_name,
  ol.name AS location_name,
  ol.address,
  ol.latitude,
  ol.longitude
FROM office_locations ol
JOIN companies c ON c.id = ol.company_id
WHERE ol.id = '551fdaaa-c54a-4e2a-bdde-9ec6df47a330';

-- Check attendance link
SELECT 
  '✅ ATTENDANCE LINK' AS status,
  al.id AS link_id,
  al.link_code,
  al.company_id,
  c.name AS company_name,
  al.title,
  al.is_active,
  al.valid_from,
  al.valid_until,
  CONCAT('https://portal.thesmartpro.io/en/attendance/check-in/', al.link_code) AS check_in_url
FROM attendance_links al
JOIN companies c ON c.id = al.company_id
WHERE al.link_code = 'AA3555';

-- Check company_members access
SELECT 
  '✅ COMPANY ACCESS' AS status,
  cm.company_id,
  c.name AS company_name,
  cm.role,
  cm.status,
  CASE 
    WHEN cm.status = 'active' THEN '✅ Has access'
    ELSE '❌ No access or inactive'
  END AS access_status
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
WHERE cm.user_id = '6028483d-ed60-45af-a560-ab51c67479b7'
  AND cm.company_id = '31741f22-7372-4f5f-9c3d-0fe7455b46dd';

-- Final summary
SELECT 
  '📊 SUMMARY' AS info,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = '31741f22-7372-4f5f-9c3d-0fe7455b46dd' AND is_active = true AND valid_until > NOW()) AS active_links_count,
  (SELECT COUNT(*) FROM office_locations WHERE company_id = '31741f22-7372-4f5f-9c3d-0fe7455b46dd') AS locations_count,
  (SELECT COUNT(*) FROM employer_employees WHERE company_id = '31741f22-7372-4f5f-9c3d-0fe7455b46dd' AND employment_status = 'active') AS active_employees_count;

