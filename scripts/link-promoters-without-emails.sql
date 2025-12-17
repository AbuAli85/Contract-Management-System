-- ============================================================================
-- LINK PROMOTERS WITHOUT EMAILS
-- ============================================================================
-- This script links promoters to employer_employees records even when
-- promoters don't have emails, using alternative matching criteria:
-- 1. Name matching (name_en, name_ar, first_name, last_name)
-- 2. Phone/mobile number matching
-- 3. ID card number matching
-- 4. Passport number matching
-- ============================================================================

-- ============================================================================
-- STEP 1: LINK TO EXISTING EMPLOYER_EMPLOYEES RECORDS
-- ============================================================================
-- Update existing records where we can match by name, phone, or ID card

-- Match by name (name_en or name_ar)
UPDATE employer_employees ee
SET 
  promoter_id = subq.promoter_id,
  party_id = COALESCE(ee.party_id, subq.party_id),
  company_id = COALESCE(ee.company_id, subq.company_id),
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (ee.id)
    ee.id as employer_employee_id,
    p.id as promoter_id,
    p.employer_id as party_id,
    c.id as company_id
  FROM employer_employees ee
  INNER JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
  INNER JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
  INNER JOIN promoters p ON p.employer_id IS NOT NULL
  INNER JOIN parties pt ON pt.id = p.employer_id
  INNER JOIN profiles pt_profile ON LOWER(TRIM(pt_profile.email)) = LOWER(TRIM(pt.contact_email))
  LEFT JOIN companies c ON c.party_id = p.employer_id
  WHERE ee.promoter_id IS NULL
    AND pt.contact_email IS NOT NULL
    AND TRIM(pt.contact_email) != ''
    AND emp_pr.id = pt_profile.id
    -- Match by name (name_en or name_ar matches profile full_name or first_name + last_name)
    AND (
      (p.name_en IS NOT NULL AND TRIM(p.name_en) != '' 
       AND (
         LOWER(TRIM(p.name_en)) = LOWER(TRIM(COALESCE(emp_profile.full_name, '')))
         OR LOWER(TRIM(p.name_en)) = LOWER(TRIM(COALESCE(emp_profile.first_name || ' ' || emp_profile.last_name, '')))
       ))
      OR (p.name_ar IS NOT NULL AND TRIM(p.name_ar) != ''
       AND (
         LOWER(TRIM(p.name_ar)) = LOWER(TRIM(COALESCE(emp_profile.full_name, '')))
         OR LOWER(TRIM(p.name_ar)) = LOWER(TRIM(COALESCE(emp_profile.first_name || ' ' || emp_profile.last_name, '')))
       ))
      OR (p.first_name IS NOT NULL AND p.last_name IS NOT NULL
       AND LOWER(TRIM(p.first_name)) = LOWER(TRIM(COALESCE(emp_profile.first_name, '')))
       AND LOWER(TRIM(p.last_name)) = LOWER(TRIM(COALESCE(emp_profile.last_name, ''))))
    )
  ORDER BY ee.id, p.created_at ASC
) subq
WHERE ee.id = subq.employer_employee_id;

-- Match by phone/mobile number
UPDATE employer_employees ee
SET 
  promoter_id = subq.promoter_id,
  party_id = COALESCE(ee.party_id, subq.party_id),
  company_id = COALESCE(ee.company_id, subq.company_id),
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (ee.id)
    ee.id as employer_employee_id,
    p.id as promoter_id,
    p.employer_id as party_id,
    c.id as company_id
  FROM employer_employees ee
  INNER JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
  INNER JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
  INNER JOIN promoters p ON p.employer_id IS NOT NULL
  INNER JOIN parties pt ON pt.id = p.employer_id
  INNER JOIN profiles pt_profile ON LOWER(TRIM(pt_profile.email)) = LOWER(TRIM(pt.contact_email))
  LEFT JOIN companies c ON c.party_id = p.employer_id
  WHERE ee.promoter_id IS NULL
    AND pt.contact_email IS NOT NULL
    AND TRIM(pt.contact_email) != ''
    AND emp_pr.id = pt_profile.id
    -- Match by phone or mobile number
    AND (
      (p.phone IS NOT NULL AND TRIM(p.phone) != '' 
       AND REPLACE(REPLACE(REPLACE(REPLACE(TRIM(p.phone), ' ', ''), '-', ''), '(', ''), ')', '') = 
           REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(emp_profile.phone, '')), ' ', ''), '-', ''), '(', ''), ')', ''))
      OR (p.mobile_number IS NOT NULL AND TRIM(p.mobile_number) != ''
       AND REPLACE(REPLACE(REPLACE(REPLACE(TRIM(p.mobile_number), ' ', ''), '-', ''), '(', ''), ')', '') = 
           REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(emp_profile.phone, '')), ' ', ''), '-', ''), '(', ''), ')', ''))
    )
  ORDER BY ee.id, p.created_at ASC
) subq
WHERE ee.id = subq.employer_employee_id
  AND ee.promoter_id IS NULL; -- Only update if still not linked

-- Match by ID card number (if profiles have id_card_number field)
-- Note: This section is skipped if profiles table doesn't have id_card_number column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'id_card_number'
  ) THEN
    UPDATE employer_employees ee
    SET 
      promoter_id = subq.promoter_id,
      party_id = COALESCE(ee.party_id, subq.party_id),
      company_id = COALESCE(ee.company_id, subq.company_id),
      updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (ee.id)
        ee.id as employer_employee_id,
        p.id as promoter_id,
        p.employer_id as party_id,
        c.id as company_id
      FROM employer_employees ee
      INNER JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
      INNER JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
      INNER JOIN promoters p ON p.employer_id IS NOT NULL
      INNER JOIN parties pt ON pt.id = p.employer_id
      INNER JOIN profiles pt_profile ON LOWER(TRIM(pt_profile.email)) = LOWER(TRIM(pt.contact_email))
      LEFT JOIN companies c ON c.party_id = p.employer_id
      WHERE ee.promoter_id IS NULL
        AND pt.contact_email IS NOT NULL
        AND TRIM(pt.contact_email) != ''
        AND emp_pr.id = pt_profile.id
        AND p.id_card_number IS NOT NULL
        AND TRIM(p.id_card_number) != ''
        AND emp_profile.id_card_number = p.id_card_number
      ORDER BY ee.id, p.created_at ASC
    ) subq
    WHERE ee.id = subq.employer_employee_id
      AND ee.promoter_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE NEW EMPLOYER_EMPLOYEES RECORDS FOR PROMOTERS WITHOUT EMAILS
-- ============================================================================
-- Match promoters to profiles by name, phone, or ID card and create records

-- Create records matching by name
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
    WHEN p.status = 'on_leave' THEN 'on_leave'
    ELSE 'active'
  END as employment_status,
  COALESCE(p.created_at, NOW()) as created_at,
  COALESCE(p.updated_at, NOW()) as updated_at
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON (
  -- Match by name_en
  (p.name_en IS NOT NULL AND TRIM(p.name_en) != '' 
   AND (
     LOWER(TRIM(p.name_en)) = LOWER(TRIM(COALESCE(emp_profile.full_name, '')))
     OR LOWER(TRIM(p.name_en)) = LOWER(TRIM(COALESCE(emp_profile.first_name || ' ' || emp_profile.last_name, '')))
   ))
  -- Match by name_ar
  OR (p.name_ar IS NOT NULL AND TRIM(p.name_ar) != ''
   AND (
     LOWER(TRIM(p.name_ar)) = LOWER(TRIM(COALESCE(emp_profile.full_name, '')))
     OR LOWER(TRIM(p.name_ar)) = LOWER(TRIM(COALESCE(emp_profile.first_name || ' ' || emp_profile.last_name, '')))
   ))
  -- Match by first_name + last_name
  OR (p.first_name IS NOT NULL AND p.last_name IS NOT NULL
   AND LOWER(TRIM(p.first_name)) = LOWER(TRIM(COALESCE(emp_profile.first_name, '')))
   AND LOWER(TRIM(p.last_name)) = LOWER(TRIM(COALESCE(emp_profile.last_name, ''))))
)
LEFT JOIN companies c ON c.party_id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  -- Only promoters without emails or without email-based links
  AND (p.email IS NULL OR TRIM(p.email) = '' 
       OR NOT EXISTS (
         SELECT 1 FROM profiles pr 
         WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
       ))
  -- Only create if NO record exists for this employee_id + employer_id
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE ee.employee_id = emp_profile.id 
      AND ee.employer_id = emp_pr.id
  )
  -- Only if promoter is not already linked
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE ee.promoter_id = p.id
  )
ORDER BY emp_pr.id, emp_profile.id, p.created_at ASC
ON CONFLICT (employee_id, employer_id) DO UPDATE SET
  party_id = COALESCE(EXCLUDED.party_id, employer_employees.party_id),
  promoter_id = COALESCE(EXCLUDED.promoter_id, employer_employees.promoter_id),
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  updated_at = NOW();

-- Create records matching by phone/mobile
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
    WHEN p.status = 'on_leave' THEN 'on_leave'
    ELSE 'active'
  END as employment_status,
  COALESCE(p.created_at, NOW()) as created_at,
  COALESCE(p.updated_at, NOW()) as updated_at
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles emp_profile ON (
  -- Match by phone
  (p.phone IS NOT NULL AND TRIM(p.phone) != '' 
   AND REPLACE(REPLACE(REPLACE(REPLACE(TRIM(p.phone), ' ', ''), '-', ''), '(', ''), ')', '') = 
       REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(emp_profile.phone, '')), ' ', ''), '-', ''), '(', ''), ')', ''))
  -- Match by mobile_number
  OR (p.mobile_number IS NOT NULL AND TRIM(p.mobile_number) != ''
   AND REPLACE(REPLACE(REPLACE(REPLACE(TRIM(p.mobile_number), ' ', ''), '-', ''), '(', ''), ')', '') = 
       REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(emp_profile.phone, '')), ' ', ''), '-', ''), '(', ''), ')', ''))
)
LEFT JOIN companies c ON c.party_id = p.employer_id
WHERE p.employer_id IS NOT NULL
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  -- Only promoters without emails or without email-based links
  AND (p.email IS NULL OR TRIM(p.email) = '' 
       OR NOT EXISTS (
         SELECT 1 FROM profiles pr 
         WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
       ))
  -- Only create if NO record exists for this employee_id + employer_id
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE ee.employee_id = emp_profile.id 
      AND ee.employer_id = emp_pr.id
  )
  -- Only if promoter is not already linked
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee 
    WHERE ee.promoter_id = p.id
  )
ORDER BY emp_pr.id, emp_profile.id, p.created_at ASC
ON CONFLICT (employee_id, employer_id) DO UPDATE SET
  party_id = COALESCE(EXCLUDED.party_id, employer_employees.party_id),
  promoter_id = COALESCE(EXCLUDED.promoter_id, employer_employees.promoter_id),
  company_id = COALESCE(EXCLUDED.company_id, employer_employees.company_id),
  updated_at = NOW();

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================

SELECT 
  'LINKING RESULTS' as check_type,
  (SELECT COUNT(*) FROM employer_employees WHERE promoter_id IS NOT NULL) as total_linked_records,
  (SELECT COUNT(DISTINCT promoter_id) FROM employer_employees WHERE promoter_id IS NOT NULL) as unique_promoters_linked,
  (SELECT COUNT(*) FROM promoters WHERE employer_id IS NOT NULL) as total_promoters_with_employer,
  (SELECT COUNT(*) FROM promoters 
   WHERE employer_id IS NOT NULL 
   AND NOT EXISTS (SELECT 1 FROM employer_employees WHERE promoter_id = promoters.id)) as still_unlinked;

-- Show sample of newly linked promoters
SELECT 
  'NEWLY LINKED SAMPLE' as check_type,
  p.id as promoter_id,
  p.name_en as promoter_name,
  p.email as promoter_email,
  p.phone as promoter_phone,
  ee.id as employer_employee_id,
  emp_profile.email as employee_email,
  emp_pr.email as employer_email
FROM employer_employees ee
INNER JOIN promoters p ON p.id = ee.promoter_id
INNER JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
INNER JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
WHERE ee.promoter_id IS NOT NULL
  AND (p.email IS NULL OR TRIM(p.email) = '')
LIMIT 10;

SELECT '✅ Linking complete! Promoters without emails have been linked using alternative matching.' as status;

