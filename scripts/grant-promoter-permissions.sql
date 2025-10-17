-- ========================================
-- Grant Promoters Permissions to Users
-- ========================================
-- This script grants the necessary permissions for users to access the promoters page
-- Supports both NEW RBAC tables (rbac_*) and LEGACY tables
-- Run this in your Supabase SQL editor

-- ========================================
-- OPTION 1: NEW RBAC TABLES (rbac_* prefix)
-- ========================================

-- Step 1: Create default role with category
INSERT INTO rbac_roles (name, category, description, created_at)
VALUES (
  'user',
  'client',  -- category is required: 'client', 'provider', 'admin'
  'Default user role with basic permissions',
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create required permissions with name field
INSERT INTO rbac_permissions (resource, action, scope, name, description, created_at)
VALUES 
  ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoters data', NOW()),
  ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoters', NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 3: Link permissions to the 'user' role
INSERT INTO rbac_role_permissions (role_id, permission_id, created_at)
SELECT 
  r.id,
  p.id,
  NOW()
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.name = 'user'
  AND p.resource = 'promoter'
  AND p.action IN ('read', 'manage')
  AND p.scope = 'own'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 4: Assign 'user' role to all users from profiles table
INSERT INTO rbac_user_role_assignments (user_id, role_id, assigned_by, context, valid_from, is_active, created_at, updated_at)
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
CROSS JOIN rbac_roles r
WHERE r.name = 'user'
  AND NOT EXISTS (
    SELECT 1 FROM rbac_user_role_assignments ura 
    WHERE ura.user_id = p.id AND ura.role_id = r.id
  )
ON CONFLICT DO NOTHING;

-- ========================================
-- OPTION 2: LEGACY TABLES (for fallback compatibility)
-- ========================================

-- Step 1: Create default role with category (LEGACY)
INSERT INTO roles (name, category, description, created_at, updated_at)
VALUES (
  'user',
  'client',  -- category is required
  'Default user role with basic permissions',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create required permissions (LEGACY)
INSERT INTO permissions (resource, action, scope, name, description, created_at)
VALUES 
  ('promoter', 'read', 'own', 'promoter:read:own', 'Read own promoters data', NOW()),
  ('promoter', 'manage', 'own', 'promoter:manage:own', 'Manage own promoters', NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 3: Link permissions to role (LEGACY)
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

-- Step 4: Assign roles to users (LEGACY)
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
-- VERIFICATION QUERIES
-- ========================================

-- Check NEW RBAC tables
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
JOIN rbac_user_role_assignments ura ON p.id = ura.user_id
JOIN rbac_roles r ON ura.role_id = r.id
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions perm ON rp.permission_id = perm.id
WHERE perm.resource = 'promoter'
  AND ura.is_active = TRUE
ORDER BY p.email, perm.action;

-- Check LEGACY tables
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

