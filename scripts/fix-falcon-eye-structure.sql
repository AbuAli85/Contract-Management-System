-- ============================================================================
-- FIX FALCON EYE GROUP STRUCTURE AND MISALIGNMENTS
-- ============================================================================
-- This script fixes the structure based on understanding:
-- 1. Falcon Eye Group = Holding group (NOT a separate party)
-- 2. Digital Morph = Trademark under Falcon Eye Modern Investments (NOT a separate party)
-- 3. All 16+ Falcon Eye companies should have company records
-- ============================================================================

-- ============================================================================
-- PART 1: REMOVE INCORRECT PARTIES (If they exist)
-- ============================================================================

-- Remove "Falcon Eye Group" if it exists as a separate party
-- (It's a holding group, not a company)
DO $$
DECLARE
  v_removed_count INTEGER := 0;
BEGIN
  -- Check if Falcon Eye Group exists as a party
  IF EXISTS (
    SELECT 1 FROM parties pt
    WHERE LOWER(TRIM(pt.name_en)) = 'falcon eye group'
       OR LOWER(TRIM(pt.name_ar)) = 'falcon eye group'
  ) THEN
    -- Delete promoters linked to it first
    DELETE FROM promoters p
    WHERE EXISTS (
      SELECT 1 FROM parties pt
      WHERE pt.id = p.employer_id
        AND (LOWER(TRIM(pt.name_en)) = 'falcon eye group'
         OR LOWER(TRIM(pt.name_ar)) = 'falcon eye group')
    );
    
    -- Delete company records linked to it
    DELETE FROM companies c
    WHERE EXISTS (
      SELECT 1 FROM parties pt
      WHERE (pt.id = c.party_id OR pt.id = c.id)
        AND (LOWER(TRIM(pt.name_en)) = 'falcon eye group'
         OR LOWER(TRIM(pt.name_ar)) = 'falcon eye group')
    );
    
    -- Delete the party
    DELETE FROM parties pt
    WHERE LOWER(TRIM(pt.name_en)) = 'falcon eye group'
       OR LOWER(TRIM(pt.name_ar)) = 'falcon eye group';
    
    GET DIAGNOSTICS v_removed_count = ROW_COUNT;
    RAISE NOTICE 'Removed Falcon Eye Group as separate party: % records', v_removed_count;
  ELSE
    RAISE NOTICE 'Falcon Eye Group does not exist as separate party (correct)';
  END IF;
END $$;

-- Remove "Digital Morph" if it exists as a separate party
-- (It's a trademark under Falcon Eye Modern Investments, not a company)
DO $$
DECLARE
  v_removed_count INTEGER := 0;
  v_falcon_eye_modern_id UUID;
BEGIN
  -- First, find Falcon Eye Modern Investments party ID
  SELECT pt.id INTO v_falcon_eye_modern_id
  FROM parties pt
  WHERE LOWER(pt.name_en) LIKE '%falcon%eye%modern%investment%'
     OR LOWER(pt.name_en) LIKE '%falcon eye modern investments%'
  LIMIT 1;
  
  -- Check if Digital Morph exists as a party
  IF EXISTS (
    SELECT 1 FROM parties pt
    WHERE LOWER(pt.name_en) LIKE '%digital%morph%'
       OR LOWER(pt.name_ar) LIKE '%digital%morph%'
       OR LOWER(pt.name_en) LIKE '%digitalmorph%'
  ) THEN
    -- If we found Falcon Eye Modern Investments, we could reassign promoters
    -- But for now, we'll just remove Digital Morph as it shouldn't be a separate party
    -- Note: You may want to manually reassign any promoters from Digital Morph to Falcon Eye Modern Investments
    
    -- Delete promoters linked to Digital Morph
    DELETE FROM promoters p
    WHERE EXISTS (
      SELECT 1 FROM parties pt
      WHERE pt.id = p.employer_id
        AND (LOWER(pt.name_en) LIKE '%digital%morph%'
         OR LOWER(pt.name_ar) LIKE '%digital%morph%'
         OR LOWER(pt.name_en) LIKE '%digitalmorph%')
    );
    
    -- Delete company records linked to Digital Morph
    DELETE FROM companies c
    WHERE EXISTS (
      SELECT 1 FROM parties pt
      WHERE (pt.id = c.party_id OR pt.id = c.id)
        AND (LOWER(pt.name_en) LIKE '%digital%morph%'
         OR LOWER(pt.name_ar) LIKE '%digital%morph%'
         OR LOWER(pt.name_en) LIKE '%digitalmorph%')
    );
    
    -- Delete the party
    DELETE FROM parties pt
    WHERE LOWER(pt.name_en) LIKE '%digital%morph%'
       OR LOWER(pt.name_ar) LIKE '%digital%morph%'
       OR LOWER(pt.name_en) LIKE '%digitalmorph%';
    
    GET DIAGNOSTICS v_removed_count = ROW_COUNT;
    RAISE NOTICE 'Removed Digital Morph as separate party: % records', v_removed_count;
    RAISE WARNING '⚠️  If there were promoters under Digital Morph, they need to be reassigned to Falcon Eye Modern Investments';
  ELSE
    RAISE NOTICE 'Digital Morph does not exist as separate party (correct)';
  END IF;
END $$;

-- ============================================================================
-- PART 2: CREATE MISSING COMPANY RECORDS FOR FALCON EYE PARTIES
-- ============================================================================

-- Create company records for Falcon Eye parties that don't have them
INSERT INTO companies (
  id,
  name,
  email,
  phone,
  party_id,
  created_at,
  updated_at
)
SELECT DISTINCT
  COALESCE(
    (SELECT c.id FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id LIMIT 1),
    gen_random_uuid()
  ) as id,
  pt.name_en as name,
  pt.contact_email as email,
  pt.contact_phone as phone,
  pt.id as party_id,
  COALESCE(pt.created_at, NOW()) as created_at,
  COALESCE(pt.updated_at, NOW()) as updated_at
FROM parties pt
WHERE (LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%')
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.party_id = pt.id OR c.id = pt.id
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Report results
DO $$
DECLARE
  v_created INTEGER;
BEGIN
  GET DIAGNOSTICS v_created = ROW_COUNT;
  RAISE NOTICE '';
  RAISE NOTICE 'Created/updated company records for Falcon Eye parties: %', v_created;
END $$;

-- ============================================================================
-- PART 3: VERIFY STRUCTURE
-- ============================================================================

SELECT 
  '=== VERIFICATION: FALCON EYE STRUCTURE ===' as section;

-- Count Falcon Eye companies
SELECT 
  'Total Falcon Eye companies' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%'

UNION ALL

-- Count with company records
SELECT 
  'Falcon Eye companies with company records' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE (LOWER(pt.name_en) LIKE '%falcon%eye%'
   OR LOWER(pt.name_ar) LIKE '%falcon%eye%')
   AND EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id)

UNION ALL

-- Count with profiles
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

-- Check if Digital Morph still exists (should be 0)
SELECT 
  'Digital Morph as separate party (should be 0)' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE LOWER(pt.name_en) LIKE '%digital%morph%'
   OR LOWER(pt.name_ar) LIKE '%digital%morph%'
   OR LOWER(pt.name_en) LIKE '%digitalmorph%'

UNION ALL

-- Check if Falcon Eye Group still exists (should be 0)
SELECT 
  'Falcon Eye Group as separate party (should be 0)' as metric,
  COUNT(*)::text as value
FROM parties pt
WHERE LOWER(TRIM(pt.name_en)) = 'falcon eye group'
   OR LOWER(TRIM(pt.name_ar)) = 'falcon eye group';

-- ============================================================================
-- PART 4: FINAL REPORT
-- ============================================================================

DO $$
DECLARE
  v_falcon_eye_count INTEGER;
  v_with_companies INTEGER;
  v_with_profiles INTEGER;
  v_digital_morph_count INTEGER;
  v_falcon_eye_group_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_falcon_eye_count
  FROM parties pt
  WHERE LOWER(pt.name_en) LIKE '%falcon%eye%'
     OR LOWER(pt.name_ar) LIKE '%falcon%eye%';
  
  SELECT COUNT(*) INTO v_with_companies
  FROM parties pt
  WHERE (LOWER(pt.name_en) LIKE '%falcon%eye%'
     OR LOWER(pt.name_ar) LIKE '%falcon%eye%')
     AND EXISTS (SELECT 1 FROM companies c WHERE c.party_id = pt.id OR c.id = pt.id);
  
  SELECT COUNT(*) INTO v_with_profiles
  FROM parties pt
  WHERE (LOWER(pt.name_en) LIKE '%falcon%eye%'
     OR LOWER(pt.name_ar) LIKE '%falcon%eye%')
     AND pt.contact_email IS NOT NULL 
     AND TRIM(pt.contact_email) != ''
     AND EXISTS (
       SELECT 1 FROM profiles pr 
       WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
     );
  
  SELECT COUNT(*) INTO v_digital_morph_count
  FROM parties pt
  WHERE LOWER(pt.name_en) LIKE '%digital%morph%'
     OR LOWER(pt.name_ar) LIKE '%digital%morph%'
     OR LOWER(pt.name_en) LIKE '%digitalmorph%';
  
  SELECT COUNT(*) INTO v_falcon_eye_group_count
  FROM parties pt
  WHERE LOWER(TRIM(pt.name_en)) = 'falcon eye group'
     OR LOWER(TRIM(pt.name_ar)) = 'falcon eye group';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FALCON EYE STRUCTURE FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Falcon Eye companies: %', v_falcon_eye_count;
  RAISE NOTICE '  With company records: %', v_with_companies;
  RAISE NOTICE '  With profiles: %', v_with_profiles;
  RAISE NOTICE '';
  RAISE NOTICE 'Digital Morph as separate party: % (should be 0)', v_digital_morph_count;
  RAISE NOTICE 'Falcon Eye Group as separate party: % (should be 0)', v_falcon_eye_group_count;
  RAISE NOTICE '';
  
  IF v_digital_morph_count = 0 AND v_falcon_eye_group_count = 0 THEN
    RAISE NOTICE '✅ Structure is correct!';
  ELSE
    RAISE WARNING '⚠️  Some incorrect parties still exist. Manual review needed.';
  END IF;
  
  IF v_with_companies = v_falcon_eye_count THEN
    RAISE NOTICE '✅ All Falcon Eye companies have company records!';
  ELSE
    RAISE WARNING '⚠️  % Falcon Eye companies missing company records', (v_falcon_eye_count - v_with_companies);
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

