-- ============================================================================
-- FIX EMPLOYER-EMPLOYEE UNIFIED SYSTEM
-- ============================================================================
-- This migration ensures all promoters, employees, and team members are
-- properly linked in the employer_employees table for unified access to
-- attendance, tasks, targets, and other features.
-- ============================================================================
-- Date: 2025-01-20
-- Description: 
--   1. Ensures all active promoters from employer parties have employer_employee records
--   2. Fixes broken relationships (party_id, promoter_id, company_id)
--   3. Creates missing profiles for promoters if needed
--   4. Ensures proper employer_id (from party contact_email) and employee_id (from promoter email)
-- ============================================================================

-- ============================================================================
-- PART 1: ENSURE ALL PROMOTERS HAVE PROFILES
-- ============================================================================

-- Note: We cannot create profiles without auth.users entries
-- Profiles are automatically created when auth.users are created via triggers
-- So we only work with existing profiles that match by email
-- If a promoter doesn't have a profile, they need to be registered first via auth.users

DO $$
DECLARE
  v_promoters_without_profiles INTEGER;
  v_promoters_with_profiles INTEGER;
BEGIN
  -- Count promoters without profiles
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_without_profiles
  FROM promoters p
  WHERE p.email IS NOT NULL 
    AND TRIM(p.email) != ''
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
    );
  
  -- Count promoters with profiles
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_profiles
  FROM promoters p
  WHERE p.email IS NOT NULL 
    AND TRIM(p.email) != ''
    AND p.status = 'active'
    AND EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
    );
  
  RAISE NOTICE 'Promoters with profiles: %', v_promoters_with_profiles;
  RAISE NOTICE 'Promoters without profiles (need auth.users first): %', v_promoters_without_profiles;
  
  IF v_promoters_without_profiles > 0 THEN
    RAISE WARNING 'Some promoters do not have profiles. They need to be registered via auth.users first.';
  END IF;
END $$;

-- ============================================================================
-- PART 2: ENSURE ALL EMPLOYER PARTIES HAVE PROFILES
-- ============================================================================

-- Note: We cannot create profiles without auth.users entries
-- Profiles are automatically created when auth.users are created via triggers
-- So we only work with existing profiles that match by email

DO $$
DECLARE
  v_employers_without_profiles INTEGER;
  v_employers_with_profiles INTEGER;
BEGIN
  -- Count employer parties without profiles
  SELECT COUNT(DISTINCT pt.id) INTO v_employers_without_profiles
  FROM parties pt
  WHERE pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND pt.contact_email IS NOT NULL 
    AND TRIM(pt.contact_email) != ''
    AND NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    );
  
  -- Count employer parties with profiles
  SELECT COUNT(DISTINCT pt.id) INTO v_employers_with_profiles
  FROM parties pt
  WHERE pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND pt.contact_email IS NOT NULL 
    AND TRIM(pt.contact_email) != ''
    AND EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    );
  
  RAISE NOTICE 'Employer parties with profiles: %', v_employers_with_profiles;
  RAISE NOTICE 'Employer parties without profiles (need auth.users first): %', v_employers_without_profiles;
  
  IF v_employers_without_profiles > 0 THEN
    RAISE WARNING 'Some employer parties do not have profiles. They need to be registered via auth.users first.';
  END IF;
END $$;

-- ============================================================================
-- PART 3: ENSURE ALL COMPANIES EXIST FOR EMPLOYER PARTIES
-- ============================================================================

-- Create companies for employer parties that don't have one
INSERT INTO companies (
  id,
  name,
  slug,
  description,
  logo_url,
  email,
  phone,
  is_active,
  party_id,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  p.name_en,
  LOWER(REGEXP_REPLACE(COALESCE(p.name_en, 'company'), '[^a-zA-Z0-9]+', '-', 'g')),
  COALESCE(p.notes, ''),
  p.logo_url,
  p.contact_email,
  p.contact_phone,
  CASE WHEN p.overall_status = 'active' THEN true ELSE false END,
  p.id,
  COALESCE(p.created_at, NOW()),
  COALESCE(p.updated_at, NOW())
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  );

-- ============================================================================
-- PART 4: ENSURE UNIQUE CONSTRAINT EXISTS
-- ============================================================================

-- Ensure the unique constraint exists on employer_employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'employer_employees'
      AND constraint_name = 'employer_employees_unique_active'
      AND constraint_type = 'UNIQUE'
  ) THEN
    -- Create the constraint if it doesn't exist
    ALTER TABLE employer_employees
    ADD CONSTRAINT employer_employees_unique_active 
    UNIQUE (employee_id, employer_id);
    
    RAISE NOTICE 'Created unique constraint employer_employees_unique_active';
  ELSE
    RAISE NOTICE 'Unique constraint employer_employees_unique_active already exists';
  END IF;
END $$;

-- ============================================================================
-- PART 5: CREATE/FIX EMPLOYER_EMPLOYEE RECORDS FOR ALL ACTIVE PROMOTERS
-- ============================================================================

-- Create employer_employee records for all active promoters from employer parties
-- This ensures promoters, employees, and team members are all unified
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  party_id,
  promoter_id,
  company_id,
  employment_type,
  employment_status,
  job_title,
  department,
  work_location,
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
  p.job_title,
  p.department,
  NULL as work_location,  -- Promoters table doesn't have work_location column
  COALESCE(p.created_at, NOW()) as created_at,
  COALESCE(p.updated_at, NOW()) as updated_at
FROM promoters p
-- Join to get employer party
INNER JOIN parties pt ON pt.id = p.employer_id
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
-- Join to get employer profile (from party contact_email) - MUST EXIST
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
-- Join to get employee profile (from promoter email) - MUST EXIST
INNER JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
-- Join to get company_id
LEFT JOIN companies c ON c.party_id = p.employer_id
WHERE p.status = 'active'
  -- Only create if record doesn't already exist
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee
    WHERE ee.employee_id = emp_profile.id
      AND ee.employer_id = emp_pr.id
  )
ON CONFLICT ON CONSTRAINT employer_employees_unique_active
DO UPDATE SET
  party_id = EXCLUDED.party_id,
  promoter_id = EXCLUDED.promoter_id,
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  employment_status = EXCLUDED.employment_status,
  job_title = COALESCE(EXCLUDED.job_title, employer_employees.job_title),
  department = COALESCE(EXCLUDED.department, employer_employees.department),
  work_location = COALESCE(EXCLUDED.work_location, employer_employees.work_location, NULL),
  updated_at = NOW();

-- ============================================================================
-- PART 6: FIX EXISTING EMPLOYER_EMPLOYEE RECORDS
-- ============================================================================

-- Fix missing party_id in existing records
UPDATE employer_employees ee
SET party_id = (
  SELECT p.employer_id
  FROM promoters p
  WHERE p.id = ee.promoter_id
  LIMIT 1
)
WHERE ee.party_id IS NULL
  AND ee.promoter_id IS NOT NULL;

-- Fix missing promoter_id in existing records (match by employee email)
UPDATE employer_employees ee
SET promoter_id = (
  SELECT p.id
  FROM promoters p
  JOIN profiles pr ON pr.id = ee.employee_id
  WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(pr.email))
    AND p.employer_id = ee.party_id
  LIMIT 1
)
WHERE ee.promoter_id IS NULL
  AND ee.party_id IS NOT NULL
  AND ee.employee_id IS NOT NULL;

-- Fix missing company_id in existing records
UPDATE employer_employees ee
SET company_id = (
  SELECT c.id
  FROM companies c
  WHERE c.party_id = ee.party_id
  LIMIT 1
)
WHERE ee.company_id IS NULL
  AND ee.party_id IS NOT NULL;

-- Fix employer_id if it's pointing to wrong profile (should match party contact_email)
UPDATE employer_employees ee
SET employer_id = (
  SELECT pr.id
  FROM profiles pr
  JOIN parties pt ON pt.id = ee.party_id
  WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
  LIMIT 1
)
WHERE ee.employer_id IS NOT NULL
  AND ee.party_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM parties pt
    WHERE pt.id = ee.party_id
      AND pt.contact_email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM profiles pr
        WHERE pr.id = ee.employer_id
          AND LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
      )
  );

-- Fix employee_id if it's pointing to wrong profile (should match promoter email)
UPDATE employer_employees ee
SET employee_id = (
  SELECT pr.id
  FROM profiles pr
  JOIN promoters p ON p.id = ee.promoter_id
  WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  LIMIT 1
)
WHERE ee.employee_id IS NOT NULL
  AND ee.promoter_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM promoters p
    WHERE p.id = ee.promoter_id
      AND p.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM profiles pr
        WHERE pr.id = ee.employee_id
          AND LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
      )
  );

-- ============================================================================
-- PART 7: UPDATE SYNC FUNCTION TO HANDLE ALL CASES
-- ============================================================================

-- Update the sync function to be more robust
CREATE OR REPLACE FUNCTION sync_promoter_to_employer_employee(
  p_promoter_id UUID,
  p_party_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_employer_profile_id UUID;
  v_employee_profile_id UUID;
  v_company_id UUID;
  v_employer_employee_id UUID;
  v_promoter_email TEXT;
  v_party_email TEXT;
BEGIN
  -- Get promoter email
  SELECT email INTO v_promoter_email
  FROM promoters
  WHERE id = p_promoter_id;
  
  -- Get party contact_email
  SELECT contact_email INTO v_party_email
  FROM parties
  WHERE id = p_party_id
    AND type = 'Employer';
  
  -- Get employer profile from party contact_email
  SELECT pr.id INTO v_employer_profile_id
  FROM profiles pr
  WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(v_party_email))
  LIMIT 1;
  
  -- Get employee profile from promoter email
  IF v_promoter_email IS NOT NULL AND TRIM(v_promoter_email) != '' THEN
    SELECT pr.id INTO v_employee_profile_id
    FROM profiles pr
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(v_promoter_email))
    LIMIT 1;
  END IF;
  
  -- Get company_id from party
  SELECT c.id INTO v_company_id
  FROM companies c
  WHERE c.party_id = p_party_id
  LIMIT 1;
  
  -- Only create if both profiles exist
  IF v_employer_profile_id IS NULL THEN
    RAISE WARNING 'Cannot create employer_employees: employer profile not found for party % (contact_email: %)', p_party_id, v_party_email;
    RETURN NULL;
  END IF;
  
  IF v_employee_profile_id IS NULL THEN
    RAISE WARNING 'Cannot create employer_employees: employee profile not found for promoter % (email: %)', p_promoter_id, v_promoter_email;
    RETURN NULL;
  END IF;
  
  -- Create or update employer_employee record
  INSERT INTO employer_employees (
    employer_id,
    employee_id,
    party_id,
    promoter_id,
    company_id,
    employment_status,
    created_at,
    updated_at
  )
  VALUES (
    v_employer_profile_id,
    v_employee_profile_id,
    p_party_id,
    p_promoter_id,
    v_company_id,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT ON CONSTRAINT employer_employees_unique_active
  DO UPDATE SET
    party_id = EXCLUDED.party_id,
    promoter_id = EXCLUDED.promoter_id,
    company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
    updated_at = NOW()
  RETURNING id INTO v_employer_employee_id;
  
  RETURN v_employer_employee_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 8: VERIFICATION AND REPORTING
-- ============================================================================

-- Report on the fix
DO $$
DECLARE
  v_total_promoters INTEGER;
  v_promoters_with_employer_employee INTEGER;
  v_promoters_without_employer_employee INTEGER;
  v_total_employer_employees INTEGER;
  v_employer_employees_with_party_id INTEGER;
  v_employer_employees_with_promoter_id INTEGER;
BEGIN
  -- Count total active promoters from employer parties
  SELECT COUNT(*) INTO v_total_promoters
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active';
  
  -- Count promoters with employer_employee records
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_employer_employee
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
  JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
  JOIN employer_employees ee ON ee.employee_id = emp_profile.id
    AND ee.employer_id = emp_pr.id
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active';
  
  v_promoters_without_employer_employee := v_total_promoters - v_promoters_with_employer_employee;
  
  -- Count total employer_employees
  SELECT COUNT(*) INTO v_total_employer_employees
  FROM employer_employees;
  
  -- Count employer_employees with party_id
  SELECT COUNT(*) INTO v_employer_employees_with_party_id
  FROM employer_employees
  WHERE party_id IS NOT NULL;
  
  -- Count employer_employees with promoter_id
  SELECT COUNT(*) INTO v_employer_employees_with_promoter_id
  FROM employer_employees
  WHERE promoter_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EMPLOYER-EMPLOYEE UNIFIED SYSTEM FIX';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total active promoters (from employer parties): %', v_total_promoters;
  RAISE NOTICE 'Promoters with employer_employee records: %', v_promoters_with_employer_employee;
  RAISE NOTICE 'Promoters without employer_employee records: %', v_promoters_without_employer_employee;
  RAISE NOTICE '';
  RAISE NOTICE 'Total employer_employee records: %', v_total_employer_employees;
  RAISE NOTICE 'Records with party_id: %', v_employer_employees_with_party_id;
  RAISE NOTICE 'Records with promoter_id: %', v_employer_employees_with_promoter_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION sync_promoter_to_employer_employee IS 
'Unified function to sync promoters to employer_employee records. 
Ensures all promoters, employees, and team members are properly linked 
for unified access to attendance, tasks, targets, and other features.';

