-- ============================================================================
-- 1) Canonical platform admin permissions (users:*)
--    Replace legacy user:read:all / role:assign:all in code with:
--    users:read:all, users:manage:all
-- 2) Ensure user_roles has UNIQUE(user_id, company_id) and index for tenant queries
-- ============================================================================

-- ---------- 1) Permissions ----------
INSERT INTO permissions (resource, action, scope, name, description)
VALUES
  ('users', 'read', 'all', 'users:read:all', 'Read all users (platform admin)'),
  ('users', 'manage', 'all', 'users:manage:all', 'Manage users and global role assignments (platform admin)')
ON CONFLICT (name) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  scope = EXCLUDED.scope,
  description = EXCLUDED.description;

-- Attach to every role that currently has role:assign:all (platform admin roles)
INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p.id
FROM role_permissions rp
JOIN permissions p_legacy ON p_legacy.id = rp.permission_id AND p_legacy.name = 'role:assign:all'
CROSS JOIN permissions p
WHERE p.name IN ('users:read:all', 'users:manage:all')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Fallback: attach to platform-only roles by name. Safety: only roles with category = 'system'
-- (or no category column) so we never grant users:*:all to tenant-facing roles.
DO $$
DECLARE
  v_perm_id uuid;
  v_role_id uuid;
  v_has_category boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'category'
  ) INTO v_has_category;

  SELECT id INTO v_perm_id FROM permissions WHERE name = 'users:read:all' LIMIT 1;
  IF v_perm_id IS NOT NULL THEN
    FOR v_role_id IN
      SELECT id FROM roles
      WHERE name IN ('Platform Administrator', 'System Administrator', 'super_admin')
        AND (NOT v_has_category OR category = 'system')
    LOOP
      INSERT INTO role_permissions (role_id, permission_id) VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
  END IF;

  SELECT id INTO v_perm_id FROM permissions WHERE name = 'users:manage:all' LIMIT 1;
  IF v_perm_id IS NOT NULL THEN
    FOR v_role_id IN
      SELECT id FROM roles
      WHERE name IN ('Platform Administrator', 'System Administrator', 'super_admin')
        AND (NOT v_has_category OR category = 'system')
    LOOP
      INSERT INTO role_permissions (role_id, permission_id) VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- ---------- 2) user_roles: add company_id if missing, then constraint and index ----------
-- Some environments have user_roles without company_id (legacy). Add it if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.user_roles
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added user_roles.company_id (was missing)';
  END IF;
END $$;

-- Ensure unique (user_id, company_id) for tenant membership upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_roles'::regclass
      AND conname = 'user_roles_user_company_unique'
      AND contype = 'u'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_company_unique UNIQUE (user_id, company_id);
  END IF;
END $$;

-- Index for tenant-scoped queries: list members by company and active status
CREATE INDEX IF NOT EXISTS idx_user_roles_company_active
  ON public.user_roles (company_id, is_active);

-- ============================================================================
-- Post-migration: run refresh_user_permissions_cache (or refresh_user_permissions)
-- so new permissions are visible to the RBAC evaluator.
-- ============================================================================
-- SELECT refresh_user_permissions_cache(); -- or your cache refresh RPC name
