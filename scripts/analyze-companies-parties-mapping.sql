-- ============================================================================
-- ANALYZE COMPANIES AND PARTIES MAPPING
-- ============================================================================
-- This script helps identify potential matches and gaps between
-- companies and parties tables
-- ============================================================================

-- 1. Companies that could be linked to parties by CRN
SELECT 
  'Potential CRN Matches' as analysis_type,
  c.id as company_id,
  c.name as company_name,
  c.cr_number as company_crn,
  p.id as party_id,
  p.name_en as party_name,
  p.crn as party_crn,
  p.type as party_type
FROM companies c
JOIN parties p ON (
  c.cr_number::text = TRIM(COALESCE(p.crn::text, ''))
  OR TRIM(c.cr_number::text) = TRIM(COALESCE(p.crn::text, ''))
)
WHERE c.cr_number IS NOT NULL
  AND p.crn IS NOT NULL
  AND p.type = 'Employer'
  AND (c.party_id IS NULL OR c.party_id != p.id)
ORDER BY c.name;

-- 2. Companies that could be linked to parties by name (fuzzy match)
SELECT 
  'Potential Name Matches' as analysis_type,
  c.id as company_id,
  c.name as company_name,
  p.id as party_id,
  p.name_en as party_name,
  p.type as party_type,
  SIMILARITY(LOWER(c.name), LOWER(p.name_en)) as similarity_score
FROM companies c
CROSS JOIN parties p
WHERE p.type = 'Employer'
  AND (c.party_id IS NULL OR c.party_id != p.id)
  AND SIMILARITY(LOWER(c.name), LOWER(p.name_en)) > 0.6
ORDER BY similarity_score DESC, c.name;

-- 3. Companies that could be linked by email
SELECT 
  'Potential Email Matches' as analysis_type,
  c.id as company_id,
  c.name as company_name,
  c.email as company_email,
  p.id as party_id,
  p.name_en as party_name,
  p.contact_email as party_email
FROM companies c
JOIN parties p ON LOWER(TRIM(c.email)) = LOWER(TRIM(p.contact_email))
WHERE c.email IS NOT NULL
  AND p.contact_email IS NOT NULL
  AND p.type = 'Employer'
  AND (c.party_id IS NULL OR c.party_id != p.id)
ORDER BY c.name;

-- 4. Companies already linked to parties
SELECT 
  'Already Linked' as analysis_type,
  c.id as company_id,
  c.name as company_name,
  c.party_id,
  p.name_en as party_name,
  p.type as party_type
FROM companies c
JOIN parties p ON p.id = c.party_id
WHERE c.party_id IS NOT NULL
ORDER BY c.name;

-- 5. Companies without party link
SELECT 
  'Unlinked Companies' as analysis_type,
  c.id,
  c.name,
  c.email,
  c.cr_number,
  c.owner_id,
  u.email as owner_email
FROM companies c
LEFT JOIN profiles u ON u.id = c.owner_id
WHERE c.party_id IS NULL
  AND c.is_active = true
ORDER BY c.name;

-- 6. Parties (Employers) without company
SELECT 
  'Parties without Company' as analysis_type,
  p.id,
  p.name_en,
  p.crn,
  p.contact_email,
  p.contact_person,
  p.overall_status
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  )
ORDER BY p.name_en;

-- 7. Summary statistics
SELECT 
  'Summary' as analysis_type,
  (SELECT COUNT(*) FROM companies WHERE is_active = true) as total_active_companies,
  (SELECT COUNT(*) FROM companies WHERE party_id IS NOT NULL) as linked_companies,
  (SELECT COUNT(*) FROM companies WHERE party_id IS NULL AND is_active = true) as unlinked_companies,
  (SELECT COUNT(*) FROM parties WHERE type = 'Employer' AND overall_status = 'active') as total_active_employer_parties,
  (SELECT COUNT(*) FROM parties p 
   WHERE p.type = 'Employer' 
   AND p.overall_status = 'active'
   AND EXISTS (SELECT 1 FROM companies c WHERE c.party_id = p.id)) as parties_with_companies,
  (SELECT COUNT(*) FROM parties p 
   WHERE p.type = 'Employer' 
   AND p.overall_status = 'active'
   AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.party_id = p.id)) as parties_without_companies;

