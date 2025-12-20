-- ============================================================================
-- CHECK SPECIFIC PARTIES STATUS (Digital Morph and Falcon Eye Group)
-- ============================================================================
-- This script checks if Digital Morph and Falcon Eye Group are employers
-- or clients, their status, and related company records
-- ============================================================================

-- Check for Digital Morph
SELECT 
  '=== DIGITAL MORPH ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.name_ar as party_name_ar,
  pt.crn,
  pt.type as party_type,  -- 'Employer' or 'Client'
  pt.overall_status as party_status,
  pt.contact_email,
  pt.contact_phone,
  pt.created_at,
  pt.updated_at,
  -- Check if has company record
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM companies c 
      WHERE c.party_id = pt.id OR c.id = pt.id
    ) THEN 'Yes'
    ELSE 'No'
  END as has_company,
  -- Get company details if exists
  (SELECT c.name FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_name,
  (SELECT c.id FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_id,
  -- Check if has profile (employer profile)
  CASE 
    WHEN pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '' AND EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    ) THEN 'Yes'
    ELSE 'No'
  END as has_profile,
  -- Get profile details if exists
  (SELECT pr.id FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email)) LIMIT 1) as profile_id,
  -- Count promoters/employees
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters_count
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%digital morph%'
   OR LOWER(pt.name_ar) LIKE '%digital morph%'
   OR LOWER(pt.name_en) LIKE '%digitalmorph%'
   OR LOWER(pt.name_ar) LIKE '%digitalmorph%';

-- Check for Falcon Eye Group (various possible names)
SELECT 
  '=== FALCON EYE GROUP ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.name_ar as party_name_ar,
  pt.crn,
  pt.type as party_type,  -- 'Employer' or 'Client'
  pt.overall_status as party_status,
  pt.contact_email,
  pt.contact_phone,
  pt.created_at,
  pt.updated_at,
  -- Check if has company record
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM companies c 
      WHERE c.party_id = pt.id OR c.id = pt.id
    ) THEN 'Yes'
    ELSE 'No'
  END as has_company,
  -- Get company details if exists
  (SELECT c.name FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_name,
  (SELECT c.id FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_id,
  -- Check if has profile (employer profile)
  CASE 
    WHEN pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '' AND EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    ) THEN 'Yes'
    ELSE 'No'
  END as has_profile,
  -- Get profile details if exists
  (SELECT pr.id FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email)) LIMIT 1) as profile_id,
  -- Count promoters/employees
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters_count
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon eye%'
   OR LOWER(pt.name_en) LIKE '%falconeye%'
   OR LOWER(pt.name_ar) LIKE '%falconeye%'
   OR LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%';

-- ============================================================================
-- SUMMARY: All parties with "Falcon" or "Digital" in name
-- ============================================================================

SELECT 
  '=== ALL PARTIES WITH FALCON OR DIGITAL IN NAME ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.type as party_type,
  pt.overall_status as party_status,
  pt.contact_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id) THEN 'Yes'
    ELSE 'No'
  END as has_company,
  CASE 
    WHEN pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '' AND EXISTS (
      SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    ) THEN 'Yes'
    ELSE 'No'
  END as has_profile,
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%'
   OR LOWER(pt.name_en) LIKE '%digital%'
   OR LOWER(pt.name_ar) LIKE '%falcon%'
   OR LOWER(pt.name_ar) LIKE '%digital%'
ORDER BY pt.type, pt.name_en;

-- ============================================================================
-- DETAILED BREAKDOWN: Company records for these parties
-- ============================================================================

SELECT 
  '=== COMPANY RECORDS FOR FALCON/DIGITAL PARTIES ===' as section;

SELECT 
  c.id as company_id,
  c.name as company_name,
  c.email as company_email,
  c.party_id,
  pt.name_en as party_name,
  pt.type as party_type,
  pt.overall_status as party_status,
  c.created_at as company_created_at
FROM companies c
JOIN parties pt ON pt.id = c.party_id OR pt.id = c.id
WHERE LOWER(pt.name_en) LIKE '%falcon%'
   OR LOWER(pt.name_en) LIKE '%digital%'
   OR LOWER(pt.name_ar) LIKE '%falcon%'
   OR LOWER(pt.name_ar) LIKE '%digital%'
ORDER BY pt.name_en;

-- ============================================================================
-- PROFILE RECORDS FOR THESE PARTIES
-- ============================================================================

SELECT 
  '=== PROFILE RECORDS FOR FALCON/DIGITAL PARTIES ===' as section;

SELECT 
  pr.id as profile_id,
  pr.email as profile_email,
  pr.full_name,
  pr.role as profile_role,
  pr.status as profile_status,
  pt.name_en as party_name,
  pt.type as party_type,
  pt.overall_status as party_status
FROM profiles pr
JOIN parties pt ON LOWER(TRIM(pt.contact_email)) = LOWER(TRIM(pr.email))
WHERE (LOWER(pt.name_en) LIKE '%falcon%'
   OR LOWER(pt.name_en) LIKE '%digital%'
   OR LOWER(pt.name_ar) LIKE '%falcon%'
   OR LOWER(pt.name_ar) LIKE '%digital%')
   AND pt.contact_email IS NOT NULL
   AND TRIM(pt.contact_email) != ''
ORDER BY pt.name_en;

