-- ============================================================================
-- ANALYZE PROVIDED PARTIES AND PROMOTERS
-- ============================================================================
-- This script analyzes the provided parties and promoters lists to identify:
-- 1. Employer parties missing profiles (by checking contact_email against profiles.email)
-- 2. Employer parties missing companies
-- 3. Promoters under these employers missing employer_employee records
-- 4. Generate a comprehensive report of missing relationships
-- ============================================================================

-- ============================================================================
-- PART 1: SUMMARY STATISTICS
-- ============================================================================

SELECT 
  '=== SUMMARY STATISTICS ===' as section;

-- Total employer parties
SELECT 
  'Total Employer Parties' as metric,
  COUNT(*) as count
FROM parties
WHERE type = 'Employer'
  AND overall_status = 'active';

-- Employer parties with profiles
SELECT 
  'Employer Parties with Profiles' as metric,
  COUNT(DISTINCT pt.id) as count
FROM parties pt
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
  );

-- Employer parties without profiles
SELECT 
  'Employer Parties WITHOUT Profiles' as metric,
  COUNT(DISTINCT pt.id) as count
FROM parties pt
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND (pt.contact_email IS NULL 
    OR TRIM(pt.contact_email) = ''
    OR NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    )
  );

-- Employer parties with companies
SELECT 
  'Employer Parties with Companies' as metric,
  COUNT(DISTINCT pt.id) as count
FROM parties pt
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.party_id = pt.id OR c.id = pt.id
  );

-- Employer parties without companies
SELECT 
  'Employer Parties WITHOUT Companies' as metric,
  COUNT(DISTINCT pt.id) as count
FROM parties pt
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.party_id = pt.id OR c.id = pt.id
  );

-- Total active promoters
SELECT 
  'Total Active Promoters' as metric,
  COUNT(*) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active';

-- Promoters with profiles
SELECT 
  'Promoters with Profiles' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  );

-- Promoters without profiles
SELECT 
  'Promoters WITHOUT Profiles' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND (p.email IS NULL 
    OR TRIM(p.email) = ''
    OR NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
    )
  );

-- Promoters with employer_employee records
SELECT 
  'Promoters with employer_employee Records' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
JOIN employer_employees ee ON ee.employee_id = emp_profile.id
  AND ee.employer_id = emp_pr.id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != '';

-- Promoters without employer_employee records (but have both profiles)
SELECT 
  'Promoters WITHOUT employer_employee Records (but have profiles)' as metric,
  COUNT(DISTINCT p.id) as count
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

-- ============================================================================
-- PART 2: DETAILED BREAKDOWN BY EMPLOYER PARTY
-- ============================================================================

SELECT 
  '=== DETAILED BREAKDOWN BY EMPLOYER PARTY ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as employer_name,
  pt.name_ar as employer_name_ar,
  pt.crn,
  pt.contact_email as party_contact_email,
  pt.contact_phone,
  pt.overall_status as party_status,
  
  -- Profile status
  CASE 
    WHEN pt.contact_email IS NULL OR TRIM(pt.contact_email) = '' THEN 'No Contact Email'
    WHEN EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    ) THEN 'Has Profile'
    ELSE 'Missing Profile'
  END as employer_profile_status,
  
  -- Company status
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM companies c 
      WHERE c.party_id = pt.id OR c.id = pt.id
    ) THEN 'Has Company'
    ELSE 'Missing Company'
  END as company_status,
  
  -- Promoter statistics
  COUNT(DISTINCT p.id) as total_promoters,
  COUNT(DISTINCT CASE 
    WHEN p.email IS NOT NULL 
      AND TRIM(p.email) != ''
      AND EXISTS (
        SELECT 1 FROM profiles pr 
        WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
      )
    THEN p.id 
  END) as promoters_with_profiles,
  COUNT(DISTINCT CASE 
    WHEN p.email IS NOT NULL 
      AND TRIM(p.email) != ''
      AND pt.contact_email IS NOT NULL
      AND TRIM(pt.contact_email) != ''
      AND EXISTS (
        SELECT 1 FROM profiles emp_pr 
        WHERE LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
      )
      AND EXISTS (
        SELECT 1 FROM profiles emp_profile 
        WHERE LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
      )
      AND EXISTS (
        SELECT 1 FROM employer_employees ee
        JOIN profiles emp_pr2 ON emp_pr2.id = ee.employer_id
        JOIN profiles emp_profile2 ON emp_profile2.id = ee.employee_id
        WHERE LOWER(TRIM(emp_pr2.email)) = LOWER(TRIM(pt.contact_email))
          AND LOWER(TRIM(emp_profile2.email)) = LOWER(TRIM(p.email))
      )
    THEN p.id 
  END) as promoters_with_employer_employee_records,
  
  -- Missing relationships count
  COUNT(DISTINCT CASE 
    WHEN p.email IS NOT NULL 
      AND TRIM(p.email) != ''
      AND pt.contact_email IS NOT NULL
      AND TRIM(pt.contact_email) != ''
      AND EXISTS (
        SELECT 1 FROM profiles emp_pr 
        WHERE LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
      )
      AND EXISTS (
        SELECT 1 FROM profiles emp_profile 
        WHERE LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
      )
      AND NOT EXISTS (
        SELECT 1 FROM employer_employees ee
        JOIN profiles emp_pr2 ON emp_pr2.id = ee.employer_id
        JOIN profiles emp_profile2 ON emp_profile2.id = ee.employee_id
        WHERE LOWER(TRIM(emp_pr2.email)) = LOWER(TRIM(pt.contact_email))
          AND LOWER(TRIM(emp_profile2.email)) = LOWER(TRIM(p.email))
      )
    THEN p.id 
  END) as promoters_missing_employer_employee_records

FROM parties pt
LEFT JOIN promoters p ON p.employer_id = pt.id
  AND p.status = 'active'
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
GROUP BY pt.id, pt.name_en, pt.name_ar, pt.crn, pt.contact_email, pt.contact_phone, pt.overall_status
ORDER BY pt.name_en;

-- ============================================================================
-- PART 3: EMPLOYER PARTIES MISSING PROFILES
-- ============================================================================

SELECT 
  '=== EMPLOYER PARTIES MISSING PROFILES ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as employer_name,
  pt.crn,
  pt.contact_email,
  pt.contact_phone,
  CASE 
    WHEN pt.contact_email IS NULL OR TRIM(pt.contact_email) = '' THEN 'No Contact Email Provided'
    ELSE 'Contact Email Exists But No Matching Profile'
  END as issue_reason,
  COUNT(DISTINCT p.id) as affected_promoters
FROM parties pt
LEFT JOIN promoters p ON p.employer_id = pt.id
  AND p.status = 'active'
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND (pt.contact_email IS NULL 
    OR TRIM(pt.contact_email) = ''
    OR NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    )
  )
GROUP BY pt.id, pt.name_en, pt.crn, pt.contact_email, pt.contact_phone
ORDER BY pt.name_en;

-- ============================================================================
-- PART 4: EMPLOYER PARTIES MISSING COMPANIES
-- ============================================================================

SELECT 
  '=== EMPLOYER PARTIES MISSING COMPANIES ===' as section;

SELECT 
  pt.id as party_id,
  pt.name_en as employer_name,
  pt.crn,
  pt.contact_email,
  COUNT(DISTINCT p.id) as total_promoters
FROM parties pt
LEFT JOIN promoters p ON p.employer_id = pt.id
  AND p.status = 'active'
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.party_id = pt.id OR c.id = pt.id
  )
GROUP BY pt.id, pt.name_en, pt.crn, pt.contact_email
ORDER BY pt.name_en;

-- ============================================================================
-- PART 5: PROMOTERS MISSING EMPLOYER_EMPLOYEE RECORDS
-- ============================================================================

SELECT 
  '=== PROMOTERS MISSING employer_employee RECORDS ===' as section;

SELECT 
  pt.id as employer_party_id,
  pt.name_en as employer_name,
  pt.contact_email as employer_contact_email,
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.email as promoter_email,
  CASE 
    WHEN p.email IS NULL OR TRIM(p.email) = '' THEN 'No Email'
    WHEN NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
    ) THEN 'No Employee Profile'
    WHEN pt.contact_email IS NULL OR TRIM(pt.contact_email) = '' THEN 'No Employer Contact Email'
    WHEN NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    ) THEN 'No Employer Profile'
    ELSE 'Both Profiles Exist But Missing employer_employee Record'
  END as issue_reason
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND (
    -- Missing email
    p.email IS NULL 
    OR TRIM(p.email) = ''
    -- Missing employee profile
    OR NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
    )
    -- Missing employer profile
    OR pt.contact_email IS NULL 
    OR TRIM(pt.contact_email) = ''
    OR NOT EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
    )
    -- Missing employer_employee record (both profiles exist)
    OR (
      p.email IS NOT NULL 
      AND TRIM(p.email) != ''
      AND pt.contact_email IS NOT NULL
      AND TRIM(pt.contact_email) != ''
      AND EXISTS (
        SELECT 1 FROM profiles emp_pr 
        WHERE LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
      )
      AND EXISTS (
        SELECT 1 FROM profiles emp_profile 
        WHERE LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
      )
      AND NOT EXISTS (
        SELECT 1 FROM employer_employees ee
        JOIN profiles emp_pr2 ON emp_pr2.id = ee.employer_id
        JOIN profiles emp_profile2 ON emp_profile2.id = ee.employee_id
        WHERE LOWER(TRIM(emp_pr2.email)) = LOWER(TRIM(pt.contact_email))
          AND LOWER(TRIM(emp_profile2.email)) = LOWER(TRIM(p.email))
      )
    )
  )
ORDER BY pt.name_en, p.name_en
LIMIT 100;  -- Limit to first 100 for readability

-- ============================================================================
-- PART 6: DUPLICATE EMAIL ANALYSIS
-- ============================================================================

SELECT 
  '=== DUPLICATE EMAIL ANALYSIS ===' as section;

-- Promoters with duplicate emails
SELECT 
  LOWER(TRIM(p.email)) as email,
  COUNT(DISTINCT p.id) as promoter_count,
  STRING_AGG(DISTINCT p.id::text, ', ') as promoter_ids,
  STRING_AGG(DISTINCT p.name_en, ' | ') as promoter_names
FROM promoters p
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND p.status = 'active'
GROUP BY LOWER(TRIM(p.email))
HAVING COUNT(DISTINCT p.id) > 1
ORDER BY COUNT(DISTINCT p.id) DESC;

-- ============================================================================
-- PART 7: ACTION ITEMS SUMMARY
-- ============================================================================

SELECT 
  '=== ACTION ITEMS SUMMARY ===' as section;

-- Count of action items needed
SELECT 
  'Action Items' as category,
  'Register Employer Profiles' as action,
  COUNT(DISTINCT pt.id) as count
FROM parties pt
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(pt.contact_email))
  )

UNION ALL

SELECT 
  'Action Items' as category,
  'Create Companies for Employer Parties' as action,
  COUNT(DISTINCT pt.id) as count
FROM parties pt
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.party_id = pt.id OR c.id = pt.id
  )

UNION ALL

SELECT 
  'Action Items' as category,
  'Register Promoter Profiles' as action,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )

UNION ALL

SELECT 
  'Action Items' as category,
  'Create employer_employee Records' as action,
  COUNT(DISTINCT p.id) as count
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

