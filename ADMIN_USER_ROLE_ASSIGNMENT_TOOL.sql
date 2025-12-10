-- ================================================================
-- ADMIN USER ROLE ASSIGNMENT TOOL
-- Promoter Intelligence Hub - Role Management SQL Scripts
-- ================================================================

-- ================================================================
-- SECTION 1: VIEW CURRENT USER ROLES
-- ================================================================

-- View all users and their roles
SELECT 
  id,
  email,
  role as profile_role,
  user_metadata->>'role' as metadata_role,
  user_metadata->>'employer_id' as employer_id,
  user_metadata->>'company_id' as company_id,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN role = 'admin' THEN '👑 Admin - Full Access'
    WHEN role = 'manager' OR user_metadata->>'role' = 'employer' THEN '🏢 Employer - Management Access'
    WHEN user_metadata->>'role' = 'promoter' OR user_metadata->>'role' = 'employee' THEN '👤 Employee - Self-Service'
    ELSE '❓ Unassigned - Limited Access'
  END as access_level
FROM profiles
ORDER BY created_at DESC;

-- ================================================================
-- SECTION 2: ASSIGN EMPLOYEE ROLE
-- ================================================================

-- Make a user an employee/promoter
-- Replace 'user@example.com' with actual email
UPDATE profiles 
SET 
  role = 'user',
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"promoter"'
  )
WHERE email = 'user@example.com';

-- Verify employee assignment
SELECT 
  email,
  role,
  user_metadata->>'role' as metadata_role,
  '✅ Employee - Can view own profile only' as status
FROM profiles 
WHERE email = 'user@example.com';

-- ================================================================
-- SECTION 3: ASSIGN EMPLOYER ROLE
-- ================================================================

-- Step 1: Get available employer/company IDs
-- Option A: Use existing companies
SELECT id, name, email as company_email 
FROM companies 
ORDER BY name;

-- Option B: Use existing promoters' employer_ids
SELECT DISTINCT employer_id, COUNT(*) as promoter_count
FROM promoters
WHERE employer_id IS NOT NULL
GROUP BY employer_id;

-- Step 2: Assign user as employer
-- Replace 'user@example.com' and 'EMPLOYER-UUID-HERE' with actual values
UPDATE profiles 
SET 
  role = 'manager',  -- 'manager' gives employer-level access
  user_metadata = jsonb_set(
    jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      '"employer"'
    ),
    '{employer_id}',
    '"EMPLOYER-UUID-HERE"'
  )
WHERE email = 'user@example.com';

-- Step 3: Also set company_id if available
UPDATE profiles 
SET user_metadata = jsonb_set(
  user_metadata,
  '{company_id}',
  '"COMPANY-UUID-HERE"'
)
WHERE email = 'user@example.com';

-- Verify employer assignment
SELECT 
  email,
  role,
  user_metadata->>'role' as metadata_role,
  user_metadata->>'employer_id' as employer_id,
  user_metadata->>'company_id' as company_id,
  '✅ Employer - Can manage assigned promoters' as status
FROM profiles 
WHERE email = 'user@example.com';

-- ================================================================
-- SECTION 4: ASSIGN ADMIN ROLE
-- ================================================================

-- Make a user an admin
UPDATE profiles 
SET 
  role = 'admin',
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
WHERE email = 'user@example.com';

-- Verify admin assignment
SELECT 
  email,
  role,
  user_metadata->>'role' as metadata_role,
  '✅ Admin - Full system access' as status
FROM profiles 
WHERE email = 'user@example.com';

-- ================================================================
-- SECTION 5: BULK ROLE ASSIGNMENTS
-- ================================================================

-- Assign multiple users as employees
UPDATE profiles 
SET 
  role = 'user',
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"promoter"'
  )
WHERE email IN (
  'employee1@example.com',
  'employee2@example.com',
  'employee3@example.com'
);

-- Assign multiple users to same employer
UPDATE profiles 
SET 
  role = 'manager',
  user_metadata = jsonb_set(
    jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      '"employer"'
    ),
    '{employer_id}',
    '"SHARED-EMPLOYER-UUID"'
  )
WHERE email IN (
  'employer1@example.com',
  'employer2@example.com',
  'employer3@example.com'
);

-- ================================================================
-- SECTION 6: ASSIGN PROMOTERS TO EMPLOYERS
-- ================================================================

-- View unassigned promoters
SELECT 
  id,
  display_name,
  contact_email,
  employer_id,
  'Unassigned' as status
FROM promoters
WHERE employer_id IS NULL
ORDER BY created_at DESC;

-- Assign promoters to an employer
-- Replace 'EMPLOYER-UUID-HERE' with actual employer UUID
UPDATE promoters 
SET employer_id = 'EMPLOYER-UUID-HERE'
WHERE id IN (
  'promoter-uuid-1',
  'promoter-uuid-2',
  'promoter-uuid-3'
);

-- Verify promoter assignments
SELECT 
  p.id,
  p.display_name,
  p.employer_id,
  pr.email as employer_email,
  '✅ Assigned' as status
FROM promoters p
LEFT JOIN profiles pr ON pr.id::text = p.employer_id
WHERE p.employer_id = 'EMPLOYER-UUID-HERE';

-- ================================================================
-- SECTION 7: SYSTEM HEALTH CHECKS
-- ================================================================

-- Count users by role
SELECT 
  COALESCE(user_metadata->>'role', role, 'unassigned') as user_role,
  COUNT(*) as user_count,
  CASE 
    WHEN COALESCE(user_metadata->>'role', role, 'unassigned') = 'admin' THEN '👑'
    WHEN COALESCE(user_metadata->>'role', role, 'unassigned') = 'employer' THEN '🏢'
    WHEN COALESCE(user_metadata->>'role', role, 'unassigned') = 'promoter' THEN '👤'
    ELSE '❓'
  END as icon
FROM profiles
GROUP BY COALESCE(user_metadata->>'role', role, 'unassigned')
ORDER BY user_count DESC;

-- Count promoters by assignment status
SELECT 
  CASE 
    WHEN employer_id IS NOT NULL THEN 'Assigned to Employer'
    ELSE 'Unassigned'
  END as assignment_status,
  COUNT(*) as promoter_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM promoters), 2) as percentage
FROM promoters
GROUP BY assignment_status;

-- View employer and their promoter counts
SELECT 
  pr.email as employer_email,
  pr.user_metadata->>'employer_id' as employer_id,
  COUNT(p.id) as assigned_promoters
FROM profiles pr
LEFT JOIN promoters p ON p.employer_id = pr.user_metadata->>'employer_id'
WHERE pr.user_metadata->>'role' = 'employer' 
   OR pr.role = 'manager'
   OR pr.role = 'admin'
GROUP BY pr.email, pr.user_metadata->>'employer_id'
ORDER BY assigned_promoters DESC;

-- ================================================================
-- SECTION 8: FIND USERS NEEDING ROLE ASSIGNMENT
-- ================================================================

-- Find users without clear role
SELECT 
  id,
  email,
  role,
  user_metadata,
  created_at,
  '⚠️ Needs role assignment' as status
FROM profiles
WHERE 
  (user_metadata->>'role' IS NULL OR user_metadata->>'role' = '')
  AND (role IS NULL OR role = 'user')
ORDER BY created_at DESC;

-- ================================================================
-- SECTION 9: PERMISSION AUDIT
-- ================================================================

-- Complete permission audit
SELECT 
  p.email,
  p.role as profile_role,
  p.user_metadata->>'role' as metadata_role,
  p.user_metadata->>'employer_id' as employer_id,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Full Access - Can view all, create, edit, delete'
    WHEN p.role = 'manager' OR p.user_metadata->>'role' = 'employer' THEN '✅ Employer Access - Can view assigned, create, edit, export'
    WHEN p.user_metadata->>'role' = 'promoter' OR p.user_metadata->>'role' = 'employee' THEN '✅ Employee Access - Can view own profile only'
    ELSE '⚠️ Limited Access - Needs role assignment'
  END as effective_permission,
  p.created_at,
  p.last_sign_in_at
FROM profiles p
ORDER BY p.email;

-- ================================================================
-- SECTION 10: TRANSFER OPERATIONS
-- ================================================================

-- Transfer promoters from one employer to another
-- Replace OLD and NEW employer UUIDs
UPDATE promoters 
SET employer_id = 'NEW-EMPLOYER-UUID'
WHERE employer_id = 'OLD-EMPLOYER-UUID';

-- Verify transfer
SELECT 
  employer_id,
  COUNT(*) as promoter_count
FROM promoters
WHERE employer_id IN ('OLD-EMPLOYER-UUID', 'NEW-EMPLOYER-UUID')
GROUP BY employer_id;

-- ================================================================
-- SECTION 11: REVOKE PERMISSIONS
-- ================================================================

-- Demote employer to employee
UPDATE profiles 
SET 
  role = 'user',
  user_metadata = jsonb_set(
    jsonb_set(
      user_metadata,
      '{role}',
      '"promoter"'
    ),
    '{employer_id}',
    'null'
  )
WHERE email = 'user@example.com';

-- Revoke admin access (make manager)
UPDATE profiles 
SET role = 'manager'
WHERE email = 'user@example.com';

-- Revoke admin access (make employee)
UPDATE profiles 
SET 
  role = 'user',
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"promoter"'
  )
WHERE email = 'user@example.com';

-- ================================================================
-- SECTION 12: QUICK REFERENCE QUERIES
-- ================================================================

-- Quick system overview
SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM profiles
UNION ALL
SELECT 
  'Admins' as metric,
  COUNT(*)::text as value
FROM profiles 
WHERE role = 'admin'
UNION ALL
SELECT 
  'Employers' as metric,
  COUNT(*)::text as value
FROM profiles 
WHERE user_metadata->>'role' = 'employer' 
   OR role = 'manager'
UNION ALL
SELECT 
  'Employees' as metric,
  COUNT(*)::text as value
FROM profiles 
WHERE user_metadata->>'role' = 'promoter' 
   OR user_metadata->>'role' = 'employee'
UNION ALL
SELECT 
  'Total Promoters' as metric,
  COUNT(*)::text as value
FROM promoters
UNION ALL
SELECT 
  'Assigned Promoters' as metric,
  COUNT(*)::text as value
FROM promoters 
WHERE employer_id IS NOT NULL
UNION ALL
SELECT 
  'Unassigned Promoters' as metric,
  COUNT(*)::text as value
FROM promoters 
WHERE employer_id IS NULL;

-- ================================================================
-- END OF ADMIN USER ROLE ASSIGNMENT TOOL
-- ================================================================
-- 
-- INSTRUCTIONS:
-- 1. Replace 'user@example.com' with actual email addresses
-- 2. Replace 'EMPLOYER-UUID-HERE' with actual UUIDs
-- 3. Replace 'promoter-uuid-1' with actual promoter IDs
-- 4. Run queries in Supabase SQL Editor or your database client
-- 5. Always verify changes with SELECT queries before and after
-- 
-- ================================================================

