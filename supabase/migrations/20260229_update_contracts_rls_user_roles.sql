-- ============================================================================
-- Rewrite RLS for contracts using ONLY user_roles
-- ============================================================================
-- Goal:
--   - Tenant membership is user_roles(user_id, company_id, role).
--   - contracts access is controlled purely via user_roles, not profiles.role
--     or helper functions.
--
-- Rules:
--   - SELECT: user must have a user_roles row matching contracts.company_id.
--   - INSERT: user_roles.role IN ('admin','manager') AND
--             user_roles.company_id = NEW.company_id.
--   - UPDATE: same as INSERT.
--   - DELETE: user_roles.role = 'admin' AND company_id matches.
--
-- Notes:
--   - This migration only modifies RLS for contracts.
--   - Existing application code is not changed.
--   - Policies are written to be idempotent (DROP POLICY IF EXISTS ...).
-- ============================================================================

-- Ensure RLS is enabled on contracts (safe if already enabled)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. Drop legacy / conflicting policies on contracts
--    (including those based on profiles.role or helper functions)
-- ============================================================================

-- Older profile-based policies
DROP POLICY IF EXISTS "Users can view all contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can approve contracts" ON public.contracts;

-- Any earlier generic names that may exist
DROP POLICY IF EXISTS "Users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;

-- Company-scoped policies from tenant isolation phase
DROP POLICY IF EXISTS "Tenant members can view their company contracts" ON public.contracts;
DROP POLICY IF EXISTS "Tenant members can create contracts for their company" ON public.contracts;
DROP POLICY IF EXISTS "Tenant members can update their company contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can delete their company contracts" ON public.contracts;

-- ============================================================================
-- 2. New contracts policies using ONLY user_roles for tenancy and roles
-- ============================================================================
-- Helper pattern used below:
--   - profiles.user_id = auth.uid() gives current profile row.
--   - user_roles.user_id = profiles.id links to company-specific role.
--   - user_roles.is_active = TRUE to ignore inactive memberships.
-- ============================================================================

-- 2.1 SELECT: user has any active membership for contracts.company_id
CREATE POLICY "contracts_select_by_user_roles"
  ON public.contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = contracts.company_id
        AND ur.is_active = TRUE
    )
  );

-- 2.2 INSERT: role IN ('admin','manager') and membership company matches NEW.company_id
CREATE POLICY "contracts_insert_by_user_roles"
  ON public.contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = contracts.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('admin', 'manager')
    )
  );

-- 2.3 UPDATE: same conditions as INSERT, applied to both USING and WITH CHECK
CREATE POLICY "contracts_update_by_user_roles"
  ON public.contracts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = contracts.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = contracts.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('admin', 'manager')
    )
  );

-- 2.4 DELETE: only admins for the contract's company
CREATE POLICY "contracts_delete_by_user_roles"
  ON public.contracts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = contracts.company_id
        AND ur.is_active = TRUE
        AND ur.role = 'admin'
    )
  );

