-- ============================================================================
-- PREPARE PROMOTERS FOR BULK REGISTRATION
-- ============================================================================
-- This script generates a CSV-ready list of promoters that need registration
-- You can use this data to bulk create auth.users entries via API
-- ============================================================================

-- Export promoters needing registration in CSV format
SELECT 
  p.id as promoter_id,
  p.name_en as full_name,
  p.email,
  p.phone,
  p.mobile_number,
  p.job_title,
  p.department,
  pt.name_en as employer_name,
  pt.id as employer_party_id,
  pt.contact_email as employer_email,
  p.status as promoter_status,
  p.created_at
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )
ORDER BY pt.name_en, p.name_en;

-- Summary by employer
SELECT 
  pt.name_en as employer_name,
  COUNT(DISTINCT p.id) as promoters_to_register,
  STRING_AGG(DISTINCT p.email, ', ' ORDER BY p.email) FILTER (
    WHERE p.email IS NOT NULL AND TRIM(p.email) != ''
  ) as emails_to_register
FROM parties pt
JOIN promoters p ON p.employer_id = pt.id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )
GROUP BY pt.id, pt.name_en
ORDER BY COUNT(DISTINCT p.id) DESC, pt.name_en;

-- JSON format for API bulk creation (sample structure)
SELECT 
  json_agg(
    json_build_object(
      'email', p.email,
      'full_name', COALESCE(p.name_en, p.name_ar, 'Employee'),
      'phone', COALESCE(p.phone, p.mobile_number),
      'role', 'promoter',
      'status', 'approved',
      'metadata', json_build_object(
        'promoter_id', p.id::text,
        'employer_party_id', pt.id::text,
        'employer_name', pt.name_en,
        'job_title', p.job_title,
        'department', p.department
      )
    )
  ) as promoters_json
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )
LIMIT 1;  -- Returns single JSON array with all promoters

