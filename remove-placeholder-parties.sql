-- Remove placeholder parties from the database
-- These are test records that should not be in production

-- First, check if any contracts reference these placeholder parties
SELECT 
  'Contracts referencing placeholder parties:' as info,
  COUNT(*) as count
FROM contracts
WHERE 
  employer_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR client_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR first_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  OR second_party_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Delete the placeholder parties
DELETE FROM parties 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',  -- Placeholder Client
  '00000000-0000-0000-0000-000000000002'   -- Placeholder Employer
);

-- Verify deletion
SELECT 
  'Placeholder parties remaining:' as info,
  COUNT(*) as count
FROM parties
WHERE 
  name_en LIKE 'Placeholder%'
  OR crn LIKE 'PLACEHOLDER%';

-- Show current party count
SELECT 
  'Total parties after cleanup:' as info,
  COUNT(*) as count
FROM parties;

