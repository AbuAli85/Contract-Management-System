-- ============================================================================
-- CREATE MISSING EMPLOYER_EMPLOYEE RECORDS FOR PROMOTERS WITH PROFILES
-- ============================================================================
-- This script creates employer_employee records for promoters that have
-- profiles but are missing the employer_employee link
-- ============================================================================

-- First, let's see what we're working with
DO $$
DECLARE
  v_promoters_with_profiles INTEGER;
  v_missing_records INTEGER;
BEGIN
  -- Count promoters with profiles
  SELECT COUNT(DISTINCT p.id) INTO v_promoters_with_profiles
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND p.email IS NOT NULL
    AND TRIM(p.email) != '';
  
  -- Count missing employer_employee records
  SELECT COUNT(DISTINCT p.id) INTO v_missing_records
  FROM promoters p
  JOIN parties pt ON pt.id = p.employer_id
  JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
  JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
  WHERE p.status = 'active'
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND p.email IS NOT NULL
    AND TRIM(p.email) != ''
    AND pt.contact_email IS NOT NULL
    AND TRIM(pt.contact_email) != ''
    AND NOT EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.employee_id = emp_profile.id
        AND ee.employer_id = emp_pr.id
    );
  
  RAISE NOTICE 'Promoters with profiles: %', v_promoters_with_profiles;
  RAISE NOTICE 'Missing employer_employee records: %', v_missing_records;
END $$;

-- Create employer_employee records for promoters with profiles
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
  NULL as work_location,
  COALESCE(p.created_at, NOW()) as created_at,
  COALESCE(p.updated_at, NOW()) as updated_at
FROM promoters p
-- Join to get employer party
INNER JOIN parties pt ON pt.id = p.employer_id
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
-- Join to get employer profile (from party contact_email) - MUST EXIST
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
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

-- Report results
DO $$
DECLARE
  v_created INTEGER;
BEGIN
  GET DIAGNOSTICS v_created = ROW_COUNT;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EMPLOYER_EMPLOYEE RECORDS CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Records created/updated: %', v_created;
  RAISE NOTICE '';
END $$;

