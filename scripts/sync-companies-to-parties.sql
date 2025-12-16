-- ============================================================================
-- SYNC COMPANIES TO PARTIES
-- ============================================================================
-- This script links existing companies to parties and creates companies
-- from parties that don't have a corresponding company entry
-- ============================================================================

-- Step 1: Link existing companies to parties by CRN match
UPDATE companies c
SET party_id = p.id
FROM parties p
WHERE c.cr_number IS NOT NULL
  AND p.crn IS NOT NULL
  AND TRIM(c.cr_number::text) = TRIM(p.crn::text)
  AND p.type = 'Employer'
  AND c.party_id IS NULL;

-- Step 2: Link existing companies to parties by name match (fuzzy)
UPDATE companies c
SET party_id = p.id
FROM parties p
WHERE c.party_id IS NULL
  AND p.type = 'Employer'
  AND LOWER(TRIM(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9\s]', '', 'g'))) = 
      LOWER(TRIM(REGEXP_REPLACE(p.name_en, '[^a-zA-Z0-9\s]', '', 'g')));

-- Step 3: Link by email match
UPDATE companies c
SET party_id = p.id
FROM parties p
WHERE c.party_id IS NULL
  AND c.email IS NOT NULL
  AND p.contact_email IS NOT NULL
  AND LOWER(TRIM(c.email)) = LOWER(TRIM(p.contact_email))
  AND p.type = 'Employer';

-- Step 4: Create companies from parties that don't have a company yet
-- IMPORTANT: Only create companies where we can find an owner (to avoid trigger errors)
-- The trigger auto_create_company_owner_membership() requires a valid owner_id
-- Parties without matching user emails will be skipped (can be handled manually later)
INSERT INTO companies (
  id,
  name,
  slug,
  description,
  email,
  phone,
  cr_number,
  is_active,
  party_id,
  owner_id,
  created_at,
  updated_at
)
SELECT 
  p.id,  -- Use same ID to maintain relationship
  p.name_en,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(p.name_en, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g')),
  COALESCE(p.notes, ''),
  p.contact_email,
  p.contact_phone,
  CASE 
    WHEN p.crn IS NOT NULL AND TRIM(p.crn) ~ '^[0-9]+$' THEN TRIM(p.crn)::numeric
    ELSE NULL
  END,
  CASE WHEN p.overall_status = 'active' THEN true ELSE false END,
  p.id,  -- Self-reference
  -- Try to find owner by contact_email - only create if found
  owner_profile.id,
  p.created_at,
  p.updated_at
FROM parties p
LEFT JOIN profiles owner_profile ON LOWER(TRIM(owner_profile.email)) = LOWER(TRIM(p.contact_email))
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND owner_profile.id IS NOT NULL  -- Only create if owner found
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.id = p.id OR c.party_id = p.id
  )
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create company_members entries for all linked companies
-- Link users to companies based on party contact_email
-- This ensures memberships exist even if trigger didn't fire
INSERT INTO company_members (
  company_id,
  user_id,
  role,
  is_primary,
  status,
  created_at
)
SELECT DISTINCT
  c.id,
  u.id,
  CASE 
    WHEN p.role IN ('ceo', 'chairman', 'owner') THEN 'owner'
    WHEN p.role IN ('admin', 'manager') THEN 'admin'
    ELSE 'member'
  END,
  ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY p.created_at) = 1, -- First company is primary
  'active',
  NOW()
FROM companies c
JOIN parties p ON p.id = c.party_id
JOIN profiles u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))
WHERE c.party_id IS NOT NULL
  AND p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.company_id = c.id AND cm.user_id = u.id
  );

-- Step 6: Verification queries
-- Check linked companies
SELECT 
  'Linked Companies' as status,
  COUNT(*) as count
FROM companies c
WHERE c.party_id IS NOT NULL;

-- Check unlinked companies
SELECT 
  'Unlinked Companies' as status,
  COUNT(*) as count
FROM companies c
WHERE c.party_id IS NULL
  AND c.is_active = true;

-- Check companies created from parties
SELECT 
  'Companies from Parties' as status,
  COUNT(*) as count
FROM companies c
JOIN parties p ON p.id = c.party_id
WHERE p.type = 'Employer';

-- Check parties without companies
SELECT 
  'Parties without Companies' as status,
  COUNT(*) as count
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  );

