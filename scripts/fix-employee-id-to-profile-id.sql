-- ============================================================================
-- FIX EMPLOYER_EMPLOYEES: Update employee_id from promoter ID to profile ID
-- ============================================================================
-- This script fixes employer_employees records where employee_id points to
-- a promoter ID instead of a profile ID (which violates the foreign key)
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY PROBLEMATIC RECORDS
-- ============================================================================

-- Find employer_employees where employee_id doesn't exist in profiles
SELECT 
  'PROBLEMATIC RECORDS' as check_type,
  ee.id as employer_employee_id,
  ee.employee_id as current_employee_id,
  ee.employer_id,
  p.id as promoter_id,
  p.email as promoter_email,
  pr.id as profile_id,
  pr.email as profile_email,
  CASE 
    WHEN pr.id IS NULL THEN '❌ NO PROFILE FOUND'
    ELSE '✅ PROFILE EXISTS'
  END as status
FROM employer_employees ee
LEFT JOIN promoters p ON p.id = ee.employee_id
LEFT JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE ee.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = ee.employee_id
  )
ORDER BY ee.created_at DESC;

-- ============================================================================
-- STEP 2: UPDATE RECORDS (FIX employee_id)
-- ============================================================================

-- Update employer_employees to use profile ID instead of promoter ID
UPDATE employer_employees ee
SET 
  employee_id = pr.id,
  updated_at = NOW()
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE ee.employee_id = p.id
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  AND pr.id IS NOT NULL;

-- ============================================================================
-- STEP 3: VERIFY FIXES
-- ============================================================================

-- Check if all records now have valid profile IDs
SELECT 
  'VERIFICATION' as check_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id) THEN 1 END) as valid_records,
  COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id) THEN 1 END) as invalid_records
FROM employer_employees ee
WHERE ee.employee_id IS NOT NULL;

-- Show any remaining problematic records
SELECT 
  'REMAINING ISSUES' as check_type,
  ee.id as employer_employee_id,
  ee.employee_id,
  p.email as promoter_email,
  'No matching profile found' as issue
FROM employer_employees ee
LEFT JOIN promoters p ON p.id = ee.employee_id
WHERE ee.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  AND p.id IS NULL;

-- ============================================================================
-- STEP 4: FIX SPECIFIC EMPLOYEE (if you know the name/email)
-- ============================================================================

-- Example: Fix a specific employee by email
-- Replace 'employee@example.com' with the actual email

/*
UPDATE employer_employees ee
SET 
  employee_id = pr.id,
  updated_at = NOW()
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE LOWER(TRIM(p.email)) = LOWER(TRIM('employee@example.com'))
  AND ee.employee_id = p.id
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  AND pr.id IS NOT NULL;
*/

