-- Complete cleanup script: Remove placeholder parties safely
-- Run this entire script in your Supabase SQL Editor
-- Simple approach: Update contracts first, then delete parties

-- ============================================================
-- STEP 1: Check current state
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
-- STEP 2: Show affected contracts before update
-- ============================================================

SELECT 
  '📋 Affected Contracts (will be nullified):' as info;

SELECT 
  contract_number,
  title,
  status,
  CASE WHEN employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN 'YES' ELSE '-' END as employer_is_placeholder,
  CASE WHEN client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN 'YES' ELSE '-' END as client_is_placeholder,
  CASE WHEN first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN 'YES' ELSE '-' END as first_party_is_placeholder,
  CASE WHEN second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN 'YES' ELSE '-' END as second_party_is_placeholder
FROM contracts
WHERE 
  employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
LIMIT 10;

-- ============================================================
-- STEP 3: Update contracts - NULL out placeholder references
-- ============================================================

SELECT 
  '🔧 Nullifying placeholder references in contracts...' as status;

-- Update employer_id
UPDATE contracts
SET employer_id = NULL
WHERE employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Update client_id
UPDATE contracts
SET client_id = NULL
WHERE client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Update first_party_id
UPDATE contracts
SET first_party_id = NULL
WHERE first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Update second_party_id
UPDATE contracts
SET second_party_id = NULL
WHERE second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

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
-- STEP 5: Verification & Final Status
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
  'Contracts Without Parties' as metric,
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
