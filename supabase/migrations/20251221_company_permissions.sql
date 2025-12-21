-- ========================================
-- Company Permissions System
-- ========================================
-- Allows assigning specific permissions to users for company actions
-- This enables fine-grained control beyond just role-based access

-- Create company_permissions table
CREATE TABLE IF NOT EXISTS company_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL CHECK (permission IN (
    'company:create',
    'company:edit',
    'company:delete',
    'company:view',
    'company:settings',
    'company:manage_members',
    'company:invite_users'
  )),
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT company_permissions_unique UNIQUE (user_id, company_id, permission)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_permissions_user ON company_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_company_permissions_company ON company_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_permissions_permission ON company_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_company_permissions_active ON company_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_company_permissions_user_company ON company_permissions(user_id, company_id);

-- Enable RLS
ALTER TABLE company_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own permissions
CREATE POLICY "Users can view their own company permissions"
  ON company_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Company owners/admins can view all permissions for their companies
CREATE POLICY "Company owners can view company permissions"
  ON company_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_permissions.company_id
      AND c.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_permissions.company_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.status = 'active'
    )
  );

-- Company owners/admins can manage permissions
CREATE POLICY "Company owners can manage permissions"
  ON company_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_permissions.company_id
      AND c.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_permissions.company_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.status = 'active'
    )
  );

-- Function to check if user has company permission
CREATE OR REPLACE FUNCTION has_company_permission(
  p_user_id UUID,
  p_company_id UUID,
  p_permission VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM company_permissions
    WHERE user_id = p_user_id
      AND company_id = p_company_id
      AND permission = p_permission
      AND granted = true
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user in a company
CREATE OR REPLACE FUNCTION get_user_company_permissions(
  p_user_id UUID,
  p_company_id UUID
) RETURNS TABLE(permission VARCHAR, granted BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT cp.permission, cp.granted
  FROM company_permissions cp
  WHERE cp.user_id = p_user_id
    AND cp.company_id = p_company_id
    AND cp.is_active = true
    AND (cp.expires_at IS NULL OR cp.expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_company_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_permissions_updated_at
  BEFORE UPDATE ON company_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_company_permissions_updated_at();

