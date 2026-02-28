-- ============================================================================
-- Add permissions for Wave 1 RBAC migration (users + companies routes)
-- ============================================================================
-- Permissions: users:read:company, users:create:company, companies:create:own
-- Used by: /api/users GET, /api/users POST, /api/companies POST
-- ============================================================================

INSERT INTO permissions (resource, action, scope, name, description)
VALUES
  ('users', 'read', 'organization', 'users:read:company', 'Read users in company'),
  ('users', 'create', 'organization', 'users:create:company', 'Create users in company'),
  ('companies', 'create', 'own', 'companies:create:own', 'Create own company (registration)')
ON CONFLICT (name) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  scope = EXCLUDED.scope,
  description = EXCLUDED.description;

-- Attach to admin and manager roles (adjust role names if your schema differs)
DO $$
DECLARE
  v_role_id uuid;
  v_perm_id uuid;
BEGIN
  FOR v_role_id IN SELECT id FROM roles WHERE name IN ('admin', 'manager')
  LOOP
    FOR v_perm_id IN
      SELECT id FROM permissions
      WHERE name IN ('users:read:company', 'users:create:company', 'companies:create:own')
    LOOP
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Users and companies permissions attached to admin/manager roles';
END $$;
