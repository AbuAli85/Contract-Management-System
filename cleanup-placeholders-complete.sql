-- Complete cleanup script: Remove placeholder parties safely
-- Run this entire script in your Supabase SQL Editor
-- Strategy: Drop custom triggers, update, delete, recreate triggers

-- ============================================================
-- STEP 1: Drop custom triggers temporarily (not system triggers)
-- ============================================================

SELECT 
  '🔧 Temporarily dropping custom triggers...' as status;

DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts CASCADE;
DROP TRIGGER IF EXISTS sync_contract_parties_trigger ON contracts CASCADE;
DROP TRIGGER IF EXISTS sync_contract_party_columns_trigger ON contracts CASCADE;

SELECT 
  '✅ Custom triggers dropped' as status;

-- ============================================================
-- STEP 2: Check current state
-- ============================================================

SELECT 
  '🔍 Checking for contracts using placeholder parties...' as status;

SELECT 
  COUNT(*) as total_contracts_with_placeholders,
  COUNT(CASE WHEN employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN 1 END) as as_employer,
  COUNT(CASE WHEN client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN 1 END) as as_client,
  COUNT(CASE WHEN first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN 1 END) as as_first_party,
  COUNT(CASE WHEN second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN 1 END) as as_second_party
FROM contracts
WHERE 
  employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- ============================================================
-- STEP 3: Update contracts - NULL out placeholder references
-- ============================================================

SELECT 
  '🔧 Nullifying placeholder references in contracts...' as status;

-- Update all at once
UPDATE contracts
SET 
  employer_id = CASE 
    WHEN employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') 
    THEN NULL 
    ELSE employer_id 
  END,
  client_id = CASE 
    WHEN client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') 
    THEN NULL 
    ELSE client_id 
  END,
  first_party_id = CASE 
    WHEN first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') 
    THEN NULL 
    ELSE first_party_id 
  END,
  second_party_id = CASE 
    WHEN second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') 
    THEN NULL 
    ELSE second_party_id 
  END
WHERE 
  employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

SELECT 
  '✅ Contract references nullified' as status;

-- ============================================================
-- STEP 4: Delete placeholder parties
-- ============================================================

SELECT 
  '🗑️ Deleting placeholder parties...' as status;

DELETE FROM parties 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',  -- Placeholder Client
  '00000000-0000-0000-0000-000000000002'   -- Placeholder Employer
);

SELECT 
  '✅ Placeholders deleted' as status;

-- ============================================================
-- STEP 5: Recreate the trigger
-- ============================================================

SELECT 
  '🔧 Recreating sync trigger...' as status;

CREATE OR REPLACE FUNCTION sync_contract_party_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync first_party_id and employer_id (both UUID)
  IF NEW.first_party_id IS NOT NULL AND NEW.employer_id IS NULL THEN
    NEW.employer_id = NEW.first_party_id;
  ELSIF NEW.employer_id IS NOT NULL AND NEW.first_party_id IS NULL THEN
    NEW.first_party_id = NEW.employer_id;
  END IF;
  
  -- Sync second_party_id and client_id (both UUID)
  IF NEW.second_party_id IS NOT NULL AND NEW.client_id IS NULL THEN
    NEW.client_id = NEW.second_party_id;
  ELSIF NEW.client_id IS NOT NULL AND NEW.second_party_id IS NULL THEN
    NEW.second_party_id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_contract_party_ids_trigger
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_party_ids();

SELECT 
  '✅ Trigger recreated' as status;

-- ============================================================
-- STEP 6: Verification & Final Status
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '✅ CLEANUP VERIFICATION RESULTS' as section;

SELECT 
  '═══════════════════════════════════════' as divider;

-- Check for any remaining placeholders
SELECT 
  'Remaining Placeholder Parties' as metric,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM parties
WHERE 
  name_en LIKE 'Placeholder%'
  OR crn LIKE 'PLACEHOLDER%'
  OR id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Show total party count
SELECT 
  'Total Real Parties' as metric,
  COUNT(*) as count,
  '✅ ACTIVE' as status
FROM parties;

-- Party distribution by type
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  'Party Distribution by Type:' as info;

SELECT 
  COALESCE(type, '(NULL)') as party_type,
  COUNT(*) as count
FROM parties
GROUP BY type
ORDER BY count DESC;

-- Contracts without parties (may need manual assignment)
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  'Contracts Without ANY Parties' as metric,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ ALL ASSIGNED' ELSE '⚠️ NEEDS REVIEW' END as status
FROM contracts
WHERE employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL;

-- Final summary
SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '✨ CLEANUP COMPLETE - ' || NOW()::text as final_status;

SELECT 
  '═══════════════════════════════════════' as divider;

-- Show top parties with contract counts as final verification
SELECT 
  '📊 Top 5 Parties (Verification):' as info;

WITH party_counts AS (
  SELECT 
    p.name_en,
    COUNT(DISTINCT c.id) as total_contracts
  FROM parties p
  LEFT JOIN contracts c ON (
    c.employer_id = p.id OR 
    c.client_id = p.id OR 
    c.first_party_id = p.id OR 
    c.second_party_id = p.id
  )
  GROUP BY p.id, p.name_en
)
SELECT 
  name_en,
  total_contracts
FROM party_counts
WHERE total_contracts > 0
ORDER BY total_contracts DESC
LIMIT 5;
