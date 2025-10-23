-- Quick summary of what mock contracts were found
-- This will help you decide what to clean up

SELECT 
  '📊 MOCK CONTRACT SUMMARY' as report;

-- How many contracts have test/mock keywords?
SELECT 
  'Contracts with Test/Mock Keywords' as category,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '❌ FOUND - Should delete' ELSE '✅ NONE' END as recommendation
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

-- Show examples if any found
SELECT 
  '📋 Examples of Test/Mock Contracts:' as info;

SELECT 
  contract_number,
  title,
  status,
  created_at::date as created_date
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(contract_number) LIKE '%test%'
LIMIT 10;

-- How many contracts without ANY parties?
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  'Contracts Without ANY Parties' as category,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 50 THEN '⚠️ HIGH - Review carefully before deleting'
    WHEN COUNT(*) > 0 THEN '⚠️ FOUND - Review then delete'
    ELSE '✅ NONE'
  END as recommendation
FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL;

-- Show examples
SELECT 
  '📋 Examples of Contracts Without Parties:' as info;

SELECT 
  contract_number,
  title,
  status,
  promoter_id IS NOT NULL as has_promoter,
  created_at::date as created_date
FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL
LIMIT 10;

-- Seed data pattern
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  'Seed Data Pattern (CNT-YYYY-00X)' as category,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '⚠️ REVIEW - Might be early real contracts' ELSE '✅ NONE' END as recommendation
FROM contracts
WHERE contract_number ~ '^CNT-\d{4}-00[0-9]$';

-- Show examples
SELECT 
  '📋 Examples of Seed Pattern Contracts:' as info;

SELECT 
  contract_number,
  title,
  status,
  created_at::date as created_date
FROM contracts
WHERE contract_number ~ '^CNT-\d{4}-00[0-9]$'
LIMIT 10;

-- Overall summary
SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '📈 OVERALL SUMMARY' as section;

SELECT 
  metric,
  count,
  percentage
FROM (
  SELECT 
    'Total Contracts' as metric,
    COUNT(*) as count,
    '100%' as percentage,
    1 as sort_order
  FROM contracts
  
  UNION ALL
  
  SELECT 
    'Real Business Contracts (estimated)',
    COUNT(*),
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 1)::text || '%',
    2
  FROM contracts
  WHERE 
    -- NOT test/mock
    NOT (
      LOWER(title) LIKE '%test%'
      OR LOWER(title) LIKE '%mock%'
      OR LOWER(title) LIKE '%sample%'
    )
    -- HAS parties
    AND (
      employer_id IS NOT NULL 
      OR client_id IS NOT NULL 
      OR first_party_id IS NOT NULL 
      OR second_party_id IS NOT NULL
    )
  
  UNION ALL
  
  SELECT 
    'Potential Mock/Test Data',
    COUNT(*),
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 1)::text || '%',
    3
  FROM contracts
  WHERE 
    LOWER(title) LIKE '%test%'
    OR LOWER(title) LIKE '%mock%'
    OR LOWER(title) LIKE '%sample%'
    OR (
      employer_id IS NULL 
      AND client_id IS NULL 
      AND first_party_id IS NULL 
      AND second_party_id IS NULL
    )
) summary
ORDER BY sort_order;

SELECT 
  '═══════════════════════════════════════' as divider;

-- Decision helper
SELECT 
  '💡 RECOMMENDATION' as section;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM contracts WHERE LOWER(title) LIKE '%test%' OR LOWER(title) LIKE '%mock%') > 0
    THEN '🔴 You have test/mock contracts - SAFE TO DELETE'
    
    WHEN (SELECT COUNT(*) FROM contracts WHERE employer_id IS NULL AND client_id IS NULL AND first_party_id IS NULL AND second_party_id IS NULL) > 50
    THEN '🟡 Many contracts without parties - REVIEW CAREFULLY'
    
    WHEN (SELECT COUNT(*) FROM contracts WHERE employer_id IS NULL AND client_id IS NULL AND first_party_id IS NULL AND second_party_id IS NULL) > 0
    THEN '🟡 Some contracts without parties - REVIEW THEN DELETE'
    
    ELSE '✅ Database looks clean - minimal cleanup needed'
  END as recommendation;

