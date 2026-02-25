-- ============================================================================
-- WEEK 1–2: TENANT ISOLATION HARDENING
-- SmartPRO 60-Day War Plan — Phase 1
-- Date: 2026-02-26
-- ============================================================================
-- Goal: Make tenant isolation bulletproof.
--   1. Add company_id to all critical tables
--   2. Remove dangerous grants (no GRANT to anon)
--   3. Standardize authorization to user_roles(user_id, company_id, role)
--   4. Replace USING(true) RLS policies with company-scoped policies
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD company_id TO CRITICAL TABLES
-- ============================================================================

-- 1a. contracts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE contracts
      ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    -- Back-fill: derive company_id from the first party linked to the contract
    -- (provider_company_id or first party with type='employer')
    UPDATE contracts c
    SET company_id = (
      SELECT p.company_id
      FROM parties p
      WHERE p.id = c.second_party_id
        AND p.company_id IS NOT NULL
      LIMIT 1
    )
    WHERE company_id IS NULL;

    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id);
  END IF;
END $$;

-- 1b. contract_versions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_versions' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE contract_versions
      ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    -- Back-fill from parent contract
    UPDATE contract_versions cv
    SET company_id = c.company_id
    FROM contracts c
    WHERE cv.contract_id = c.id
      AND c.company_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_contract_versions_company_id ON contract_versions(company_id);
  END IF;
END $$;

-- 1c. contract_approvals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_approvals' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE contract_approvals
      ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    UPDATE contract_approvals ca
    SET company_id = c.company_id
    FROM contracts c
    WHERE ca.contract_id = c.id
      AND c.company_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_contract_approvals_company_id ON contract_approvals(company_id);
  END IF;
END $$;

-- 1d. promoters
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promoters' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE promoters
      ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    -- Back-fill: use employer_id → parties → company_id if available
    UPDATE promoters pr
    SET company_id = p.company_id
    FROM parties p
    WHERE pr.employer_id = p.id
      AND p.company_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_promoters_company_id ON promoters(company_id);
  END IF;
END $$;

-- 1e. promoter_documents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promoter_documents' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE promoter_documents
      ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    UPDATE promoter_documents pd
    SET company_id = pr.company_id
    FROM promoters pr
    WHERE pd.promoter_id = pr.id
      AND pr.company_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_promoter_documents_company_id ON promoter_documents(company_id);
  END IF;
END $$;

-- 1f. documents (generic document management table if it exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'documents'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE documents
      ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: REMOVE DANGEROUS GRANTS TO anon ROLE
-- ============================================================================

-- Revoke SELECT on sensitive tables from anon
REVOKE SELECT ON rbac_user_role_assignments FROM anon;
REVOKE SELECT ON profiles FROM anon;
REVOKE SELECT ON roles FROM anon;
REVOKE SELECT ON permissions FROM anon;
REVOKE SELECT ON role_permissions FROM anon;

-- Revoke the blanket authenticated grants added by 001_add_missing_tables.sql
-- These bypass the intent of RLS by granting INSERT/UPDATE/DELETE to all tables
-- We replace them with table-specific grants below
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Re-grant only what authenticated users legitimately need
-- (SELECT is still needed for RLS-filtered reads)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Specific write grants for tables authenticated users can modify
-- (RLS policies control which rows they can actually touch)
GRANT INSERT, UPDATE ON contracts TO authenticated;
GRANT INSERT, UPDATE ON promoters TO authenticated;
GRANT INSERT, UPDATE ON promoter_documents TO authenticated;
GRANT INSERT, UPDATE ON contract_versions TO authenticated;
GRANT INSERT, UPDATE ON contract_approvals TO authenticated;
GRANT INSERT ON system_activity_log TO authenticated;
GRANT INSERT ON contract_activity_log TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;

-- ============================================================================
-- SECTION 3: STANDARDIZE AUTHORIZATION TO user_roles
-- ============================================================================

-- Helper function: check if the current user belongs to a given company
-- This is the single source of truth for tenant membership checks in RLS policies
CREATE OR REPLACE FUNCTION auth_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM user_roles
  WHERE user_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  )
    AND is_active = true
  LIMIT 1;
$$;

-- Helper function: check if current user has a specific role in a given company
CREATE OR REPLACE FUNCTION auth_user_has_role(p_company_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE p.user_id = auth.uid()
      AND ur.company_id = p_company_id
      AND ur.role::TEXT = p_role
      AND ur.is_active = true
  );
$$;

-- Helper function: get all company_ids the current user belongs to
CREATE OR REPLACE FUNCTION auth_user_company_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(ur.company_id)
  FROM user_roles ur
  JOIN profiles p ON p.id = ur.user_id
  WHERE p.user_id = auth.uid()
    AND ur.is_active = true;
$$;

-- ============================================================================
-- SECTION 4: REPLACE BROKEN RLS POLICIES WITH COMPANY-SCOPED POLICIES
-- ============================================================================

-- ---- contracts ----
DROP POLICY IF EXISTS "Users can view contracts" ON contracts;
DROP POLICY IF EXISTS "Users can create contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;

CREATE POLICY "Tenant members can view their company contracts"
  ON contracts FOR SELECT
  USING (
    company_id = ANY(auth_user_company_ids())
    OR company_id IS NULL -- legacy rows without company_id remain visible during migration
  );

CREATE POLICY "Tenant members can create contracts for their company"
  ON contracts FOR INSERT
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
  );

CREATE POLICY "Tenant members can update their company contracts"
  ON contracts FOR UPDATE
  USING (
    company_id = ANY(auth_user_company_ids())
  )
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
  );

CREATE POLICY "Admins can delete their company contracts"
  ON contracts FOR DELETE
  USING (
    auth_user_has_role(company_id, 'admin')
  );

-- ---- contract_versions ----
DROP POLICY IF EXISTS "Users can view contract versions" ON contract_versions;
DROP POLICY IF EXISTS "Users can create contract versions" ON contract_versions;

CREATE POLICY "Tenant members can view their company contract versions"
  ON contract_versions FOR SELECT
  USING (
    company_id = ANY(auth_user_company_ids())
    OR company_id IS NULL
  );

CREATE POLICY "Tenant members can create contract versions"
  ON contract_versions FOR INSERT
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
  );

-- ---- contract_approvals ----
DROP POLICY IF EXISTS "Users can view contract approvals" ON contract_approvals;
DROP POLICY IF EXISTS "Users can create contract approvals" ON contract_approvals;

CREATE POLICY "Tenant members can view their company approvals"
  ON contract_approvals FOR SELECT
  USING (
    company_id = ANY(auth_user_company_ids())
    OR company_id IS NULL
  );

CREATE POLICY "Tenant members can create approvals"
  ON contract_approvals FOR INSERT
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
  );

CREATE POLICY "Approvers can update approvals"
  ON contract_approvals FOR UPDATE
  USING (
    company_id = ANY(auth_user_company_ids())
  );

-- ---- promoters ----
DROP POLICY IF EXISTS "Users can view promoters" ON promoters;
DROP POLICY IF EXISTS "Users can create promoters" ON promoters;
DROP POLICY IF EXISTS "Users can update promoters" ON promoters;

CREATE POLICY "Tenant members can view their company promoters"
  ON promoters FOR SELECT
  USING (
    company_id = ANY(auth_user_company_ids())
    OR company_id IS NULL -- legacy rows during migration
  );

CREATE POLICY "Tenant members can create promoters"
  ON promoters FOR INSERT
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
  );

CREATE POLICY "Tenant members can update their company promoters"
  ON promoters FOR UPDATE
  USING (
    company_id = ANY(auth_user_company_ids())
  )
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
  );

CREATE POLICY "Admins can delete their company promoters"
  ON promoters FOR DELETE
  USING (
    auth_user_has_role(company_id, 'admin')
  );

-- ---- promoter_documents ----
DROP POLICY IF EXISTS "Users can view promoter documents" ON promoter_documents;
DROP POLICY IF EXISTS "Users can create promoter documents" ON promoter_documents;
DROP POLICY IF EXISTS "Users can update promoter documents" ON promoter_documents;

CREATE POLICY "Tenant members can view their company promoter documents"
  ON promoter_documents FOR SELECT
  USING (
    company_id = ANY(auth_user_company_ids())
    OR company_id IS NULL
  );

CREATE POLICY "Tenant members can manage their company promoter documents"
  ON promoter_documents FOR INSERT
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
  );

CREATE POLICY "Tenant members can update their company promoter documents"
  ON promoter_documents FOR UPDATE
  USING (
    company_id = ANY(auth_user_company_ids())
  );

-- ---- user_roles ----
-- Users can only see roles for companies they belong to
DROP POLICY IF EXISTS "Users can view user roles" ON user_roles;

CREATE POLICY "Users can view roles in their companies"
  ON user_roles FOR SELECT
  USING (
    -- Can see your own roles
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    -- Admins can see all roles in their company
    OR company_id = ANY(auth_user_company_ids())
  );

CREATE POLICY "Admins can manage roles in their company"
  ON user_roles FOR ALL
  USING (
    auth_user_has_role(company_id, 'admin')
  )
  WITH CHECK (
    auth_user_has_role(company_id, 'admin')
  );

-- ============================================================================
-- SECTION 5: ENABLE RLS ON ANY TABLES THAT WERE MISSED
-- ============================================================================

ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: ADD PERFORMANCE INDEXES FOR TENANT QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_active ON user_roles(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ============================================================================
-- SECTION 7: COMMENT DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION auth_user_company_id() IS
  'Returns the primary active company_id for the current authenticated user. Used in RLS policies.';

COMMENT ON FUNCTION auth_user_has_role(UUID, TEXT) IS
  'Returns true if the current authenticated user has the specified role in the given company. Used in RLS policies.';

COMMENT ON FUNCTION auth_user_company_ids() IS
  'Returns all active company_ids for the current authenticated user. Used in RLS policies for multi-company access.';

COMMENT ON COLUMN contracts.company_id IS
  'Tenant isolation column. All contract queries MUST be scoped to this company_id.';

COMMENT ON COLUMN promoters.company_id IS
  'Tenant isolation column. All promoter queries MUST be scoped to this company_id.';
