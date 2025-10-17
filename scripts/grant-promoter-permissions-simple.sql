-- ========================================
-- Grant Promoters Permissions (LEGACY TABLES ONLY)
-- ========================================
-- This script works with the existing legacy RBAC tables
-- Run this in your Supabase SQL editor

-- Step 1: Create default role with category
INSERT INTO roles (name, category, description, created_at, updated_at)
VALUES (
  'user',
  'client',  -- required: 'client', 'provider', or 'admin'
  'Default user role with basic permissions',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create required permissions with name field
INSERT INTO permissions (resource, action, scope, name, description, created_at)
VALUES 
  ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoters data', NOW()),
  ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoters', NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 3: Link permissions to the 'user' role
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user'
  AND p.resource = 'promoter'
  AND p.action IN ('read', 'manage')
  AND p.scope = 'own'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 4: Assign 'user' role to all users from profiles table
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, context, valid_from, is_active, created_at, updated_at)
SELECT 
  p.id as user_id,
  r.id as role_id,
  NULL as assigned_by,
  '{}'::jsonb as context,
  NOW() as valid_from,
  TRUE as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles p
CROSS JOIN roles r
WHERE r.name = 'user'
  AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura.user_id = p.id AND ura.role_id = r.id
  )
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check if permissions were granted successfully
SELECT 
  p.id as user_id,
  p.email,
  r.name as role_name,
  r.category,
  perm.resource,
  perm.action,
  perm.scope,
  perm.name as permission_string
FROM profiles p
JOIN user_role_assignments ura ON p.id = ura.user_id
JOIN roles r ON ura.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE perm.resource = 'promoter'
  AND ura.is_active = TRUE
ORDER BY p.email, perm.action;

-- If the above query returns rows with your email, you're good to go! ✅

