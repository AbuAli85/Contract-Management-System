-- ========================================
-- PRODUCTION DATA CLEANUP SCRIPT
-- ========================================
-- This script identifies and removes mock/test data from the production database
-- 
-- IMPORTANT: 
-- 1. Create a full database backup before running this script
-- 2. Test this script in a development/staging environment first
-- 3. Review the identified records before deletion
-- 4. Run this script during a maintenance window
--
-- Usage:
-- 1. First, run the SELECT queries to review what will be deleted
-- 2. Then, uncomment and run the DELETE queries
-- ========================================

-- ========================================
-- 1. IDENTIFY MOCK CONTRACTS
-- ========================================

-- Find contracts with test/mock indicators in their data
SELECT 
    id,
    contract_number,
    status,
    created_at,
    'Mock contract number pattern' as reason
FROM contracts
WHERE 
    contract_number LIKE '%TEST%'
    OR contract_number LIKE '%MOCK%'
    OR contract_number LIKE '%DEBUG%'
    OR contract_number LIKE '%SAMPLE%'
    OR contract_number LIKE 'DEBUG-%'
ORDER BY created_at DESC;

-- Find contracts with placeholder or test party names (checking both employer_id and client_id)
SELECT DISTINCT
    c.id,
    c.contract_number,
    c.status,
    c.created_at,
    COALESCE(pe.name_en, pe.name_ar, ce.name_en, ce.name_ar) as party_name,
    'Test party name' as reason
FROM contracts c
LEFT JOIN parties pe ON c.employer_id = pe.id
LEFT JOIN parties ce ON c.client_id = ce.id
WHERE 
    (pe.name_en LIKE '%Test%' OR pe.name_en LIKE '%Mock%' OR pe.name_en LIKE '%Placeholder%' OR pe.name_en LIKE '%Sample%' OR pe.name_en = 'Test Party')
    OR (pe.name_ar LIKE '%Test%' OR pe.name_ar LIKE '%Mock%' OR pe.name_ar LIKE '%Placeholder%' OR pe.name_ar LIKE '%Sample%')
    OR (ce.name_en LIKE '%Test%' OR ce.name_en LIKE '%Mock%' OR ce.name_en LIKE '%Placeholder%' OR ce.name_en LIKE '%Sample%' OR ce.name_en = 'Test Party')
    OR (ce.name_ar LIKE '%Test%' OR ce.name_ar LIKE '%Mock%' OR ce.name_ar LIKE '%Placeholder%' OR ce.name_ar LIKE '%Sample%')
ORDER BY c.created_at DESC;

-- ========================================
-- 2. IDENTIFY PLACEHOLDER PARTIES
-- ========================================

SELECT 
    id,
    name_en,
    name_ar,
    type,
    created_at,
    'Placeholder party' as reason
FROM parties
WHERE 
    name_en LIKE '%Test%'
    OR name_en LIKE '%Mock%'
    OR name_en LIKE '%Placeholder%'
    OR name_en LIKE '%Sample%'
    OR name_en = 'Test Party'
    OR name_en = 'Sample Client'
    OR name_en = 'Demo Company'
    OR name_ar LIKE '%Test%'
    OR name_ar LIKE '%Mock%'
    OR name_ar LIKE '%Placeholder%'
    OR name_ar LIKE '%Sample%'
ORDER BY created_at DESC;

-- ========================================
-- 3. IDENTIFY ORPHANED PROMOTER CONTRACTS
-- ========================================

-- Find contracts with null or invalid promoter references
SELECT 
    id,
    contract_number,
    promoter_id,
    status,
    created_at,
    'Orphaned promoter reference' as reason
FROM contracts
WHERE 
    promoter_id IS NOT NULL
    AND promoter_id NOT IN (SELECT id FROM promoters)
ORDER BY created_at DESC;

-- ========================================
-- 4. IDENTIFY NULL FOREIGN KEY VIOLATIONS
-- ========================================

-- Contracts with null employer_id and client_id (should have at least one)
SELECT 
    id,
    contract_number,
    employer_id,
    client_id,
    status,
    created_at,
    'Null employer_id and client_id' as reason
FROM contracts
WHERE employer_id IS NULL AND client_id IS NULL
ORDER BY created_at DESC;

-- Contracts with invalid employer_id references
SELECT 
    id,
    contract_number,
    employer_id,
    status,
    created_at,
    'Invalid employer_id reference' as reason
FROM contracts
WHERE 
    employer_id IS NOT NULL
    AND employer_id NOT IN (SELECT id FROM parties)
ORDER BY created_at DESC;

-- Contracts with invalid client_id references
SELECT 
    id,
    contract_number,
    client_id,
    status,
    created_at,
    'Invalid client_id reference' as reason
FROM contracts
WHERE 
    client_id IS NOT NULL
    AND client_id NOT IN (SELECT id FROM parties)
ORDER BY created_at DESC;

-- ========================================
-- 5. IDENTIFY TEST USERS
-- ========================================

SELECT 
    id,
    email,
    status,
    created_at,
    'Test user email' as reason
FROM users
WHERE 
    email LIKE '%test%'
    OR email LIKE '%mock%'
    OR email LIKE '%sample%'
    OR email LIKE '%demo%'
    OR email LIKE '%+test@%'
ORDER BY created_at DESC;

-- ========================================
-- 6. CLEANUP QUERIES (UNCOMMENT TO EXECUTE)
-- ========================================

-- IMPORTANT: Review the SELECT query results above before uncommenting these DELETE queries

-- Delete mock contracts
-- DELETE FROM contracts
-- WHERE 
--     contract_number LIKE '%TEST%'
--     OR contract_number LIKE '%MOCK%'
--     OR contract_number LIKE '%DEBUG%'
--     OR contract_number LIKE '%SAMPLE%'
--     OR contract_number LIKE 'DEBUG-%';

-- Delete contracts with test parties (checking both employer_id and client_id)
-- DELETE FROM contracts
-- WHERE employer_id IN (
--     SELECT id FROM parties
--     WHERE 
--         name_en LIKE '%Test%'
--         OR name_en LIKE '%Mock%'
--         OR name_en LIKE '%Placeholder%'
--         OR name_en LIKE '%Sample%'
--         OR name_ar LIKE '%Test%'
--         OR name_ar LIKE '%Mock%'
--         OR name_ar LIKE '%Placeholder%'
--         OR name_ar LIKE '%Sample%'
-- )
-- OR client_id IN (
--     SELECT id FROM parties
--     WHERE 
--         name_en LIKE '%Test%'
--         OR name_en LIKE '%Mock%'
--         OR name_en LIKE '%Placeholder%'
--         OR name_en LIKE '%Sample%'
--         OR name_ar LIKE '%Test%'
--         OR name_ar LIKE '%Mock%'
--         OR name_ar LIKE '%Placeholder%'
--         OR name_ar LIKE '%Sample%'
-- );

-- Delete placeholder parties (after deleting their contracts)
-- DELETE FROM parties
-- WHERE 
--     name_en LIKE '%Test%'
--     OR name_en LIKE '%Mock%'
--     OR name_en LIKE '%Placeholder%'
--     OR name_en LIKE '%Sample%'
--     OR name_en = 'Test Party'
--     OR name_en = 'Sample Client'
--     OR name_en = 'Demo Company'
--     OR name_ar LIKE '%Test%'
--     OR name_ar LIKE '%Mock%'
--     OR name_ar LIKE '%Placeholder%'
--     OR name_ar LIKE '%Sample%';

-- Fix orphaned promoter contracts (set to NULL instead of deleting)
-- UPDATE contracts
-- SET promoter_id = NULL
-- WHERE 
--     promoter_id IS NOT NULL
--     AND promoter_id NOT IN (SELECT id FROM promoters);

-- Fix contracts with null employer_id and client_id (either delete or assign to a default party)
-- DELETE FROM contracts WHERE employer_id IS NULL AND client_id IS NULL;

-- Fix contracts with invalid employer_id references
-- DELETE FROM contracts
-- WHERE 
--     employer_id IS NOT NULL
--     AND employer_id NOT IN (SELECT id FROM parties);

-- Fix contracts with invalid client_id references
-- DELETE FROM contracts
-- WHERE 
--     client_id IS NOT NULL
--     AND client_id NOT IN (SELECT id FROM parties);

-- Delete test users (BE CAREFUL - verify these are actually test accounts)
-- DELETE FROM users
-- WHERE 
--     email LIKE '%+test@%'
--     OR email IN ('test@example.com', 'demo@example.com');

-- ========================================
-- 7. POST-CLEANUP VERIFICATION
-- ========================================

-- Verify no mock data remains
SELECT 
    'Contracts' as table_name,
    COUNT(*) as remaining_mock_records
FROM contracts
WHERE 
    contract_number LIKE '%TEST%'
    OR contract_number LIKE '%MOCK%'
    OR contract_number LIKE '%DEBUG%'

UNION ALL

SELECT 
    'Parties' as table_name,
    COUNT(*) as remaining_mock_records
FROM parties
WHERE 
    name_en LIKE '%Test%'
    OR name_en LIKE '%Mock%'
    OR name_en LIKE '%Placeholder%'
    OR name_ar LIKE '%Test%'
    OR name_ar LIKE '%Mock%'
    OR name_ar LIKE '%Placeholder%'

UNION ALL

SELECT 
    'Orphaned Contracts' as table_name,
    COUNT(*) as remaining_mock_records
FROM contracts
WHERE 
    (promoter_id IS NOT NULL AND promoter_id NOT IN (SELECT id FROM promoters))
    OR (employer_id IS NOT NULL AND employer_id NOT IN (SELECT id FROM parties))
    OR (client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM parties))
    OR (employer_id IS NULL AND client_id IS NULL);

-- ========================================
-- 8. ADD CONSTRAINTS TO PREVENT FUTURE ISSUES
-- ========================================

-- Add foreign key constraints with proper cascade behavior
-- Note: Test these in development first

-- ALTER TABLE contracts
-- DROP CONSTRAINT IF EXISTS contracts_employer_id_fkey,
-- ADD CONSTRAINT contracts_employer_id_fkey 
--     FOREIGN KEY (employer_id) 
--     REFERENCES parties(id) 
--     ON DELETE SET NULL;  -- Set to NULL if employer party is deleted

-- ALTER TABLE contracts
-- DROP CONSTRAINT IF EXISTS contracts_client_id_fkey,
-- ADD CONSTRAINT contracts_client_id_fkey 
--     FOREIGN KEY (client_id) 
--     REFERENCES parties(id) 
--     ON DELETE SET NULL;  -- Set to NULL if client party is deleted

-- ALTER TABLE contracts
-- DROP CONSTRAINT IF EXISTS contracts_promoter_id_fkey,
-- ADD CONSTRAINT contracts_promoter_id_fkey 
--     FOREIGN KEY (promoter_id) 
--     REFERENCES promoters(id) 
--     ON DELETE SET NULL;  -- Set to NULL if promoter is deleted

-- Add check constraints to prevent test data
-- ALTER TABLE contracts
-- ADD CONSTRAINT no_test_contract_numbers
-- CHECK (
--     contract_number NOT LIKE '%TEST%'
--     AND contract_number NOT LIKE '%MOCK%'
--     AND contract_number NOT LIKE '%DEBUG%'
-- );

-- ========================================
-- CLEANUP COMPLETE
-- ========================================
-- After running this script:
-- 1. Verify all data integrity
-- 2. Test critical application features
-- 3. Monitor for any errors in production
-- 4. Document what was cleaned up
-- ========================================

