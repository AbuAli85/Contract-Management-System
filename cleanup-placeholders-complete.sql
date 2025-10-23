-- Complete cleanup script: Remove placeholder parties safely
-- Run this entire script in your Supabase SQL Editor

-- ============================================================
-- STEP 1: Temporarily disable triggers during cleanup
-- ============================================================

SELECT 
  '🔧 Disabling triggers for cleanup...' as status;

-- Disable the sync triggers temporarily
ALTER TABLE contracts DISABLE TRIGGER sync_contract_party_ids_trigger;
ALTER TABLE contracts DISABLE TRIGGER ALL; -- Disable all triggers temporarily

-- ============================================================
-- STEP 2: Check contracts referencing placeholder parties
-- ============================================================

SELECT 
  '⚠️ Checking for contracts using placeholder parties...' as status;

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
-- STEP 3: Update contracts to remove placeholder references
-- ============================================================

SELECT 
  '🔧 Removing placeholder references from contracts...' as status;

-- Set placeholder references to NULL (triggers are disabled)
UPDATE contracts
SET 
  employer_id = CASE WHEN employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN NULL ELSE employer_id END,
  client_id = CASE WHEN client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN NULL ELSE client_id END,
  first_party_id = CASE WHEN first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN NULL ELSE first_party_id END,
  second_party_id = CASE WHEN second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN NULL ELSE second_party_id END
WHERE 
  employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Show how many contracts were updated
SELECT 
  '📊 Update Results' as section;

SELECT 
  'Contracts Updated' as metric,
  (SELECT pg_typeof(employer_id)::text FROM contracts LIMIT 1) as employer_id_type,
  (SELECT pg_typeof(first_party_id)::text FROM contracts LIMIT 1) as first_party_id_type;

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

-- ============================================================
-- STEP 5: Re-enable triggers
-- ============================================================

SELECT 
  '✅ Re-enabling triggers...' as status;

-- Re-enable all triggers
ALTER TABLE contracts ENABLE TRIGGER ALL;

-- ============================================================
-- STEP 6: Verification
-- ============================================================

SELECT 
  '✅ CLEANUP VERIFICATION' as section;

-- Check for any remaining placeholders
SELECT 
  'Remaining Placeholders' as metric,
  COUNT(*) as count
FROM parties
WHERE 
  name_en LIKE 'Placeholder%'
  OR crn LIKE 'PLACEHOLDER%'
  OR id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Show total party count
SELECT 
  'Total Parties After Cleanup' as metric,
  COUNT(*) as count
FROM parties;

-- Show party count by type
SELECT 
  '📊 Parties by Type' as section,
  '─────────────────────' as separator;

SELECT 
  COALESCE(type, 'NULL') as type,
  COUNT(*) as count
FROM parties
GROUP BY type
ORDER BY count DESC;

-- Show contracts without any party assignment (may need manual review)
SELECT 
  '⚠️ Data Quality Check' as section,
  '──────────────────────' as separator;

SELECT 
  'Contracts Without ANY Party' as metric,
  COUNT(*) as count
FROM contracts
WHERE employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL;

SELECT 
  'Contracts Without Promoter' as metric,
  COUNT(*) as count
FROM contracts
WHERE promoter_id IS NULL;

SELECT 
  '✨ CLEANUP COMPLETE!' as final_status,
  NOW()::text as timestamp;

