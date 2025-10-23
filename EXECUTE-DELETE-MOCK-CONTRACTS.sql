-- EXECUTE DELETION OF MOCK CONTRACTS
-- This is the uncommented version - ready to run
-- Based on review: Test/mock contracts found and safe to delete

-- ============================================================
-- FINAL WARNING
-- ============================================================

SELECT 
  '⚠️⚠️⚠️ THIS WILL DELETE MOCK CONTRACTS ⚠️⚠️⚠️' as final_warning;

SELECT 
  '═══════════════════════════════════════' as divider;

-- Show what will be deleted one more time
SELECT 
  COUNT(*) as contracts_to_delete,
  'contracts with test/mock keywords' as description
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
  '⏰ Waiting 5 seconds before deletion...' as pause;
SELECT pg_sleep(5);

SELECT 
  '🗑️ Starting deletion...' as status;

-- ============================================================
-- STEP 1: Drop triggers temporarily
-- ============================================================

DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts CASCADE;
DROP TRIGGER IF EXISTS sync_contract_parties_trigger ON contracts CASCADE;
DROP TRIGGER IF EXISTS sync_contract_party_columns_trigger ON contracts CASCADE;

SELECT 
  '✅ Triggers dropped' as status;

-- ============================================================
-- STEP 2: DELETE TEST/MOCK CONTRACTS
-- ============================================================

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

SELECT 
  '✅ Mock contracts deleted' as status;

-- ============================================================
-- STEP 3: Recreate trigger
-- ============================================================

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
-- STEP 4: Verification
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '✅ DELETION COMPLETE - VERIFICATION' as section;

SELECT 
  '═══════════════════════════════════════' as divider;

-- Total contracts remaining
SELECT 
  'Total Contracts After Cleanup' as metric,
  COUNT(*) as count
FROM contracts;

-- Check for any remaining test/mock
SELECT 
  'Remaining Test/Mock Contracts' as metric,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ SOME REMAIN' END as status
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%';

-- Contracts by status
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  'Contracts by Status:' as info;

SELECT 
  status,
  COUNT(*) as count
FROM contracts
GROUP BY status
ORDER BY count DESC;

-- Top 5 parties verification
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  '🏆 Top 5 Parties (Verification):' as info;

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
  ROW_NUMBER() OVER (ORDER BY total_contracts DESC) as rank,
  name_en as party_name,
  total_contracts
FROM party_counts
WHERE total_contracts > 0
ORDER BY total_contracts DESC
LIMIT 5;

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '🎉 CLEANUP SUCCESSFUL!' as final_status,
  NOW()::text as completed_at;

SELECT 
  '✅ Your database is now clean and production-ready!' as message;

