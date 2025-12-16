-- ============================================================================
-- CREATE COMPANY FOR VISION ELECTRONICS LLC
-- ============================================================================
-- This script creates the company and membership for the remaining unlinked party
-- Party ID: 29de0cc7-f704-41a1-bd43-1da1e48d0d46
-- ============================================================================

-- Step 1: Create the company
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
WHERE p.id = '29de0cc7-f704-41a1-bd43-1da1e48d0d46'::uuid
  AND p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.party_id = p.id)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create company_members entry
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
WHERE c.party_id = '29de0cc7-f704-41a1-bd43-1da1e48d0d46'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.company_id = c.id AND cm.user_id = u.id
  );

-- Step 3: Verify the creation
SELECT 
  'Verification' as step,
  c.id as company_id,
  c.name as company_name,
  c.party_id,
  p.name_en as party_name,
  u.email as owner_email,
  cm.role as user_role,
  cm.status as membership_status
FROM companies c
JOIN parties p ON p.id = c.party_id
JOIN profiles u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.contact_email))
LEFT JOIN company_members cm ON cm.company_id = c.id AND cm.user_id = u.id
WHERE c.party_id = '29de0cc7-f704-41a1-bd43-1da1e48d0d46'::uuid;

