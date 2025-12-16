-- ============================================================================
-- CREATE COMPANY FOR UNLINKED PARTY
-- ============================================================================
-- Use this script to manually create a company for a party that couldn't be
-- automatically linked (usually because no user account exists with that email)
-- ============================================================================

-- Option 1: Create company with a specific user as owner
-- Replace the party_id and owner_user_id below
/*
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
  'USER_ID_HERE'::uuid,  -- Replace with actual user ID
  p.created_at,
  p.updated_at
FROM parties p
WHERE p.id = 'PARTY_ID_HERE'::uuid  -- Replace with actual party ID
  AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.party_id = p.id)
ON CONFLICT (id) DO NOTHING;

-- Then create company_members entry
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
  'USER_ID_HERE'::uuid,  -- Same user ID as above
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
WHERE c.id = 'COMPANY_ID_HERE'::uuid  -- Use the company ID from above
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.company_id = c.id AND cm.user_id = 'USER_ID_HERE'::uuid
  );
*/

-- Option 2: Find the unlinked party and suggest which user to use
SELECT 
  p.id as party_id,
  p.name_en as party_name,
  p.contact_email as party_email,
  'Use this party_id in the script above' as instruction,
  -- Find closest matching user
  (SELECT id FROM profiles 
   WHERE email ILIKE '%' || SPLIT_PART(p.contact_email, '@', 1) || '%'
   LIMIT 1) as suggested_user_id,
  (SELECT email FROM profiles 
   WHERE email ILIKE '%' || SPLIT_PART(p.contact_email, '@', 1) || '%'
   LIMIT 1) as suggested_user_email
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.party_id = p.id
  );

