-- COMPREHENSIVE CONTRACT REVIEW & CLEANUP
-- This script identifies mock/test/incorrect contracts for cleanup
-- Run in sections - REVIEW FIRST, then uncomment DELETE sections if needed

-- ============================================================
-- SECTION 1: Identify Mock Contracts by Pattern
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;
SELECT 
  '🔍 MOCK CONTRACT IDENTIFICATION' as section;
SELECT 
  '═══════════════════════════════════════' as divider;

-- 1A. Contracts with test/mock keywords
SELECT 
  '1️⃣ Contracts with TEST/MOCK keywords:' as category;

SELECT 
  id,
  contract_number,
  title,
  status,
  created_at,
  'keyword: ' || 
  CASE 
    WHEN LOWER(title) LIKE '%test%' THEN 'test'
    WHEN LOWER(title) LIKE '%mock%' THEN 'mock'
    WHEN LOWER(title) LIKE '%sample%' THEN 'sample'
    WHEN LOWER(title) LIKE '%demo%' THEN 'demo'
    WHEN LOWER(title) LIKE '%placeholder%' THEN 'placeholder'
    ELSE 'other'
  END as issue_type
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(title) LIKE '%placeholder%'
  OR LOWER(contract_number) LIKE '%test%'
  OR LOWER(contract_number) LIKE '%mock%'
  OR LOWER(contract_number) LIKE '%sample%'
ORDER BY created_at DESC;

-- 1B. Contracts with CNT-2024 pattern (if current year is 2025)
SELECT 
  '2️⃣ Contracts with old year pattern (CNT-2024):' as category;

SELECT 
  id,
  contract_number,
  title,
  status,
  created_at,
  'old year in contract number' as issue_type
FROM contracts
WHERE 
  contract_number LIKE 'CNT-2024-%'
  AND EXTRACT(YEAR FROM created_at) >= 2025
ORDER BY created_at DESC
LIMIT 20;

-- 1C. Contracts without ANY parties
SELECT 
  '3️⃣ Contracts with NO parties assigned:' as category;

SELECT 
  id,
  contract_number,
  title,
  status,
  promoter_id,
  created_at,
  'no parties assigned' as issue_type
FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- 1D. Contracts with generic/duplicate titles
SELECT 
  '4️⃣ Contracts with generic titles:' as category;

SELECT 
  title,
  COUNT(*) as count,
  STRING_AGG(contract_number, ', ') as contract_numbers,
  'duplicate/generic title' as issue_type
FROM contracts
WHERE title IS NOT NULL
GROUP BY title
HAVING COUNT(*) > 10
ORDER BY count DESC
LIMIT 10;

-- 1E. Contracts created via seed/sample data endpoint
SELECT 
  '5️⃣ Contracts with CNT-YYYY-00X pattern (likely seed data):' as category;

SELECT 
  id,
  contract_number,
  title,
  status,
  created_at,
  'seed data pattern' as issue_type
FROM contracts
WHERE 
  contract_number ~ '^CNT-\d{4}-00[0-9]$'  -- Matches CNT-2024-001, CNT-2024-002, etc.
ORDER BY contract_number;

-- ============================================================
-- SECTION 2: Data Quality Issues
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;
SELECT 
  '📊 DATA QUALITY REVIEW' as section;
SELECT 
  '═══════════════════════════════════════' as divider;

-- 2A. Contracts with missing critical data
SELECT 
  '⚠️ Contracts missing critical fields:' as category;

SELECT 
  id,
  contract_number,
  title,
  CASE 
    WHEN title IS NULL OR title = '' THEN 'missing title'
    WHEN promoter_id IS NULL THEN 'missing promoter'
    WHEN start_date IS NULL THEN 'missing start date'
    WHEN end_date IS NULL THEN 'missing end date'
    ELSE 'other'
  END as missing_field,
  status,
  created_at
FROM contracts
WHERE 
  title IS NULL OR title = ''
  OR promoter_id IS NULL
  OR start_date IS NULL
  OR end_date IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 2B. Contracts with invalid date ranges
SELECT 
  '⚠️ Contracts with invalid dates:' as category;

SELECT 
  id,
  contract_number,
  title,
  start_date,
  end_date,
  'end before start' as issue,
  created_at
FROM contracts
WHERE 
  start_date IS NOT NULL 
  AND end_date IS NOT NULL
  AND end_date < start_date
ORDER BY created_at DESC;

-- ============================================================
-- SECTION 3: Summary Statistics
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;
SELECT 
  '📈 CLEANUP SUMMARY' as section;
SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  'Total Contracts in Database' as metric,
  COUNT(*) as count,
  '100%' as percentage
FROM contracts

UNION ALL

SELECT 
  'With Test/Mock Keywords',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 1)::text || '%'
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(contract_number) LIKE '%test%'
  OR LOWER(contract_number) LIKE '%mock%'

UNION ALL

SELECT 
  'Without ANY Parties',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 1)::text || '%'
FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL

UNION ALL

SELECT 
  'Without Promoter',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 1)::text || '%'
FROM contracts
WHERE promoter_id IS NULL

UNION ALL

SELECT 
  'With Draft Status',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 1)::text || '%'
FROM contracts
WHERE status = 'draft'

UNION ALL

SELECT 
  'Seed Data Pattern (CNT-YYYY-00X)',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 1)::text || '%'
FROM contracts
WHERE contract_number ~ '^CNT-\d{4}-00[0-9]$';

-- ============================================================
-- SECTION 4: RECOMMENDED CLEANUP ACTIONS
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;
SELECT 
  '💡 RECOMMENDED CLEANUP' as section;
SELECT 
  '═══════════════════════════════════════' as divider;

-- Priority 1: Delete contracts with test/mock keywords
SELECT 
  '🔴 HIGH PRIORITY - Mock/Test Contracts' as priority,
  COUNT(*) as count,
  'DELETE these - clearly test data' as action
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  OR LOWER(title) LIKE '%sample%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(contract_number) LIKE '%test%'
  OR LOWER(contract_number) LIKE '%mock%'

UNION ALL

-- Priority 2: Contracts without parties (likely incomplete/mock)
SELECT 
  '🟡 MEDIUM PRIORITY - No Parties',
  COUNT(*),
  'REVIEW then DELETE or assign parties'
FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL

UNION ALL

-- Priority 3: Seed data pattern
SELECT 
  '🟡 MEDIUM PRIORITY - Seed Data Pattern',
  COUNT(*),
  'REVIEW - might be early real contracts'
FROM contracts
WHERE contract_number ~ '^CNT-\d{4}-00[0-9]$'

UNION ALL

-- Priority 4: Contracts without promoters (review only)
SELECT 
  '🟢 LOW PRIORITY - No Promoter',
  COUNT(*),
  'KEEP - assign promoters via bulk assignment'
FROM contracts
WHERE promoter_id IS NULL;

SELECT 
  '═══════════════════════════════════════' as divider;

-- ============================================================
-- SECTION 5: SAFE CLEANUP QUERIES (Review before uncommenting)
-- ============================================================

/*
-- ⚠️⚠️⚠️ WARNING: THESE WILL DELETE CONTRACTS! ⚠️⚠️⚠️
-- Only uncomment and run AFTER reviewing the above results!

-- ============================================================
-- DELETE OPTION 1: Remove contracts with test/mock keywords
-- ============================================================

-- Step 1: Drop triggers temporarily
DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts CASCADE;

-- Step 2: Delete test/mock contracts
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

-- Step 3: Recreate trigger
CREATE OR REPLACE FUNCTION sync_contract_party_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_party_id IS NOT NULL AND NEW.employer_id IS NULL THEN
    NEW.employer_id = NEW.first_party_id;
  ELSIF NEW.employer_id IS NOT NULL AND NEW.first_party_id IS NULL THEN
    NEW.first_party_id = NEW.employer_id;
  END IF;
  
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

SELECT 'Test/mock contracts deleted' as status;

-- ============================================================
-- DELETE OPTION 2: Remove contracts without parties
-- ============================================================

-- Drop triggers
DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts CASCADE;

-- Delete contracts with no parties
DELETE FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL;

-- Recreate trigger (same as above)
[... recreate trigger code ...]

SELECT 'Contracts without parties deleted' as status;

-- ============================================================
-- DELETE OPTION 3: Remove seed data pattern contracts (CNT-YYYY-00X)
-- ============================================================

-- Drop triggers
DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts CASCADE;

-- Delete seed data contracts
DELETE FROM contracts
WHERE contract_number ~ '^CNT-\d{4}-00[0-9]$';

-- Recreate trigger
[... recreate trigger code ...]

SELECT 'Seed data contracts deleted' as status;

*/

-- ============================================================
-- FINAL: Show clean contract count
-- ============================================================

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '📊 Current Contract Status' as section;

SELECT 
  'Total Real Contracts' as metric,
  COUNT(*) as count
FROM contracts
WHERE 
  -- NOT test/mock
  NOT (
    LOWER(title) LIKE '%test%'
    OR LOWER(title) LIKE '%mock%'
    OR LOWER(title) LIKE '%sample%'
    OR LOWER(title) LIKE '%demo%'
  )
  -- HAS parties assigned
  AND (
    employer_id IS NOT NULL 
    OR client_id IS NOT NULL 
    OR first_party_id IS NOT NULL 
    OR second_party_id IS NOT NULL
  );

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '✅ Review complete - uncomment DELETE sections above to clean up' as final_status;

