-- ============================================================================
-- COMPLETE FIX FOR EMPLOYER_EMPLOYEES FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- This script completely fixes all foreign key constraints on employer_employees
-- Run this FIRST before running sync-feature-alignment-data.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT CONSTRAINTS
-- ============================================================================

SELECT 
  'CURRENT CONSTRAINTS' as step,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'employer_employees'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('employee_id', 'employer_id')
ORDER BY kcu.column_name, tc.constraint_name;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING CONSTRAINTS ON employee_id AND employer_id
-- ============================================================================

-- Drop ALL foreign key constraints on employee_id (regardless of target table)
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employer_employees'
      AND kcu.column_name = 'employee_id'
      AND tc.constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE 'ALTER TABLE employer_employees DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name || ' CASCADE';
    RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
  END LOOP;
END $$;

-- Drop ALL foreign key constraints on employer_id (regardless of target table)
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employer_employees'
      AND kcu.column_name = 'employer_id'
      AND tc.constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE 'ALTER TABLE employer_employees DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name || ' CASCADE';
    RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: CLEAN UP ORPHANED RECORDS
-- ============================================================================

-- Report orphaned records
SELECT 
  'ORPHANED RECORDS CHECK' as step,
  COUNT(*) FILTER (WHERE employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)) as orphaned_employee_ids,
  COUNT(*) FILTER (WHERE employer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)) as orphaned_employer_ids,
  COUNT(*) as total_records
FROM employer_employees ee;

-- Try to fix orphaned employee_id by matching with promoters
UPDATE employer_employees ee
SET employee_id = (
  SELECT pr.id
  FROM profiles pr
  JOIN promoters p ON LOWER(COALESCE(p.email, '')) = LOWER(COALESCE(pr.email, ''))
  WHERE p.id = ee.promoter_id
    AND pr.email IS NOT NULL
    AND p.email IS NOT NULL
  LIMIT 1
)
WHERE ee.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  AND ee.promoter_id IS NOT NULL;

-- Try to fix orphaned employer_id by matching with parties
UPDATE employer_employees ee
SET employer_id = (
  SELECT pr.id
  FROM profiles pr
  JOIN parties pt ON LOWER(COALESCE(pt.contact_email, '')) = LOWER(COALESCE(pr.email, ''))
  WHERE pt.id = ee.party_id
    AND pt.type = 'Employer'
    AND pr.email IS NOT NULL
    AND pt.contact_email IS NOT NULL
  LIMIT 1
)
WHERE ee.employer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)
  AND ee.party_id IS NOT NULL;

-- Delete any remaining orphaned records (they're invalid)
DELETE FROM employer_employees
WHERE (employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = employee_id))
   OR (employer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = employer_id));

-- Report remaining orphaned records (should be 0)
SELECT 
  'ORPHANED RECORDS AFTER CLEANUP' as step,
  COUNT(*) FILTER (WHERE employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)) as orphaned_employee_ids,
  COUNT(*) FILTER (WHERE employer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)) as orphaned_employer_ids
FROM employer_employees ee;

-- ============================================================================
-- STEP 4: ADD CORRECT FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add employee_id constraint pointing to profiles
DO $$
BEGIN
  -- Verify no orphaned records exist
  IF EXISTS (
    SELECT 1 FROM employer_employees ee
    WHERE ee.employee_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  ) THEN
    RAISE EXCEPTION 'Cannot add constraint: orphaned employee_id records still exist. Run cleanup steps first.';
  END IF;

  -- Add the constraint
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'employer_employees'
      AND kcu.column_name = 'employee_id'
      AND ccu.table_name = 'profiles'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE employer_employees
    ADD CONSTRAINT employer_employees_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added correct employee_id foreign key constraint pointing to profiles';
  ELSE
    RAISE NOTICE '✅ employee_id constraint already exists and is correct';
  END IF;
END $$;

-- Add employer_id constraint pointing to profiles
DO $$
BEGIN
  -- Verify no orphaned records exist
  IF EXISTS (
    SELECT 1 FROM employer_employees ee
    WHERE ee.employer_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)
  ) THEN
    RAISE EXCEPTION 'Cannot add constraint: orphaned employer_id records still exist. Run cleanup steps first.';
  END IF;

  -- Add the constraint
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'employer_employees'
      AND kcu.column_name = 'employer_id'
      AND ccu.table_name = 'profiles'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE employer_employees
    ADD CONSTRAINT employer_employees_employer_id_fkey
    FOREIGN KEY (employer_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added correct employer_id foreign key constraint pointing to profiles';
  ELSE
    RAISE NOTICE '✅ employer_id constraint already exists and is correct';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

-- Verify constraints are correct
SELECT 
  'FINAL CONSTRAINT VERIFICATION' as step,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE 
    WHEN ccu.table_name = 'profiles' THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'employer_employees'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('employee_id', 'employer_id')
ORDER BY kcu.column_name;

-- Verify data integrity
SELECT 
  'DATA INTEGRITY VERIFICATION' as step,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE employee_id IS NOT NULL) as records_with_employee_id,
  COUNT(*) FILTER (WHERE employer_id IS NOT NULL) as records_with_employer_id,
  COUNT(*) FILTER (
    WHERE employee_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  ) as valid_employee_ids,
  COUNT(*) FILTER (
    WHERE employer_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)
  ) as valid_employer_ids
FROM employer_employees ee;

SELECT '✅ Constraint fix complete! You can now run sync-feature-alignment-data.sql' as status;

