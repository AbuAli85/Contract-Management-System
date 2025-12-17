-- ============================================================================
-- SYNC FEATURE ALIGNMENT DATA
-- ============================================================================
-- This script syncs the data relationships after the migration
-- Run this AFTER the migration to populate missing relationships
-- 
-- IMPORTANT: Run scripts/fix-employer-employees-constraints.sql FIRST
-- if you get foreign key constraint errors
-- ============================================================================

-- ============================================================================
-- STEP 1: SYNC PROMOTERS → EMPLOYER_EMPLOYEES
-- ============================================================================

-- Update employer_employees with party_id from promoters
-- Use DISTINCT to avoid updating the same row multiple times
UPDATE employer_employees ee
SET party_id = subquery.party_id
FROM (
  SELECT DISTINCT ON (ee2.id)
    ee2.id as employer_employee_id,
    p.employer_id as party_id
  FROM employer_employees ee2
  JOIN promoters p ON p.id = ee2.promoter_id
  WHERE ee2.party_id IS NULL
    AND ee2.promoter_id IS NOT NULL
    AND p.employer_id IS NOT NULL
  ORDER BY ee2.id, p.employer_id
) subquery
WHERE ee.id = subquery.employer_employee_id
  AND ee.party_id IS NULL;

-- Update employer_employees with promoter_id from employee_id (match by email)
-- Use DISTINCT to avoid updating the same row multiple times
-- Only update if employee_id exists in profiles table
UPDATE employer_employees ee
SET promoter_id = subquery.promoter_id
FROM (
  SELECT DISTINCT ON (ee2.id)
    ee2.id as employer_employee_id,
    pr.id as promoter_id
  FROM employer_employees ee2
  JOIN profiles p ON p.id = ee2.employee_id
  JOIN promoters pr ON LOWER(pr.email) = LOWER(p.email)
  WHERE ee2.promoter_id IS NULL
    AND ee2.employee_id IS NOT NULL
    -- Verify employee_id exists in profiles
    AND EXISTS (SELECT 1 FROM profiles WHERE id = ee2.employee_id)
  ORDER BY ee2.id, pr.id
) subquery
WHERE ee.id = subquery.employer_employee_id
  AND ee.promoter_id IS NULL
  -- Double-check employee_id exists before updating
  AND EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id);

-- Update employer_employees with party_id from employer_id (via profiles → parties)
-- Use DISTINCT to avoid updating the same row multiple times
UPDATE employer_employees ee
SET party_id = subquery.party_id
FROM (
  SELECT DISTINCT ON (ee2.id)
    ee2.id as employer_employee_id,
    pt.id as party_id
  FROM employer_employees ee2
  JOIN profiles pr ON pr.id = ee2.employer_id
  JOIN parties pt ON LOWER(pt.contact_email) = LOWER(pr.email)
  WHERE ee2.party_id IS NULL
    AND ee2.employer_id IS NOT NULL
    AND pt.type = 'Employer'
  ORDER BY ee2.id, pt.id
) subquery
WHERE ee.id = subquery.employer_employee_id
  AND ee.party_id IS NULL;

-- Update employer_employees with company_id from party_id
-- Use DISTINCT to avoid updating the same row multiple times
UPDATE employer_employees ee
SET company_id = subquery.company_id
FROM (
  SELECT DISTINCT ON (ee2.id)
    ee2.id as employer_employee_id,
    c.id as company_id
  FROM employer_employees ee2
  JOIN companies c ON c.party_id = ee2.party_id
  WHERE ee2.company_id IS NULL
    AND ee2.party_id IS NOT NULL
  ORDER BY ee2.id, c.id
) subquery
WHERE ee.id = subquery.employer_employee_id
  AND ee.company_id IS NULL;

-- ============================================================================
-- STEP 2: CREATE MISSING EMPLOYER_EMPLOYEE RECORDS FOR PROMOTERS
-- ============================================================================

-- Create employer_employee records for promoters that don't have one
-- IMPORTANT: employee_id must reference profiles(id), not promoters(id)
-- Only create records where we can find valid profile IDs that exist in profiles table
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
  -- Ensure both profiles exist (already enforced by INNER JOIN, but double-check)
  AND emp_pr.id IS NOT NULL
  AND emp_profile.id IS NOT NULL
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

-- ============================================================================
-- STEP 3: SYNC PARTIES → COMPANIES (Ensure all employers have companies)
-- ============================================================================

-- Create companies for parties that don't have one
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
  COALESCE(c.id, gen_random_uuid()),
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
LEFT JOIN companies c ON c.party_id = p.id
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND c.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  party_id = EXCLUDED.party_id,
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- STEP 4: SYNC PROFILES → COMPANY_MEMBERS
-- ============================================================================

-- Create company_members for profiles that don't have one (from parties)
INSERT INTO company_members (company_id, user_id, role, is_primary, status, joined_at)
SELECT 
  c.id,
  pr.id,
  'owner',
  true,
  'active',
  NOW()
FROM profiles pr
JOIN parties pt ON LOWER(pt.contact_email) = LOWER(pr.email)
JOIN companies c ON c.party_id = pt.id
WHERE pt.type = 'Employer'
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.user_id = pr.id AND cm.company_id = c.id
  )
ON CONFLICT (company_id, user_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- Update profiles.active_company_id from company_members
UPDATE profiles pr
SET active_company_id = (
  SELECT cm.company_id 
  FROM company_members cm
  WHERE cm.user_id = pr.id
    AND cm.is_primary = true
    AND cm.status = 'active'
  LIMIT 1
)
WHERE pr.active_company_id IS NULL
  AND EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = pr.id
      AND cm.is_primary = true
      AND cm.status = 'active'
  );

-- ============================================================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================================================

-- Show sync results
SELECT 
  'SYNC RESULTS' as report_section,
  'Promoters with employer_id' as metric,
  COUNT(*) as count
FROM promoters
WHERE employer_id IS NOT NULL

UNION ALL

SELECT 
  'SYNC RESULTS',
  'Employer Employees with party_id',
  COUNT(*)
FROM employer_employees
WHERE party_id IS NOT NULL

UNION ALL

SELECT 
  'SYNC RESULTS',
  'Employer Employees with promoter_id',
  COUNT(*)
FROM employer_employees
WHERE promoter_id IS NOT NULL

UNION ALL

SELECT 
  'SYNC RESULTS',
  'Companies with party_id',
  COUNT(*)
FROM companies
WHERE party_id IS NOT NULL

UNION ALL

SELECT 
  'SYNC RESULTS',
  'Profiles with active_company_id',
  COUNT(*)
FROM profiles
WHERE active_company_id IS NOT NULL

UNION ALL

SELECT 
  'SYNC RESULTS',
  'Company Members (active)',
  COUNT(*)
FROM company_members
WHERE status = 'active';

-- Show any remaining issues
SELECT 
  'REMAINING ISSUES' as report_section,
  'Promoters without employer_employee record' as metric,
  COUNT(*) as count
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee WHERE ee.promoter_id = p.id
  )

UNION ALL

SELECT 
  'REMAINING ISSUES',
  'Employer Employees without party_id',
  COUNT(*)
FROM employer_employees
WHERE party_id IS NULL
  AND employer_id IS NOT NULL

UNION ALL

SELECT 
  'REMAINING ISSUES',
  'Employer Employees without promoter_id',
  COUNT(*)
FROM employer_employees
WHERE promoter_id IS NULL
  AND employee_id IS NOT NULL;

