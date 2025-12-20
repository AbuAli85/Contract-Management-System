-- ============================================================================
-- DETAILED CHECK: Falcon Eye Parties and Digital Morph
-- ============================================================================
-- This script provides comprehensive details about Falcon Eye parties
-- and searches for Digital Morph
-- ============================================================================

-- ============================================================================
-- PART 1: ALL FALCON EYE PARTIES WITH FULL DETAILS
-- ============================================================================

SELECT 
  '=== ALL FALCON EYE PARTIES (Full Details) ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.name_ar as party_name_ar,
  pt.crn,
  pt.type as party_type,
  pt.overall_status as party_status,
  pt.contact_email,
  pt.contact_phone,
  -- Company record check
  CASE 
    WHEN EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_company,
  (SELECT c.name FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_name,
  (SELECT c.id FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_id,
  -- Profile check
  CASE 
    WHEN pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '' AND EXISTS (
      SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    ) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_profile,
  (SELECT pr.id FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email)) LIMIT 1) as profile_id,
  -- Promoter count
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters,
  pt.created_at,
  pt.updated_at
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 2: SEARCH FOR DIGITAL MORPH (Various Spellings)
-- ============================================================================

SELECT 
  '=== SEARCH FOR DIGITAL MORPH ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.name_ar as party_name_ar,
  pt.crn,
  pt.type as party_type,
  pt.overall_status as party_status,
  pt.contact_email,
  pt.contact_phone,
  CASE 
    WHEN EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_company,
  (SELECT c.name FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_name,
  CASE 
    WHEN pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '' AND EXISTS (
      SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    ) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_profile,
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%digital%morph%'
   OR LOWER(pt.name_en) LIKE '%digitalmorph%'
   OR LOWER(pt.name_ar) LIKE '%digital%morph%'
   OR LOWER(pt.name_ar) LIKE '%digitalmorph%'
   OR LOWER(pt.name_en) LIKE '%morph%'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 3: SUMMARY - FALCON EYE PARTIES STATUS
-- ============================================================================

SELECT 
  '=== FALCON EYE PARTIES SUMMARY ===' as section;

SELECT 
  COUNT(*) as total_falcon_eye_parties,
  COUNT(*) FILTER (WHERE pt.type = 'Employer') as employer_count,
  COUNT(*) FILTER (WHERE pt.type = 'Client') as client_count,
  COUNT(*) FILTER (WHERE pt.overall_status = 'active') as active_count,
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id)) as with_company,
  COUNT(*) FILTER (WHERE pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '' AND EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
  )) as with_profile,
  SUM((SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active')) as total_active_promoters
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%';

-- ============================================================================
-- PART 4: COMPANY RECORDS FOR FALCON EYE PARTIES
-- ============================================================================

SELECT 
  '=== COMPANY RECORDS FOR FALCON EYE PARTIES ===' as section;

SELECT 
  c.id as company_id,
  c.name as company_name,
  c.email as company_email,
  c.party_id,
  pt.name_en as linked_party_name,
  pt.type as party_type,
  pt.overall_status as party_status,
  c.created_at
FROM companies c
JOIN parties pt ON pt.id = c.party_id OR pt.id = c.id
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 5: CHECK IF "FALCON EYE GROUP" EXISTS (Exact Match)
-- ============================================================================

SELECT 
  '=== EXACT MATCH: "FALCON EYE GROUP" ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.name_ar as party_name_ar,
  pt.type as party_type,
  pt.overall_status as party_status,
  pt.contact_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_company
FROM parties pt
WHERE LOWER(TRIM(pt.name_en)) = 'falcon eye group'
   OR LOWER(TRIM(pt.name_ar)) = 'falcon eye group'
   OR LOWER(TRIM(pt.name_en)) LIKE 'falcon eye group%'
   OR LOWER(TRIM(pt.name_ar)) LIKE 'falcon eye group%';

-- ============================================================================
-- PART 6: ALL PARTIES WITH "GROUP" IN NAME (To Find Falcon Eye Group)
-- ============================================================================

SELECT 
  '=== ALL PARTIES WITH "GROUP" IN NAME ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.type as party_type,
  pt.overall_status as party_status,
  pt.contact_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_company
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%group%'
   OR LOWER(pt.name_ar) LIKE '%group%'
ORDER BY pt.name_en;

