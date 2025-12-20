-- ============================================================================
-- ANALYZE FALCON EYE GROUP STRUCTURE
-- ============================================================================
-- This script analyzes the current structure of Falcon Eye companies
-- to understand the holding group relationship
-- ============================================================================

-- ============================================================================
-- PART 1: ALL FALCON EYE COMPANIES (Current Structure)
-- ============================================================================

SELECT 
  '=== ALL FALCON EYE COMPANIES ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as company_name,
  pt.name_ar as company_name_ar,
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
  END as has_company_record,
  (SELECT c.id FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_id,
  (SELECT c.name FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1) as company_name_in_companies_table,
  -- Profile check
  CASE 
    WHEN pt.contact_email IS NOT NULL AND TRIM(pt.contact_email) != '' AND EXISTS (
      SELECT 1 FROM profiles pr WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    ) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_profile,
  -- Promoter count
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters,
  pt.created_at,
  pt.updated_at
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 2: FALCON EYE MODERN INVESTMENTS (Digital Morph's Parent Company)
-- ============================================================================

SELECT 
  '=== FALCON EYE MODERN INVESTMENTS (Digital Morph Parent) ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as company_name,
  pt.name_ar as company_name_ar,
  pt.crn,
  pt.type as party_type,
  pt.overall_status as party_status,
  pt.contact_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_company_record,
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%modern%investment%'
   OR LOWER(pt.name_en) LIKE '%falcon eye modern investments%'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 3: SUMMARY STATISTICS
-- ============================================================================

SELECT 
  '=== SUMMARY STATISTICS ===' as section;

SELECT 
  'Total Falcon Eye companies' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%'

UNION ALL

SELECT 
  'Falcon Eye companies with company records' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE (LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%')
   AND EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id)

UNION ALL

SELECT 
  'Falcon Eye companies with profiles' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE (LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%')
   AND pt.contact_email IS NOT NULL 
   AND TRIM(pt.contact_email) != ''
   AND EXISTS (
     SELECT 1 FROM profiles pr 
     WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
   )

UNION ALL

SELECT 
  'Total active promoters in Falcon Eye companies' as metric,
  SUM((SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active'))::text as value
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%';

-- ============================================================================
-- PART 4: CHECK FOR DIGITAL MORPH AS SEPARATE PARTY (Should NOT exist)
-- ============================================================================

SELECT 
  '=== DIGITAL MORPH CHECK (Should NOT exist as separate party) ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.type as party_type,
  pt.overall_status as party_status,
  '⚠️ Digital Morph should NOT be a separate party - it is a trademark under Falcon Eye Modern Investments' as note
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%digital%morph%'
   OR LOWER(pt.name_ar) LIKE '%digital%morph%'
   OR LOWER(pt.name_en) LIKE '%digitalmorph%';

-- ============================================================================
-- PART 5: CHECK FOR FALCON EYE GROUP AS SEPARATE PARTY (Should NOT exist)
-- ============================================================================

SELECT 
  '=== FALCON EYE GROUP CHECK (Should NOT exist as separate party) ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.type as party_type,
  pt.overall_status as party_status,
  '⚠️ Falcon Eye Group should NOT be a separate party - it is a holding group' as note
FROM parties pt
WHERE LOWER(TRIM(pt.name_en)) = 'falcon eye group'
   OR LOWER(TRIM(pt.name_ar)) = 'falcon eye group';

