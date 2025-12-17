-- ============================================================================
-- DIAGNOSE PROMOTER LINKING ISSUES
-- ============================================================================
-- This script helps identify why promoters aren't getting linked
-- ============================================================================

-- ============================================================================
-- 1. CHECK PROMOTERS WITHOUT EMPLOYER_EMPLOYEE RECORDS
-- ============================================================================

SELECT 
  'PROMOTERS ANALYSIS' as check_type,
  COUNT(*) as total_promoters_with_employer,
  COUNT(CASE WHEN p.email IS NOT NULL THEN 1 END) as promoters_with_email,
  COUNT(CASE WHEN pt.contact_email IS NOT NULL THEN 1 END) as employers_with_contact_email,
  COUNT(CASE WHEN emp_pr.id IS NOT NULL THEN 1 END) as employers_with_profile,
  COUNT(CASE WHEN emp_profile.id IS NOT NULL THEN 1 END) as promoters_with_profile,
  COUNT(CASE WHEN ee.id IS NOT NULL THEN 1 END) as promoters_with_employer_employee_record
FROM promoters p
LEFT JOIN parties pt ON pt.id = p.employer_id
LEFT JOIN profiles emp_pr ON LOWER(emp_pr.email) = LOWER(pt.contact_email)
LEFT JOIN profiles emp_profile ON LOWER(emp_profile.email) = LOWER(p.email)
LEFT JOIN employer_employees ee ON ee.promoter_id = p.id
WHERE p.employer_id IS NOT NULL;

-- ============================================================================
-- 2. BREAKDOWN OF WHY PROMOTERS AREN'T LINKED
-- ============================================================================

-- Promoters missing email
SELECT 
  'MISSING EMAIL' as issue,
  COUNT(*) as count,
  'Promoters without email addresses' as reason
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND (p.email IS NULL OR p.email = '');

-- Promoters with email but no profile
SELECT 
  'NO PROFILE' as issue,
  COUNT(*) as count,
  'Promoters with email but no matching profile' as reason
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(pr.email) = LOWER(p.email)
  );

-- Employers missing contact_email
SELECT 
  'EMPLOYER NO CONTACT EMAIL' as issue,
  COUNT(DISTINCT p.employer_id) as count,
  'Employer parties without contact_email' as reason
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND (pt.contact_email IS NULL OR pt.contact_email = '');

-- Employers with contact_email but no profile
SELECT 
  'EMPLOYER NO PROFILE' as issue,
  COUNT(DISTINCT p.employer_id) as count,
  'Employer parties with contact_email but no matching profile' as reason
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND pt.contact_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(pr.email) = LOWER(pt.contact_email)
  );

-- ============================================================================
-- 3. SAMPLE PROMOTERS THAT CAN'T BE LINKED
-- ============================================================================

-- Sample promoters missing email
SELECT 
  'Sample: Promoters Missing Email' as check_type,
  p.id,
  p.name_en,
  p.email,
  p.employer_id,
  pt.name_en as employer_name
FROM promoters p
LEFT JOIN parties pt ON pt.id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND (p.email IS NULL OR p.email = '')
LIMIT 5;

-- Sample promoters with email but no profile
SELECT 
  'Sample: Promoters Without Profiles' as check_type,
  p.id,
  p.name_en,
  p.email,
  p.employer_id,
  pt.name_en as employer_name,
  pt.contact_email as employer_email
FROM promoters p
LEFT JOIN parties pt ON pt.id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(pr.email) = LOWER(p.email)
  )
LIMIT 10;

-- Sample employers without profiles
SELECT 
  'Sample: Employers Without Profiles' as check_type,
  pt.id as party_id,
  pt.name_en as employer_name,
  pt.contact_email,
  COUNT(p.id) as promoter_count
FROM parties pt
JOIN promoters p ON p.employer_id = pt.id
WHERE pt.type = 'Employer'
  AND pt.contact_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(pr.email) = LOWER(pt.contact_email)
  )
GROUP BY pt.id, pt.name_en, pt.contact_email
LIMIT 10;

-- ============================================================================
-- 4. EMAIL MATCHING ANALYSIS
-- ============================================================================

-- Check email format mismatches
SELECT 
  'EMAIL MISMATCH ANALYSIS' as check_type,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN LOWER(p.email) = LOWER(pr.email) THEN 1 END) as exact_matches,
  COUNT(CASE WHEN TRIM(LOWER(p.email)) = TRIM(LOWER(pr.email)) THEN 1 END) as trimmed_matches,
  COUNT(CASE WHEN p.email IS NOT NULL AND pr.email IS NULL THEN 1 END) as promoter_has_email_no_profile
FROM promoters p
LEFT JOIN profiles pr ON LOWER(pr.email) = LOWER(p.email)
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL;

-- ============================================================================
-- 5. SUMMARY REPORT
-- ============================================================================

SELECT 
  'SUMMARY' as report_section,
  'Total Promoters with employer_id' as metric,
  COUNT(*) as count
FROM promoters
WHERE employer_id IS NOT NULL

UNION ALL

SELECT 
  'SUMMARY',
  'Promoters with email',
  COUNT(*)
FROM promoters
WHERE employer_id IS NOT NULL
  AND email IS NOT NULL

UNION ALL

SELECT 
  'SUMMARY',
  'Promoters with matching profiles',
  COUNT(*)
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND p.email IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(pr.email) = LOWER(p.email)
  )

UNION ALL

SELECT 
  'SUMMARY',
  'Employer parties with contact_email',
  COUNT(DISTINCT pt.id)
FROM parties pt
JOIN promoters p ON p.employer_id = pt.id
WHERE pt.type = 'Employer'
  AND pt.contact_email IS NOT NULL

UNION ALL

SELECT 
  'SUMMARY',
  'Employer parties with matching profiles',
  COUNT(DISTINCT pt.id)
FROM parties pt
JOIN promoters p ON p.employer_id = pt.id
WHERE pt.type = 'Employer'
  AND pt.contact_email IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles pr WHERE LOWER(pr.email) = LOWER(pt.contact_email)
  )

UNION ALL

SELECT 
  'SUMMARY',
  'Promoters successfully linked',
  COUNT(*)
FROM promoters p
WHERE p.employer_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM employer_employees ee WHERE ee.promoter_id = p.id
  );

