-- Cleanup mock and test contracts
-- Run this AFTER reviewing the results from identify-mock-contracts.sql
-- IMPORTANT: Review the contracts before running the DELETE section!

-- ============================================================
-- STEP 1: Backup - Show all contracts to be deleted
-- ============================================================

SELECT 
  '⚠️ CONTRACTS THAT WILL BE DELETED - REVIEW CAREFULLY!' as warning;

-- Create a temporary table to hold contracts to delete
CREATE TEMP TABLE IF NOT EXISTS contracts_to_delete AS
SELECT 
  c.*,
  CASE 
    WHEN LOWER(c.title) LIKE '%test%' THEN 'test in title'
    WHEN LOWER(c.title) LIKE '%mock%' THEN 'mock in title'
    WHEN LOWER(c.title) LIKE '%sample%' THEN 'sample in title'
    WHEN LOWER(c.title) LIKE '%demo%' THEN 'demo in title'
    WHEN LOWER(c.title) LIKE '%placeholder%' THEN 'placeholder in title'
    WHEN c.contract_number LIKE '%TEST%' THEN 'test contract number'
    WHEN c.contract_number LIKE '%MOCK%' THEN 'mock contract number'
    WHEN c.contract_number LIKE '%SAMPLE%' THEN 'sample contract number'
    WHEN c.employer_id IS NULL AND c.client_id IS NULL 
         AND c.first_party_id IS NULL AND c.second_party_id IS NULL THEN 'no parties assigned'
    ELSE 'other'
  END as deletion_reason
FROM contracts c
WHERE 
  -- Test/mock indicators in title
  LOWER(c.title) LIKE '%test%'
  OR LOWER(c.title) LIKE '%mock%'
  OR LOWER(c.title) LIKE '%sample%'
  OR LOWER(c.title) LIKE '%demo%'
  OR LOWER(c.title) LIKE '%placeholder%'
  
  -- Test/mock indicators in contract number
  OR c.contract_number LIKE '%TEST%'
  OR c.contract_number LIKE '%MOCK%'
  OR c.contract_number LIKE '%SAMPLE%'
  OR c.contract_number LIKE '%PLACEHOLDER%'
  
  -- Contracts with no parties (likely test data)
  OR (c.employer_id IS NULL AND c.client_id IS NULL 
      AND c.first_party_id IS NULL AND c.second_party_id IS NULL);

-- Show what will be deleted
SELECT 
  '📋 Preview of contracts to be deleted:' as info;

SELECT 
  contract_number,
  title,
  status,
  contract_type,
  created_at,
  deletion_reason
FROM contracts_to_delete
ORDER BY created_at DESC;

-- Show count by deletion reason
SELECT 
  '📊 Deletion breakdown:' as info;

SELECT 
  deletion_reason,
  COUNT(*) as count
FROM contracts_to_delete
GROUP BY deletion_reason
ORDER BY count DESC;

-- ============================================================
-- STEP 2: Summary before deletion
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  'DELETION SUMMARY' as section;

SELECT 
  'Total contracts to delete' as metric,
  COUNT(*) as count
FROM contracts_to_delete;

SELECT 
  'Total contracts remaining' as metric,
  (SELECT COUNT(*) FROM contracts) - (SELECT COUNT(*) FROM contracts_to_delete) as count;

SELECT 
  '═══════════════════════════════════════' as divider;

-- ============================================================
-- STEP 3: UNCOMMENT THE FOLLOWING TO DELETE
-- ============================================================

/*
-- ⚠️ WARNING: THIS WILL PERMANENTLY DELETE CONTRACTS!
-- Only uncomment and run this section after reviewing the above results!

SELECT 
  '🗑️ DELETING MOCK CONTRACTS...' as status;

-- Delete the mock contracts
DELETE FROM contracts
WHERE id IN (SELECT id FROM contracts_to_delete);

SELECT 
  '✅ Mock contracts deleted' as status;

-- Verify deletion
SELECT 
  'Contracts deleted' as metric,
  (SELECT COUNT(*) FROM contracts_to_delete) as count;

SELECT 
  'Contracts remaining' as metric,
  COUNT(*) as count
FROM contracts;

-- Show updated party contract counts
SELECT 
  '📊 Updated top parties:' as info;

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
LIMIT 10;
*/

-- ============================================================
-- STEP 4: Drop temporary table
-- ============================================================

DROP TABLE IF EXISTS contracts_to_delete;

SELECT 
  '✅ Review complete - uncomment DELETE section if you want to proceed' as final_status;

