-- ============================================================================
-- GENERATE UNIQUE EMAILS FOR PROMOTERS WITH DUPLICATE EMAILS
-- ============================================================================
-- This script suggests unique email addresses for promoters that share emails
-- Format: firstname.lastname.promoterid@falconeyegroup.net
-- ============================================================================

-- Show suggested unique emails for promoters with duplicate emails
SELECT 
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.email as current_email,
  pt.name_en as employer_name,
  -- Generate unique email: firstname.lastname.promoterid@domain
  LOWER(
    REGEXP_REPLACE(
      COALESCE(p.first_name, SPLIT_PART(p.name_en, ' ', 1), 'promoter'),
      '[^a-zA-Z0-9]', '', 'g'
    ) || '.' ||
    REGEXP_REPLACE(
      COALESCE(p.last_name, SPLIT_PART(p.name_en, ' ', -1), 'user'),
      '[^a-zA-Z0-9]', '', 'g'
    ) || '.' ||
    SUBSTRING(p.id::text, 1, 8) || '@falconeyegroup.net'
  ) as suggested_unique_email,
  -- Alternative: use phone number if available
  CASE 
    WHEN p.phone IS NOT NULL AND TRIM(p.phone) != '' THEN
      LOWER(
        'promoter.' ||
        REGEXP_REPLACE(TRIM(p.phone), '[^0-9]', '', 'g') ||
        '@falconeyegroup.net'
      )
    ELSE NULL
  END as alternative_email
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
  AND EXISTS (
    SELECT 1 FROM promoters p2
    WHERE p2.id != p.id
      AND LOWER(TRIM(p2.email)) = LOWER(TRIM(p.email))
      AND p2.status = 'active'
  )
ORDER BY p.email, p.name_en;

-- Update promoters with unique emails (OPTIONAL - review first!)
-- Uncomment to actually update the emails
/*
UPDATE promoters p
SET email = LOWER(
  REGEXP_REPLACE(
    COALESCE(p.first_name, SPLIT_PART(p.name_en, ' ', 1), 'promoter'),
    '[^a-zA-Z0-9]', '', 'g'
  ) || '.' ||
  REGEXP_REPLACE(
    COALESCE(p.last_name, SPLIT_PART(p.name_en, ' ', -1), 'user'),
    '[^a-zA-Z0-9]', '', 'g'
  ) || '.' ||
  SUBSTRING(p.id::text, 1, 8) || '@falconeyegroup.net'
),
updated_at = NOW()
WHERE p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND EXISTS (
    SELECT 1 FROM promoters p2
    WHERE p2.id != p.id
      AND LOWER(TRIM(p2.email)) = LOWER(TRIM(p.email))
      AND p2.status = 'active'
  )
  AND EXISTS (
    SELECT 1 FROM parties pt
    WHERE pt.id = p.employer_id
      AND pt.type = 'Employer'
      AND pt.overall_status = 'active'
  );
*/

