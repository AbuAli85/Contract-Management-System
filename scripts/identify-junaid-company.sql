-- =====================================================
-- Identify Correct Company for Muhammad Junaid
-- =====================================================
-- Based on: Client = OMASCO, Location = Lulu Sohar
-- =====================================================

-- Step 1: Check which company is linked to OMASCO party
SELECT 
  'OMASCO Client Link' AS source,
  ee.company_id,
  c.name AS company_name,
  p.name_en AS party_name,
  COUNT(DISTINCT ee.id) AS employees_count
FROM employer_employees ee
JOIN companies c ON c.id = ee.company_id
JOIN parties p ON p.id = ee.party_id
WHERE p.name_en ILIKE '%OMASCO%'
GROUP BY ee.company_id, c.name, p.name_en;

-- Step 2: Check which company has the Lulu Sohar office location
SELECT 
  'Lulu Sohar Location' AS source,
  ol.company_id,
  c.name AS company_name,
  ol.name AS location_name,
  ol.address
FROM office_locations ol
JOIN companies c ON c.id = ol.company_id
WHERE ol.name ILIKE '%lulu%sohar%'
   OR ol.address ILIKE '%lulu%sohar%'
   OR ol.address ILIKE '%sohar%';

-- Step 3: Check Muhammad Junaid's employer_employee record
SELECT 
  'Junaid Employee Record' AS source,
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

-- Step 4: List all Falcon Eye companies (the 16 companies)
SELECT 
  'Falcon Eye Companies' AS source,
  c.id AS company_id,
  c.name AS company_name,
  c.is_active,
  (SELECT COUNT(*) FROM employer_employees WHERE company_id = c.id) AS employees_count,
  (SELECT COUNT(*) FROM office_locations WHERE company_id = c.id) AS locations_count,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = c.id) AS attendance_links_count
FROM companies c
WHERE c.name ILIKE '%falcon%eye%'
ORDER BY c.name;

-- Step 5: Recommendation - Which company should be used?
-- Based on: OMASCO client + Lulu Sohar location
SELECT 
  'RECOMMENDATION' AS info,
  ee.company_id AS recommended_company_id,
  c.name AS recommended_company_name,
  p.name_en AS client_name,
  ol.name AS location_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM company_members cm 
      WHERE cm.company_id = ee.company_id 
      AND cm.user_id = '6028483d-ed60-45af-a560-ab51c67479b7'
    ) THEN '✅ User has access'
    ELSE '⚠️ User needs to be added to company_members'
  END AS access_status
FROM employer_employees ee
JOIN companies c ON c.id = ee.company_id
LEFT JOIN parties p ON p.id = ee.party_id
LEFT JOIN office_locations ol ON ol.company_id = c.id AND ol.name ILIKE '%lulu%sohar%'
WHERE ee.employee_id = (
  SELECT id FROM profiles WHERE email = 'junaidshahid691@gmail.com'
)
LIMIT 1;

