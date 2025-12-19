-- =====================================================
-- Find Which Falcon Eye Company Has OMASCO + Lulu Sohar
-- =====================================================
-- This will identify the correct company from the 16 Falcon Eye companies
-- =====================================================

-- Step 1: Find which company has OMASCO as a client
SELECT 
  'OMASCO Client' AS source,
  ee.company_id,
  c.name AS company_name,
  p.name_en AS party_name,
  COUNT(DISTINCT ee.id) AS employees_with_omasco
FROM employer_employees ee
JOIN companies c ON c.id = ee.company_id
JOIN parties p ON p.id = ee.party_id
WHERE p.name_en ILIKE '%OMASCO%'
  AND c.name ILIKE '%falcon%eye%'
GROUP BY ee.company_id, c.name, p.name_en
ORDER BY employees_with_omasco DESC;

-- Step 2: Find which company has Lulu Sohar location
SELECT 
  'Lulu Sohar Location' AS source,
  ol.company_id,
  c.name AS company_name,
  ol.name AS location_name,
  ol.address,
  ol.latitude,
  ol.longitude
FROM office_locations ol
JOIN companies c ON c.id = ol.company_id
WHERE (ol.name ILIKE '%lulu%sohar%' OR ol.address ILIKE '%lulu%sohar%' OR ol.address ILIKE '%sohar%')
  AND c.name ILIKE '%falcon%eye%'
ORDER BY ol.created_at DESC;

-- Step 3: Find which company has BOTH OMASCO client AND Lulu Sohar location
SELECT 
  'BOTH OMASCO + Lulu Sohar' AS source,
  c.id AS company_id,
  c.name AS company_name,
  COUNT(DISTINCT p.id) AS omasco_count,
  COUNT(DISTINCT ol.id) AS lulu_locations_count,
  COUNT(DISTINCT ee.id) AS employees_count
FROM companies c
LEFT JOIN employer_employees ee ON ee.company_id = c.id
LEFT JOIN parties p ON p.id = ee.party_id AND p.name_en ILIKE '%OMASCO%'
LEFT JOIN office_locations ol ON ol.company_id = c.id 
  AND (ol.name ILIKE '%lulu%sohar%' OR ol.address ILIKE '%lulu%sohar%' OR ol.address ILIKE '%sohar%')
WHERE c.name ILIKE '%falcon%eye%'
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT p.id) > 0 OR COUNT(DISTINCT ol.id) > 0
ORDER BY 
  CASE WHEN COUNT(DISTINCT p.id) > 0 AND COUNT(DISTINCT ol.id) > 0 THEN 1 ELSE 2 END,
  c.name;

-- Step 4: List ALL Falcon Eye companies with their details
SELECT 
  'All Falcon Eye Companies' AS source,
  c.id AS company_id,
  c.name AS company_name,
  (SELECT COUNT(*) FROM employer_employees WHERE company_id = c.id) AS total_employees,
  (SELECT COUNT(*) FROM office_locations WHERE company_id = c.id) AS total_locations,
  (SELECT COUNT(*) FROM attendance_links WHERE company_id = c.id) AS total_links,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM employer_employees ee
      JOIN parties p ON p.id = ee.party_id
      WHERE ee.company_id = c.id AND p.name_en ILIKE '%OMASCO%'
    ) THEN '✅ Has OMASCO'
    ELSE '❌ No OMASCO'
  END AS omasco_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM office_locations 
      WHERE company_id = c.id 
      AND (name ILIKE '%lulu%sohar%' OR address ILIKE '%lulu%sohar%' OR address ILIKE '%sohar%')
    ) THEN '✅ Has Lulu Sohar'
    ELSE '❌ No Lulu Sohar'
  END AS lulu_status
FROM companies c
WHERE c.name ILIKE '%falcon%eye%'
ORDER BY 
  CASE WHEN c.name = 'falcon eye group' THEN 0 ELSE 1 END,
  c.name;

-- Step 5: Check Muhammad Junaid's current setup
SELECT 
  'Junaid Current Setup' AS source,
  ee.company_id,
  c.name AS company_name,
  ee.party_id,
  p.name_en AS client_name,
  ol.id AS location_id,
  ol.name AS location_name
FROM employer_employees ee
JOIN companies c ON c.id = ee.company_id
LEFT JOIN parties p ON p.id = ee.party_id
LEFT JOIN office_locations ol ON ol.company_id = c.id
WHERE ee.employee_id = (
  SELECT id FROM profiles WHERE email = 'junaidshahid691@gmail.com'
);

