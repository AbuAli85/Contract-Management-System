-- ============================================================================
-- DIAGNOSE SPECIFIC EMPLOYER_EMPLOYEE RECORD
-- ============================================================================
-- This script diagnoses a specific employer_employee record to understand
-- why party_id might be missing and how to fix it
-- ============================================================================

-- Replace this ID with the record you want to diagnose
-- Example: 'b3a4fc61-9d2f-4901-bf12-28798a1e2283'

-- Show the employer_employee record
SELECT 
  '=== EMPLOYER_EMPLOYEE RECORD ===' as section;

SELECT 
  ee.id,
  ee.employer_id,
  ee.employee_id,
  ee.promoter_id,
  ee.party_id,
  ee.company_id,
  emp_pr.email as employer_email,
  emp_pr.full_name as employer_name,
  emp_profile.email as employee_email,
  emp_profile.full_name as employee_name
FROM employer_employees ee
JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
WHERE ee.id = 'b3a4fc61-9d2f-4901-bf12-28798a1e2283';

-- Check if promoter exists and has employer_id
SELECT 
  '=== PROMOTER RECORD ===' as section;

SELECT 
  p.id,
  p.name_en,
  p.email,
  p.employer_id as promoter_employer_id,
  p.status,
  pt.id as party_id,
  pt.name_en as party_name,
  pt.type as party_type,
  CASE 
    WHEN p.employer_id IS NULL THEN '⚠️ Promoter missing employer_id'
    WHEN pt.id IS NULL THEN '⚠️ Party not found for employer_id'
    ELSE '✅ Promoter has valid employer_id'
  END as status
FROM promoters p
LEFT JOIN parties pt ON pt.id = p.employer_id
WHERE p.id = (
  SELECT promoter_id 
  FROM employer_employees 
  WHERE id = 'b3a4fc61-9d2f-4901-bf12-28798a1e2283'
);

-- Check if company exists for the party
SELECT 
  '=== COMPANY RECORD ===' as section;

SELECT 
  c.id,
  c.name,
  c.party_id,
  pt.id as party_id_from_parties,
  pt.name_en as party_name,
  CASE 
    WHEN c.party_id IS NULL THEN '⚠️ Company missing party_id'
    WHEN pt.id IS NULL THEN '⚠️ Party not found'
    ELSE '✅ Company linked to party'
  END as status
FROM companies c
LEFT JOIN parties pt ON pt.id = c.party_id OR pt.id = c.id
WHERE c.id = (
  SELECT company_id 
  FROM employer_employees 
  WHERE id = 'b3a4fc61-9d2f-4901-bf12-28798a1e2283'
);

-- Show what the fix would do
SELECT 
  '=== FIX PREVIEW ===' as section;

SELECT 
  ee.id,
  ee.party_id as current_party_id,
  p.employer_id as proposed_party_id,
  pt.name_en as proposed_party_name,
  CASE 
    WHEN p.employer_id IS NOT NULL THEN '✅ Can be fixed: Set party_id = ' || p.employer_id::text
    ELSE '❌ Cannot fix: Promoter missing employer_id'
  END as fix_status
FROM employer_employees ee
JOIN promoters p ON p.id = ee.promoter_id
LEFT JOIN parties pt ON pt.id = p.employer_id
WHERE ee.id = 'b3a4fc61-9d2f-4901-bf12-28798a1e2283';

-- Show all records with similar issues (missing party_id but have promoter_id)
SELECT 
  '=== ALL RECORDS WITH SAME ISSUE ===' as section;

SELECT 
  ee.id,
  ee.employer_id,
  ee.employee_id,
  ee.promoter_id,
  ee.party_id,
  p.employer_id as promoter_employer_id,
  pt.name_en as party_name,
  CASE 
    WHEN p.employer_id IS NOT NULL THEN '✅ Can fix: Set party_id = ' || p.employer_id::text
    ELSE '❌ Cannot fix: Promoter missing employer_id'
  END as fix_status
FROM employer_employees ee
JOIN promoters p ON p.id = ee.promoter_id
LEFT JOIN parties pt ON pt.id = p.employer_id
WHERE ee.party_id IS NULL
  AND ee.promoter_id IS NOT NULL
ORDER BY ee.created_at DESC;

