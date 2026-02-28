-- ============================================================================
-- Add users:manage:company permission for tenant admin user management
-- ============================================================================
-- Used by: /api/users/management GET, POST (tenant-scoped only)
-- Tenant admins manage user_roles (membership) only, never user_role_assignments
-- ============================================================================

INSERT INTO permissions (resource, action, scope, name, description)
VALUES
  ('users', 'manage', 'organization', 'users:manage:company', 'Manage users and roles within own company (tenant membership only)')
ON CONFLICT (name) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  scope = EXCLUDED.scope,
  description = EXCLUDED.description;

-- Attach to admin and manager roles (tenant roles in user_roles)
DO $$
DECLARE
  v_role_id uuid;
  v_perm_id uuid;
BEGIN
  FOR v_role_id IN SELECT id FROM roles WHERE name IN ('admin', 'manager')
  LOOP
    FOR v_perm_id IN
      SELECT id FROM permissions WHERE name = 'users:manage:company'
    LOOP
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'users:manage:company attached to admin/manager roles';
END $$;

-- ============================================================================
-- Post-migration runbook: after applying any permissions migration, run:
--   SELECT refresh_user_permissions_cache();   (or your cache refresh RPC)
-- so the RBAC evaluator and permission cache see the new permission.
-- ============================================================================
