-- ============================================================================
-- FIX EMPLOYER_EMPLOYEES FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- This script fixes incorrect foreign key constraints on employer_employees
-- ============================================================================

-- Check current constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
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
ORDER BY tc.constraint_name;

-- Drop incorrect foreign key constraint if it points to promoters
DO $$
BEGIN
  -- Check if employee_id constraint points to promoters (wrong)
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'employer_employees'
      AND kcu.column_name = 'employee_id'
      AND ccu.table_name = 'promoters'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Drop the incorrect constraint
    ALTER TABLE employer_employees 
    DROP CONSTRAINT IF EXISTS employer_employees_employee_id_fkey;
    
    RAISE NOTICE 'Dropped incorrect employee_id foreign key constraint pointing to promoters';
  END IF;
END $$;

-- Drop employer_id constraint if it points to wrong table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'employer_employees'
      AND kcu.column_name = 'employer_id'
      AND ccu.table_name != 'profiles'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE employer_employees 
    DROP CONSTRAINT IF EXISTS employer_employees_employer_id_fkey;
    
    RAISE NOTICE 'Dropped incorrect employer_id foreign key constraint';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: CLEAN UP ORPHANED RECORDS
-- ============================================================================

-- Find and report orphaned records
SELECT 
  'ORPHANED RECORDS CHECK' as check_type,
  COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)) as orphaned_employee_ids,
  COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)) as orphaned_employer_ids
FROM employer_employees ee;

-- Option 1: Delete orphaned records (recommended if they're invalid)
-- Delete records where employee_id doesn't exist in profiles
DELETE FROM employer_employees
WHERE employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = employer_employees.employee_id);

-- Delete records where employer_id doesn't exist in profiles
DELETE FROM employer_employees
WHERE employer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = employer_employees.employer_id);

-- Option 2: Try to fix orphaned records by finding matching profiles
-- This attempts to link employee_id to profiles by matching with promoters
UPDATE employer_employees ee
SET employee_id = (
  SELECT pr.id
  FROM profiles pr
  JOIN promoters p ON LOWER(p.email) = LOWER(pr.email)
  WHERE p.id = ee.promoter_id
  LIMIT 1
)
WHERE ee.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  AND ee.promoter_id IS NOT NULL;

-- Try to fix employer_id by matching with parties
UPDATE employer_employees ee
SET employer_id = (
  SELECT pr.id
  FROM profiles pr
  JOIN parties pt ON LOWER(pt.contact_email) = LOWER(pr.email)
  WHERE pt.id = ee.party_id
    AND pt.type = 'Employer'
  LIMIT 1
)
WHERE ee.employer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)
  AND ee.party_id IS NOT NULL;

-- Delete any remaining orphaned records
DELETE FROM employer_employees
WHERE (employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = employee_id))
   OR (employer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = employer_id));

-- ============================================================================
-- STEP 4: ADD CORRECT FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add correct foreign key constraints pointing to profiles
DO $$
BEGIN
  -- Add employee_id constraint pointing to profiles (if it doesn't exist)
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
    -- Verify no orphaned records exist before adding constraint
    IF NOT EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.employee_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
    ) THEN
      ALTER TABLE employer_employees
      ADD CONSTRAINT employer_employees_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'Added correct employee_id foreign key constraint pointing to profiles';
    ELSE
      RAISE WARNING 'Cannot add constraint: orphaned employee_id records still exist';
    END IF;
  END IF;
  
  -- Add employer_id constraint pointing to profiles (if it doesn't exist)
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
    -- Verify no orphaned records exist before adding constraint
    IF NOT EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.employer_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)
    ) THEN
      ALTER TABLE employer_employees
      ADD CONSTRAINT employer_employees_employer_id_fkey
      FOREIGN KEY (employer_id) REFERENCES profiles(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'Added correct employer_id foreign key constraint pointing to profiles';
    ELSE
      RAISE WARNING 'Cannot add constraint: orphaned employer_id records still exist';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

-- Verify constraints are correct
SELECT 
  'CONSTRAINT VERIFICATION' as check_type,
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
ORDER BY kcu.column_name;

-- Verify no orphaned records remain
SELECT 
  'DATA INTEGRITY CHECK' as check_type,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE employee_id IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)) as valid_employee_ids,
  COUNT(*) FILTER (WHERE employer_id IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)) as valid_employer_ids,
  COUNT(*) FILTER (WHERE employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)) as orphaned_employee_ids,
  COUNT(*) FILTER (WHERE employer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employer_id)) as orphaned_employer_ids
FROM employer_employees ee;

