-- Identify mock and test contracts for cleanup
-- This will help find contracts that are not real business contracts

-- ============================================================
-- 1. Check for contracts with test/mock indicators in names
-- ============================================================

SELECT 
  '🔍 Searching for mock contracts...' as status;

-- Contracts with "test", "mock", "sample", "demo" in title or description
SELECT 
  id,
  contract_number,
  title,
  status,
  contract_type,
  created_at,
  'TEST/MOCK in title' as reason
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(title) LIKE '%placeholder%'
  OR LOWER(description) LIKE '%test%'
  OR LOWER(description) LIKE '%mock%'
ORDER BY created_at DESC;

-- ============================================================
-- 2. Check for contracts with test contract numbers
-- ============================================================

SELECT 
  '📋 Contracts with test contract numbers:' as info;

SELECT 
  id,
  contract_number,
  title,
  status,
  created_at,
  'TEST CONTRACT NUMBER' as reason
FROM contracts
WHERE 
  contract_number LIKE '%TEST%'
  OR contract_number LIKE '%MOCK%'
  OR contract_number LIKE '%SAMPLE%'
  OR contract_number LIKE '%000000%'
  OR contract_number = 'PLACEHOLDER-001'
  OR contract_number = 'PLACEHOLDER-002'
ORDER BY created_at DESC;

-- ============================================================
-- 3. Check for contracts with placeholder parties
-- ============================================================

SELECT 
  '🔍 Contracts using placeholder parties:' as info;

SELECT 
  id,
  contract_number,
  title,
  status,
  created_at,
  'PLACEHOLDER PARTY' as reason
FROM contracts
WHERE 
  employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- ============================================================
-- 4. Check for contracts with no parties assigned
-- ============================================================

SELECT 
  '⚠️ Contracts without ANY parties assigned:' as info;

SELECT 
  id,
  contract_number,
  title,
  status,
  contract_type,
  promoter_id,
  created_at,
  'NO PARTIES' as reason
FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- 5. Check for duplicate/similar contracts
-- ============================================================

SELECT 
  '🔄 Checking for potential duplicates:' as info;

SELECT 
  contract_number,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as contract_ids
FROM contracts
GROUP BY contract_number
HAVING COUNT(*) > 1;

-- ============================================================
-- 6. Contracts with invalid/missing data
-- ============================================================

SELECT 
  '⚠️ Contracts with data quality issues:' as info;

SELECT 
  id,
  contract_number,
  title,
  status,
  CASE 
    WHEN title IS NULL OR title = '' THEN 'Missing title'
    WHEN contract_number IS NULL OR contract_number = '' THEN 'Missing number'
    WHEN promoter_id IS NULL THEN 'Missing promoter'
    WHEN start_date IS NULL THEN 'Missing start date'
    WHEN end_date IS NULL THEN 'Missing end date'
    ELSE 'Other issue'
  END as issue,
  created_at
FROM contracts
WHERE 
  title IS NULL OR title = ''
  OR contract_number IS NULL OR contract_number = ''
  OR start_date IS NULL
  OR end_date IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- 7. Summary of potential mock contracts
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '📊 SUMMARY - Contracts to Review' as section;

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  'Total Contracts' as metric,
  COUNT(*) as count
FROM contracts
UNION ALL
SELECT 
  'With Test/Mock Names',
  COUNT(*)
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(title) LIKE '%placeholder%'
UNION ALL
SELECT 
  'With Placeholder Parties',
  COUNT(*)
FROM contracts
WHERE 
  employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
UNION ALL
SELECT 
  'Without ANY Parties',
  COUNT(*)
FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL
UNION ALL
SELECT 
  'Without Promoter',
  COUNT(*)
FROM contracts
WHERE promoter_id IS NULL
UNION ALL
SELECT 
  'With Status = draft',
  COUNT(*)
FROM contracts
WHERE status = 'draft'
UNION ALL
SELECT 
  'Duplicate Contract Numbers',
  COUNT(*)
FROM (
  SELECT contract_number
  FROM contracts
  GROUP BY contract_number
  HAVING COUNT(*) > 1
) duplicates;

SELECT 
  '═══════════════════════════════════════' as divider;

