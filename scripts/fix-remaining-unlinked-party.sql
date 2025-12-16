-- ============================================================================
-- FIX REMAINING UNLINKED PARTY
-- ============================================================================
-- This script identifies and fixes the one remaining party without a company
-- ============================================================================

-- Step 1: Identify the unlinked party
SELECT 
  'Unlinked Party' as step,
  p.id as party_id,
  p.name_en as party_name,
  p.contact_email,
  p.crn,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))) 
    THEN 'User exists - can create company'
    ELSE 'No user - need to create user first or assign different owner'
  END as status
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  );

-- Step 2: Create the company (ready to run - user exists for luxsess2001@gmail.com)
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
  p.id,
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
  p.id,
  u.id,  -- User ID from profiles
  p.created_at,
  p.updated_at
FROM parties p
JOIN profiles u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.party_id = p.id)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create company_members entry
INSERT INTO company_members (
  company_id,
  user_id,
  role,
  is_primary,
  status,
  created_at
)
SELECT 
  c.id,
  u.id,
  CASE 
    WHEN p.role IN ('ceo', 'chairman', 'owner') THEN 'owner'
    WHEN p.role IN ('admin', 'manager') THEN 'admin'
    ELSE 'member'
  END,
  false,
  'active',
  NOW()
FROM companies c
JOIN parties p ON p.id = c.party_id
JOIN profiles u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))
WHERE c.party_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.company_id = c.id AND cm.user_id = u.id
  );

-- Step 4: Alternative - If no user exists, find closest match or suggest creating one
SELECT 
  'Suggested Action' as step,
  p.id as party_id,
  p.name_en as party_name,
  p.contact_email as party_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))) 
    THEN 'Run Step 2 above (uncommented)'
    ELSE 'Create user account with email: ' || p.contact_email || ' OR assign existing user as owner'
  END as action
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  );

