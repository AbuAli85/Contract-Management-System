-- Diagnostic query to check contracts table foreign keys
-- Check which columns exist
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'contracts' 
  AND column_name IN ('employer_id', 'client_id', 'first_party_id', 'second_party_id')
ORDER BY column_name;

-- Check for NULL values in foreign keys
SELECT 
  COUNT(*) as total_contracts,
  COUNT(employer_id) as has_employer_id,
  COUNT(client_id) as has_client_id,
  COUNT(first_party_id) as has_first_party_id,
  COUNT(second_party_id) as has_second_party_id,
  COUNT(*) - COUNT(employer_id) as null_employer_id,
  COUNT(*) - COUNT(client_id) as null_client_id,
  COUNT(*) - COUNT(first_party_id) as null_first_party_id,
  COUNT(*) - COUNT(second_party_id) as null_second_party_id
FROM contracts;

-- Sample data showing party relationships
SELECT 
  id,
  contract_number,
  title,
  employer_id,
  client_id,
  first_party_id,
  second_party_id,
  status
FROM contracts
LIMIT 5;
