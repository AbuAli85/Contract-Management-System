-- FINAL MOCK CONTRACT DELETION
-- This script will safely delete test/mock contracts
-- Based on review recommendation: SAFE TO DELETE

-- ============================================================
-- STEP 1: Show what will be deleted (REVIEW THIS!)
-- ============================================================

SELECT 
  '⚠️⚠️⚠️ CONTRACTS TO BE DELETED ⚠️⚠️⚠️' as warning;

SELECT 
  '═══════════════════════════════════════' as divider;

-- Show test/mock contracts
SELECT 
  contract_number,
  title,
  status,
  created_at::date as created_date,
  CASE 
    WHEN LOWER(title) LIKE '%test%' THEN 'test keyword'
    WHEN LOWER(title) LIKE '%mock%' THEN 'mock keyword'
    WHEN LOWER(title) LIKE '%sample%' THEN 'sample keyword'
    WHEN LOWER(title) LIKE '%demo%' THEN 'demo keyword'
    WHEN LOWER(contract_number) LIKE '%test%' THEN 'test in number'
    ELSE 'other'
  END as reason
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(title) LIKE '%placeholder%'
  OR LOWER(contract_number) LIKE '%test%'
  OR LOWER(contract_number) LIKE '%mock%'
  OR LOWER(contract_number) LIKE '%sample%';

-- Count
SELECT 
  'TOTAL TO BE DELETED' as summary,
  COUNT(*) as count
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(title) LIKE '%placeholder%'
  OR LOWER(contract_number) LIKE '%test%'
  OR LOWER(contract_number) LIKE '%mock%'
  OR LOWER(contract_number) LIKE '%sample%';

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '⚠️ REVIEW THE ABOVE LIST CAREFULLY!' as warning;
SELECT 
  '⚠️ If these look correct, scroll down and run STEP 2' as instruction;

SELECT 
  '═══════════════════════════════════════' as divider;

-- ============================================================
-- STEP 2: EXECUTE DELETION (Uncomment to run)
-- ============================================================

/*

-- Drop triggers temporarily
DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts CASCADE;
DROP TRIGGER IF EXISTS sync_contract_parties_trigger ON contracts CASCADE;
DROP TRIGGER IF EXISTS sync_contract_party_columns_trigger ON contracts CASCADE;

-- DELETE TEST/MOCK CONTRACTS
DELETE FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(title) LIKE '%placeholder%'
  OR LOWER(contract_number) LIKE '%test%'
  OR LOWER(contract_number) LIKE '%mock%'
  OR LOWER(contract_number) LIKE '%sample%';

-- Recreate trigger
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

SELECT '✅ Mock contracts deleted and trigger recreated' as status;

*/

-- ============================================================
-- STEP 3: Verification (Run after deletion)
-- ============================================================

-- This section can always run - shows current state

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '📊 CURRENT DATABASE STATE' as section;

SELECT 
  '═══════════════════════════════════════' as divider;

-- Total contracts
SELECT 
  'Total Contracts' as metric,
  COUNT(*) as current_count
FROM contracts;

-- Contracts by status
SELECT 
  'By Status:' as section,
  '───────────' as separator;

SELECT 
  status,
  COUNT(*) as count
FROM contracts
GROUP BY status
ORDER BY count DESC;

-- Top parties verification
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  '🏆 Top 5 Parties (After Cleanup):' as info;

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

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM contracts WHERE LOWER(title) LIKE '%test%' OR LOWER(title) LIKE '%mock%') = 0
    THEN '✅ No test/mock contracts found - database is clean!'
    ELSE '⚠️ Test/mock contracts still exist - uncomment STEP 2 to delete'
  END as final_status;
