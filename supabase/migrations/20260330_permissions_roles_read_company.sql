-- ============================================================================
-- 1) Tenant-scoped: permissions:read:company, roles:read:company
-- 2) Platform: roles:read:all, roles:manage:all (for /api/admin/roles)
-- ============================================================================

INSERT INTO permissions (resource, action, scope, name, description)
VALUES
  ('permissions', 'read', 'organization', 'permissions:read:company', 'Read permissions list in company context'),
  ('roles', 'read', 'organization', 'roles:read:company', 'Read tenant membership roles in company'),
  ('roles', 'read', 'all', 'roles:read:all', 'Read all platform roles (admin)'),
  ('roles', 'manage', 'all', 'roles:manage:all', 'Create/update platform roles (admin)')
ON CONFLICT (name) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  scope = EXCLUDED.scope,
  description = EXCLUDED.description;

-- Attach platform permissions to same roles that have users:manage:all
INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p.id
FROM role_permissions rp
JOIN permissions p_legacy ON p_legacy.id = rp.permission_id AND p_legacy.name = 'users:manage:all'
CROSS JOIN permissions p
WHERE p.name IN ('roles:read:all', 'roles:manage:all')
ON CONFLICT (role_id, permission_id) DO NOTHING;

DO $$
DECLARE
  v_role_id uuid;
  v_perm_id uuid;
BEGIN
  FOR v_role_id IN SELECT id FROM roles WHERE name IN ('admin', 'manager')
  LOOP
    FOR v_perm_id IN SELECT id FROM permissions WHERE name IN ('permissions:read:company', 'roles:read:company')
    LOOP
      INSERT INTO role_permissions (role_id, permission_id) VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'permissions:read:company and roles:read:company attached to admin/manager';
END $$;
