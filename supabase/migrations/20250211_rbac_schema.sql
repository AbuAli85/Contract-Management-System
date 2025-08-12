-- RBAC schema (additive, idempotent). Uses distinct rbac_* tables to avoid conflicts.
-- Safe to run multiple times.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE IF NOT EXISTS rbac_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('client','provider','admin')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS rbac_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('own','provider','organization','booking','public','all')),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Role-Permissions join
CREATE TABLE IF NOT EXISTS rbac_role_permissions (
  role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES rbac_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT rbac_role_permissions_unique UNIQUE (role_id, permission_id)
);

-- User role assignments
CREATE TABLE IF NOT EXISTS rbac_user_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  assigned_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}'::jsonb,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ NULL
);

-- Audit logs (separate from existing audit_logs to prevent behavior changes)
CREATE TABLE IF NOT EXISTS rbac_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  event_type TEXT NOT NULL, -- permission_usage | role_change
  permission TEXT,
  resource TEXT,
  action TEXT,
  result TEXT, -- ALLOW | DENY | WOULD_BLOCK
  ip_address INET,
  user_agent TEXT,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MV for fast permission lookup
CREATE MATERIALIZED VIEW IF NOT EXISTS rbac_user_permissions_mv AS
SELECT 
  ura.user_id,
  p.resource,
  p.action,
  p.scope,
  p.name AS permission_name,
  r.name AS role_name
FROM rbac_user_role_assignments ura
JOIN rbac_roles r ON ura.role_id = r.id
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE ura.is_active = TRUE
AND (ura.valid_until IS NULL OR ura.valid_until > CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_rbac_user_permissions_user_id ON rbac_user_permissions_mv(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_permissions_res_act ON rbac_user_permissions_mv(resource, action);
CREATE INDEX IF NOT EXISTS idx_rbac_user_role_assignments_user_active ON rbac_user_role_assignments(user_id, is_active);

-- Refresh function for MV
CREATE OR REPLACE FUNCTION rbac_refresh_user_permissions_mv()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY rbac_user_permissions_mv;
EXCEPTION WHEN undefined_table THEN
  -- First migration run where MV might not exist concurrently
  REFRESH MATERIALIZED VIEW rbac_user_permissions_mv;
END;
$$ LANGUAGE plpgsql;

-- Helper: upsert role
CREATE OR REPLACE FUNCTION rbac_upsert_role(p_name TEXT, p_category TEXT, p_description TEXT)
RETURNS UUID AS $$
DECLARE v_id UUID; BEGIN
  INSERT INTO rbac_roles(name, category, description)
  VALUES (p_name, p_category, p_description)
  ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, description = EXCLUDED.description
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$ LANGUAGE plpgsql;

-- Helper: upsert permission
CREATE OR REPLACE FUNCTION rbac_upsert_permission(p_resource TEXT, p_action TEXT, p_scope TEXT, p_name TEXT, p_description TEXT)
RETURNS UUID AS $$
DECLARE v_id UUID; BEGIN
  INSERT INTO rbac_permissions(resource, action, scope, name, description)
  VALUES (p_resource, p_action, p_scope, p_name, p_description)
  ON CONFLICT (name) DO UPDATE SET resource = EXCLUDED.resource, action = EXCLUDED.action, scope = EXCLUDED.scope, description = EXCLUDED.description
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$ LANGUAGE plpgsql;

-- Helper: attach role->permission if missing
CREATE OR REPLACE FUNCTION rbac_attach_permission(p_role_id UUID, p_perm_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO rbac_role_permissions(role_id, permission_id)
  VALUES (p_role_id, p_perm_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END; $$ LANGUAGE plpgsql;

-- RLS: enable and allow reads by service role only; app reads via MV
ALTER TABLE rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rbac_admin_all ON rbac_roles;
CREATE POLICY rbac_admin_all ON rbac_roles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS rbac_admin_all_p ON rbac_permissions;
CREATE POLICY rbac_admin_all_p ON rbac_permissions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS rbac_admin_all_rp ON rbac_role_permissions;
CREATE POLICY rbac_admin_all_rp ON rbac_role_permissions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS rbac_admin_all_ura ON rbac_user_role_assignments;
CREATE POLICY rbac_admin_all_ura ON rbac_user_role_assignments FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS rbac_admin_all_audit ON rbac_audit_logs;
CREATE POLICY rbac_admin_all_audit ON rbac_audit_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


