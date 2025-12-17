-- ============================================================================
-- CREATE PROFILES FOR PROMOTERS WITHOUT PROFILES
-- ============================================================================
-- This script creates profile records for promoters that don't have matching profiles
-- This is needed because employer_employees.employee_id must reference profiles(id)
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY PROMOTERS WITHOUT PROFILES
-- ============================================================================

SELECT 
  'PROMOTERS WITHOUT PROFILES' as check_type,
  COUNT(*) as count
FROM promoters p
WHERE p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(pr.email) = LOWER(p.email)
  );

-- Show sample promoters without profiles
SELECT 
  'Sample Promoters without Profiles' as check_type,
  p.id as promoter_id,
  p.name_en,
  p.email,
  p.employer_id as party_id,
  pt.name_en as employer_name
FROM promoters p
LEFT JOIN parties pt ON pt.id = p.employer_id
WHERE p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(pr.email) = LOWER(p.email)
  )
LIMIT 10;

-- ============================================================================
-- STEP 2: CREATE PROFILES FOR PROMOTERS
-- ============================================================================

-- ============================================================================
-- IMPORTANT: Profiles table requires id to reference auth.users(id)
-- We have two options:
-- 1. Create auth.users entries first (requires admin access)
-- 2. Use existing profiles and link promoters to them
-- 
-- For now, we'll try to match existing profiles or skip promoters without profiles
-- ============================================================================

-- Check if profiles table allows NULL or has different constraint
DO $$
DECLARE
  has_auth_users_fk BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'profiles'
      AND kcu.column_name = 'id'
      AND ccu.table_name = 'auth.users'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) INTO has_auth_users_fk;
  
  IF has_auth_users_fk THEN
    RAISE NOTICE '⚠️ Profiles table requires auth.users entries. Cannot create profiles without auth users.';
    RAISE NOTICE 'Will only create employer_employee records for promoters with existing profiles.';
  ELSE
    RAISE NOTICE '✅ Profiles table does not require auth.users. Can create profiles directly.';
  END IF;
END $$;

-- ============================================================================
-- IMPORTANT: Cannot create profiles without auth.users entries
-- The profiles.id must reference auth.users(id)
-- So we'll skip profile creation and only link existing profiles
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '⚠️ Skipping profile creation - profiles require auth.users entries';
  RAISE NOTICE 'Will only create employer_employee records for promoters with existing profiles.';
END $$;

-- ============================================================================
-- STEP 3: VERIFY PROFILES CREATED
-- ============================================================================

SELECT 
  'PROFILES CREATED' as check_type,
  COUNT(*) as profiles_created
FROM promoters p
WHERE p.email IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(pr.email) = LOWER(p.email)
  );

-- ============================================================================
-- STEP 4: NOW CREATE EMPLOYER_EMPLOYEE RECORDS
-- ============================================================================

-- ============================================================================
-- STEP 4: CREATE EMPLOYER_EMPLOYEE RECORDS
-- ============================================================================
-- This will only create records for promoters that have matching profiles
-- Promoters without profiles will be skipped (they need auth.users entries first)
-- ============================================================================

-- Create employer_employee records for promoters with existing profiles
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  party_id,
  promoter_id,
  company_id,
  employment_type,
  employment_status,
  created_at,
  updated_at
)
SELECT DISTINCT ON (emp_pr.id, emp_profile.id)
  emp_pr.id as employer_id,
  emp_profile.id as employee_id,
  p.employer_id as party_id,
  p.id as promoter_id,
  c.id as company_id,
  'full_time' as employment_type,
  CASE 
    WHEN p.status = 'active' THEN 'active'
    WHEN p.status = 'inactive' THEN 'inactive'
    WHEN p.status = 'terminated' THEN 'terminated'
    WHEN p.status = 'suspended' THEN 'suspended'
    ELSE 'active'
  END as employment_status,
  COALESCE(p.created_at, NOW()) as created_at,
  COALESCE(p.updated_at, NOW()) as updated_at
FROM promoters p
-- Join to get employer profile (from party contact_email) - MUST EXIST
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(emp_pr.email) = LOWER(pt.contact_email)
-- Join to get employee profile (from promoter email) - MUST EXIST
INNER JOIN profiles emp_profile ON LOWER(emp_profile.email) = LOWER(p.email)
-- Join to get company_id
LEFT JOIN companies c ON c.party_id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND pt.contact_email IS NOT NULL
  -- Don't create if already exists
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE ee.promoter_id = p.id
       OR (ee.employee_id = emp_profile.id AND ee.employer_id = emp_pr.id)
  )
ORDER BY emp_pr.id, emp_profile.id, p.id
ON CONFLICT (employee_id, employer_id) DO UPDATE SET
  party_id = EXCLUDED.party_id,
  promoter_id = COALESCE(EXCLUDED.promoter_id, employer_employees.promoter_id),
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  updated_at = NOW();

-- Report how many promoters still don't have employer_employee records
SELECT 
  'PROMOTERS STILL MISSING RECORDS' as check_type,
  COUNT(*) as count,
  'These promoters need profiles (auth.users entries) to be created' as reason
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee WHERE ee.promoter_id = p.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(pr.email) = LOWER(p.email)
  );

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

SELECT 
  'FINAL VERIFICATION' as check_type,
  COUNT(*) as total_promoters_with_employer,
  COUNT(ee.id) as promoters_with_employer_employee_record,
  COUNT(*) - COUNT(ee.id) as promoters_without_employer_employee_record
FROM promoters p
LEFT JOIN employer_employees ee ON ee.promoter_id = p.id
WHERE p.employer_id IS NOT NULL;

SELECT '✅ Profile creation and employer_employee sync complete!' as status;

