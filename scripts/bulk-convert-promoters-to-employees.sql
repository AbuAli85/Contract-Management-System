-- ============================================================================
-- BULK CONVERT PROMOTER-ONLY RECORDS TO ACTUAL EMPLOYEES
-- ============================================================================
-- This script converts all promoter-only records to actual employer_employees
-- by creating employer_employee records with correct profile IDs
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY PROMOTER-ONLY RECORDS THAT NEED CONVERSION
-- ============================================================================

-- Find promoters that:
-- 1. Have a matching profile (by email)
-- 2. Don't have an employer_employee record yet
-- 3. Have an employer (party_id)

SELECT 
  'PROMOTERS TO CONVERT' as check_type,
  p.id as promoter_id,
  p.name_en,
  p.email,
  p.employer_id as party_id,
  pr.id as profile_id,
  pr.email as profile_email,
  emp_pr.id as employer_profile_id,
  emp_pr.email as employer_email
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL  -- No existing employer_employee record
ORDER BY p.name_en;

-- ============================================================================
-- STEP 2: CREATE EMPLOYER_EMPLOYEE RECORDS FOR ALL LINKABLE PROMOTERS
-- ============================================================================

-- This will create employer_employee records for all promoters that:
-- 1. Have matching profiles
-- 2. Have matching employer profiles
-- 3. Don't already have employer_employee records

INSERT INTO employer_employees (
  employer_id,
  employee_id,
  company_id,
  employment_type,
  employment_status,
  employee_code,
  created_at,
  updated_at
)
SELECT DISTINCT ON (emp_pr.id, pr.id)
  emp_pr.id as employer_id,  -- Profile ID of employer
  pr.id as employee_id,      -- Profile ID of employee (NOT promoter ID!)
  c.id as company_id,
  'full_time' as employment_type,
  CASE 
    WHEN p.status = 'active' THEN 'active'
    WHEN p.status = 'inactive' THEN 'inactive'
    WHEN p.status = 'terminated' THEN 'terminated'
    WHEN p.status = 'suspended' THEN 'suspended'
    ELSE 'active'
  END as employment_status,
  -- Auto-generate employee code: EMP-YYYYMMDD-XXXX
  'EMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(pr.id::text, '-', ''), -4)) as employee_code,
  COALESCE(p.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN companies c ON c.party_id = p.employer_id
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL  -- Only create if doesn't exist
ON CONFLICT DO NOTHING;  -- Skip if already exists

-- ============================================================================
-- STEP 3: FIX EXISTING RECORDS WITH WRONG employee_id
-- ============================================================================

-- Update any existing employer_employees where employee_id is a promoter ID
-- instead of a profile ID

UPDATE employer_employees ee
SET 
  employee_id = pr.id,  -- Fix: use profile ID
  updated_at = NOW()
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE ee.employee_id = p.id  -- Current employee_id is a promoter ID
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)  -- Invalid ID
  AND pr.id IS NOT NULL;  -- Profile exists

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Count how many were created/fixed
SELECT 
  'VERIFICATION' as check_type,
  COUNT(*) as total_employer_employees,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id) THEN 1 END) as valid_records,
  COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id) THEN 1 END) as invalid_records
FROM employer_employees ee
WHERE ee.employee_id IS NOT NULL;

-- Show newly created records
SELECT 
  'NEWLY CREATED RECORDS' as check_type,
  ee.id,
  ee.employee_code,
  pr.full_name as employee_name,
  pr.email as employee_email,
  emp_pr.email as employer_email,
  ee.employment_status
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
INNER JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
WHERE ee.created_at >= NOW() - INTERVAL '1 hour'  -- Created in last hour
ORDER BY ee.created_at DESC;

