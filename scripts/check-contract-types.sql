-- ============================================================================
-- CHECK CONTRACT TYPES CONFIGURATION
-- ============================================================================
-- This script helps diagnose "Contract type not found" errors
-- ============================================================================

-- 1. Check what contract types exist in the database (if any)
SELECT 
  '=== CONTRACT TYPES IN DATABASE ===' as section,
  *
FROM information_schema.columns
WHERE table_name = 'contracts'
  AND column_name = 'contract_type'
LIMIT 5;

-- 2. Sample existing contracts and their types
SELECT 
  '=== EXISTING CONTRACTS SAMPLE ===' as section,
  id,
  contract_number,
  title,
  contract_type,
  type,
  status,
  created_at
FROM contracts
ORDER BY created_at DESC
LIMIT 10;

-- 3. Count contracts by type
SELECT 
  '=== CONTRACT TYPE DISTRIBUTION ===' as section,
  COALESCE(contract_type, type, 'NULL') as type_value,
  COUNT(*) as count
FROM contracts
GROUP BY COALESCE(contract_type, type, 'NULL')
ORDER BY count DESC;

-- ============================================================================
-- AVAILABLE CONTRACT TYPES (Frontend Configuration)
-- ============================================================================
-- Based on lib/contract-type-config.ts, these IDs are valid:
-- 
-- ✅ 'full-time-permanent' - Full-Time Permanent Employment
-- ✅ 'part-time-fixed' - Part-Time Fixed-Term Contract
-- ✅ 'consulting-agreement' - Consulting Services Agreement  
-- ✅ 'service-contract' - Professional Services Contract
-- ✅ 'freelance-project' - Freelance Project Contract
-- ✅ 'partnership-agreement' - Business Partnership Agreement
-- ✅ 'nda-standard' - Non-Disclosure Agreement
-- ✅ 'vendor-supply' - Vendor Supply Agreement
-- ✅ 'lease-equipment' - Equipment Lease Agreement
--
-- DATABASE VALUES (for existing records):
-- ✅ 'employment' - Employment contract
-- ✅ 'service' - Service contract
-- ✅ 'consultancy' - Consultancy contract  
-- ✅ 'partnership' - Partnership
--
-- ============================================================================

-- 4. If you're getting "Contract type not found" error:
--    The contract_type value you're sending doesn't match any of the IDs above.
--
-- Example fixes:
-- UPDATE contracts SET contract_type = 'full-time-permanent' WHERE contract_type = 'invalid_type';
-- UPDATE contracts SET contract_type = 'employment' WHERE contract_type IS NULL;

