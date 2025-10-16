-- ============================================================================
-- FIX: Update Contract Type CHECK Constraint
-- ============================================================================
-- This script removes the restrictive CHECK constraint and adds a new one
-- that includes all valid contract types (legacy, enhanced, and Make.com)
-- ============================================================================

-- Step 1: Check current constraint
SELECT 
  '=== STEP 1: CURRENT CONSTRAINT ===' as section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'contracts'::regclass
  AND conname = 'contracts_contract_type_check';

-- Step 2: Drop the old restrictive constraint
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_contract_type_check;

-- Step 3: Add new flexible constraint with all valid types
ALTER TABLE contracts 
ADD CONSTRAINT contracts_contract_type_check 
CHECK (contract_type IN (
  -- Legacy database types
  'employment',
  'service',
  'consultancy',
  'partnership',
  -- Enhanced contract types
  'full-time-permanent',
  'part-time-fixed',
  'consulting-agreement',
  'service-contract',
  'freelance-project',
  'partnership-agreement',
  'nda-standard',
  'vendor-supply',
  'lease-equipment',
  -- Make.com automated types
  'oman-unlimited-makecom',
  'oman-fixed-term-makecom',
  'oman-part-time-makecom'
));

-- Step 4: Verify new constraint
SELECT 
  '=== STEP 4: NEW CONSTRAINT ===' as section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'contracts'::regclass
  AND conname = 'contracts_contract_type_check';

-- Step 5: Test insert with oman-unlimited-makecom (should work now)
SELECT 
  '=== STEP 5: VALIDATION TEST ===' as section,
  'oman-unlimited-makecom' as test_contract_type,
  CASE 
    WHEN 'oman-unlimited-makecom' IN (
      'employment', 'service', 'consultancy', 'partnership',
      'full-time-permanent', 'part-time-fixed', 'consulting-agreement',
      'service-contract', 'freelance-project', 'partnership-agreement',
      'nda-standard', 'vendor-supply', 'lease-equipment',
      'oman-unlimited-makecom', 'oman-fixed-term-makecom', 'oman-part-time-makecom'
    ) THEN '✅ Valid - Will be accepted'
    ELSE '❌ Invalid - Will be rejected'
  END as validation_result;

-- ============================================================================
-- 🎯 RESULT:
-- ============================================================================
-- After running this script:
-- ✅ All 16 contract types are now valid
-- ✅ oman-unlimited-makecom can be inserted
-- ✅ Make.com contract generation will work
-- ============================================================================

