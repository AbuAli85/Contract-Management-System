-- ============================================================================
-- LIST AVAILABLE COMPANIES
-- ============================================================================
-- Run this FIRST to see all available companies
-- Copy the company ID or name to use in the setup script
-- ============================================================================

SELECT 
  id,
  name,
  is_active,
  created_at,
  owner_id
FROM companies
ORDER BY name;

-- ============================================================================
-- LIST YOUR USER PROFILE (CURRENT USER)
-- ============================================================================
-- Shows your logged-in user ID and active company
-- ============================================================================

SELECT 
  id as user_id,
  email,
  full_name,
  active_company_id,
  role
FROM profiles
WHERE id = auth.uid();  -- Gets current logged-in user

-- ============================================================================
-- LIST COMPANIES FOR CURRENT USER
-- ============================================================================
-- Shows all companies you're a member of
-- ============================================================================

SELECT 
  c.id as company_id,
  c.name as company_name,
  cm.role,
  cm.is_primary,
  cm.status,
  CASE 
    WHEN c.id = (SELECT active_company_id FROM profiles WHERE id = auth.uid()) 
    THEN '✓ ACTIVE' 
    ELSE '' 
  END as is_active_company
FROM companies c
JOIN company_members cm ON cm.company_id = c.id
WHERE cm.user_id = auth.uid()  -- Current logged-in user
ORDER BY cm.is_primary DESC, c.name;

-- ============================================================================
-- ALTERNATIVE: LIST COMPANIES FOR SPECIFIC USER (if you need to check another user)
-- ============================================================================
-- Uncomment and replace 'user-id-here' with actual UUID if needed
-- ============================================================================

-- SELECT 
--   c.id as company_id,
--   c.name as company_name,
--   cm.role,
--   cm.is_primary,
--   cm.status
-- FROM companies c
-- JOIN company_members cm ON cm.company_id = c.id
-- WHERE cm.user_id = 'user-id-here'::UUID  -- Replace with actual UUID
-- ORDER BY cm.is_primary DESC, c.name;

