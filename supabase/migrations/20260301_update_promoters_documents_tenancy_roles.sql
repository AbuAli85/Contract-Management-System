-- ============================================================================
-- Update RLS for promoters & documents with company tenancy + role-based writes
-- ============================================================================
-- Tenancy:
--   - Scoped by company_id.
--   - Membership / roles come from company_members via check_company_membership().
--
-- Policies:
--   - SELECT: membership by company_id.
--   - INSERT/UPDATE: roles in ('owner','admin','hr','manager') via:
--        check_company_membership(company_id, auth.uid(), 'manager')
--        OR check_company_membership(company_id, auth.uid(), 'hr')
--        (each also treats 'owner' and 'admin' as elevated roles).
--   - DELETE: roles in ('owner','admin') via check_company_membership(..., 'admin').
--
-- Notes:
--   - This migration only touches RLS for promoters and documents.
--   - No application code is modified.
--   - Uses existing security definer function:
--       check_company_membership(p_company_id UUID, p_user_id UUID, p_required_role TEXT DEFAULT NULL)
-- ============================================================================

-- ============================================================================
-- 1. promoters: RLS based on company membership & roles
-- ============================================================================

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;

-- Drop legacy / conflicting promoter policies
DROP POLICY IF EXISTS "Users can view promoters" ON public.promoters;
DROP POLICY IF EXISTS "Users can create promoters" ON public.promoters;
DROP POLICY IF EXISTS "Users can update promoters" ON public.promoters;
DROP POLICY IF EXISTS "Users can delete promoters" ON public.promoters;
DROP POLICY IF EXISTS "Promoters can view own data" ON public.promoters;

DROP POLICY IF EXISTS "Users can view all promoters" ON public.promoters;

DROP POLICY IF EXISTS "Service role bypass" ON public.promoters;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.promoters;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.promoters;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.promoters;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.promoters;
DROP POLICY IF EXISTS "Enable delete for service role only" ON public.promoters;

DROP POLICY IF EXISTS "Tenant members can view their company promoters" ON public.promoters;
DROP POLICY IF EXISTS "Tenant members can create promoters" ON public.promoters;
DROP POLICY IF EXISTS "Tenant members can update their company promoters" ON public.promoters;
DROP POLICY IF EXISTS "Admins can delete their company promoters" ON public.promoters;

-- SELECT: any active company member can read promoters for their company
CREATE POLICY "promoters_select_by_company_membership"
  ON public.promoters
  FOR SELECT
  USING (
    check_company_membership(promoters.company_id, auth.uid())
  );

-- INSERT: owners, admins, HR, or managers for the company
CREATE POLICY "promoters_insert_by_roles"
  ON public.promoters
  FOR INSERT
  WITH CHECK (
    -- managers, owners, admins
    check_company_membership(promoters.company_id, auth.uid(), 'manager')
    OR
    -- HR, owners, admins
    check_company_membership(promoters.company_id, auth.uid(), 'hr')
  );

-- UPDATE: same role set as INSERT (owner/admin/hr/manager)
CREATE POLICY "promoters_update_by_roles"
  ON public.promoters
  FOR UPDATE
  USING (
    check_company_membership(promoters.company_id, auth.uid(), 'manager')
    OR
    check_company_membership(promoters.company_id, auth.uid(), 'hr')
  )
  WITH CHECK (
    check_company_membership(promoters.company_id, auth.uid(), 'manager')
    OR
    check_company_membership(promoters.company_id, auth.uid(), 'hr')
  );

-- DELETE: only owners and admins for the company
CREATE POLICY "promoters_delete_by_roles"
  ON public.promoters
  FOR DELETE
  USING (
    check_company_membership(promoters.company_id, auth.uid(), 'admin')
  );


-- ============================================================================
-- 2. documents: RLS based on company membership & roles (if table exists)
-- ============================================================================
-- The generic public.documents table is optional in this project; all
-- statements below are wrapped in a safety check.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'documents'
  ) THEN
    -- Ensure RLS is enabled
    EXECUTE 'ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY';

    -- Drop any pre-existing documents policies we might conflict with
    EXECUTE 'DROP POLICY IF EXISTS "documents_select_by_company_membership" ON public.documents';
    EXECUTE 'DROP POLICY IF EXISTS "documents_insert_by_roles" ON public.documents';
    EXECUTE 'DROP POLICY IF EXISTS "documents_update_by_roles" ON public.documents';
    EXECUTE 'DROP POLICY IF EXISTS "documents_delete_by_roles" ON public.documents';

    -- SELECT: any active company member can read documents for their company
    EXECUTE $sql$
      CREATE POLICY "documents_select_by_company_membership"
        ON public.documents
        FOR SELECT
        USING (
          check_company_membership(documents.company_id, auth.uid())
        );
    $sql$;

    -- INSERT: owners, admins, HR, or managers for the company
    EXECUTE $sql$
      CREATE POLICY "documents_insert_by_roles"
        ON public.documents
        FOR INSERT
        WITH CHECK (
          check_company_membership(documents.company_id, auth.uid(), 'manager')
          OR
          check_company_membership(documents.company_id, auth.uid(), 'hr')
        );
    $sql$;

    -- UPDATE: same role set as INSERT
    EXECUTE $sql$
      CREATE POLICY "documents_update_by_roles"
        ON public.documents
        FOR UPDATE
        USING (
          check_company_membership(documents.company_id, auth.uid(), 'manager')
          OR
          check_company_membership(documents.company_id, auth.uid(), 'hr')
        )
        WITH CHECK (
          check_company_membership(documents.company_id, auth.uid(), 'manager')
          OR
          check_company_membership(documents.company_id, auth.uid(), 'hr')
        );
    $sql$;

    -- DELETE: only owners and admins for the company
    EXECUTE $sql$
      CREATE POLICY "documents_delete_by_roles"
        ON public.documents
        FOR DELETE
        USING (
          check_company_membership(documents.company_id, auth.uid(), 'admin')
        );
    $sql$;
  END IF;
END $$;

