-- ============================================================================
-- FIND FALCON EYE GROUP AND DIGITAL MORPH
-- ============================================================================
-- Simple queries to identify these specific parties
-- ============================================================================

-- ============================================================================
-- PART 1: ALL PARTIES WITH "GROUP" IN NAME
-- ============================================================================

SELECT 
  pt.id as party_id,
  pt.name_en as party_name,
  pt.name_ar as party_name_ar,
  pt.type as party_type,
  pt.overall_status as party_status,
  pt.contact_email,
  pt.crn,
  CASE 
    WHEN EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id) 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_company,
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%group%'
   OR LOWER(pt.name_ar) LIKE '%group%'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 2: SEARCH FOR "FALCON EYE GROUP" (Various Patterns)
-- ============================================================================

SELECT 
  '=== FALCON EYE GROUP SEARCH ===' as search_type;

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
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%group%'
   OR LOWER(pt.name_en) = 'falcon eye group'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%group%'
   OR LOWER(pt.name_ar) = 'falcon eye group'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 3: SEARCH FOR "DIGITAL MORPH" (Various Patterns)
-- ============================================================================

SELECT 
  '=== DIGITAL MORPH SEARCH ===' as search_type;

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
WHERE LOWER(pt.name_en) LIKE '%digital%morph%'
   OR LOWER(pt.name_en) LIKE '%digitalmorph%'
   OR LOWER(pt.name_en) LIKE '%morph%'
   OR LOWER(pt.name_ar) LIKE '%digital%morph%'
   OR LOWER(pt.name_ar) LIKE '%digitalmorph%'
   OR LOWER(pt.name_ar) LIKE '%morph%'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 4: ALL FALCON EYE PARTIES (Complete List)
-- ============================================================================

SELECT 
  '=== ALL FALCON EYE PARTIES ===' as search_type;

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
  END as has_company,
  (SELECT COUNT(*) FROM promoters p WHERE p.employer_id = pt.id AND p.status = 'active') as active_promoters
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%'
ORDER BY pt.name_en;

-- ============================================================================
-- PART 5: SUMMARY - What We Found
-- ============================================================================

SELECT 
  '=== SUMMARY ===' as section;

SELECT 
  'Falcon Eye parties found' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%'

UNION ALL

SELECT 
  'Parties with "Group" in name' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%group%'
   OR LOWER(pt.name_ar) LIKE '%group%'

UNION ALL

SELECT 
  'Parties with "Digital" in name' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%digital%'
   OR LOWER(pt.name_ar) LIKE '%digital%'

UNION ALL

SELECT 
  'Parties with "Morph" in name' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%morph%'
   OR LOWER(pt.name_ar) LIKE '%morph%';

