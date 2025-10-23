-- Complete cleanup script: Fix triggers then remove placeholders
-- Run this entire script in your Supabase SQL Editor

-- ============================================================
-- STEP 1: Fix the trigger functions (remove TEXT vs UUID comparison)
-- ============================================================

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts;
DROP FUNCTION IF EXISTS sync_contract_party_ids() CASCADE;

-- Recreate with proper UUID types only
CREATE OR REPLACE FUNCTION sync_contract_party_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync first_party_id and employer_id (both UUID now)
  IF NEW.first_party_id IS NOT NULL AND NEW.employer_id IS NULL THEN
    NEW.employer_id = NEW.first_party_id;
  ELSIF NEW.employer_id IS NOT NULL AND NEW.first_party_id IS NULL THEN
    NEW.first_party_id = NEW.employer_id;
  END IF;
  
  -- Sync second_party_id and client_id (both UUID now)
  IF NEW.second_party_id IS NOT NULL AND NEW.client_id IS NULL THEN
    NEW.client_id = NEW.second_party_id;
  ELSIF NEW.client_id IS NOT NULL AND NEW.second_party_id IS NULL THEN
    NEW.second_party_id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER sync_contract_party_ids_trigger
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_party_ids();

-- ============================================================
-- STEP 2: Check for contracts referencing placeholder parties
-- ============================================================

SELECT 
  '⚠️ Checking for contracts using placeholder parties...' as status;

SELECT 
  COUNT(*) as contracts_with_placeholders,
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
-- STEP 3: Remove placeholder parties
-- ============================================================

SELECT 
  '🗑️ Deleting placeholder parties...' as status;

DELETE FROM parties 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',  -- Placeholder Client
  '00000000-0000-0000-0000-000000000002'   -- Placeholder Employer
);

-- ============================================================
-- STEP 4: Verify cleanup
-- ============================================================

SELECT 
  '✅ Verification Results' as status;

-- Check for any remaining placeholders
SELECT 
  'Remaining Placeholders' as metric,
  COUNT(*) as count
FROM parties
WHERE 
  name_en LIKE 'Placeholder%'
  OR crn LIKE 'PLACEHOLDER%';

-- Show total party count
SELECT 
  'Total Parties After Cleanup' as metric,
  COUNT(*) as count
FROM parties;

-- Show party count by type
SELECT 
  type as metric,
  COUNT(*) as count
FROM parties
GROUP BY type
ORDER BY count DESC;

SELECT 
  '✨ Cleanup Complete!' as final_status;

