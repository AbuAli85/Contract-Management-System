-- ============================================================================
-- Unified Workflow Engine Core Tables
-- ============================================================================
-- This migration introduces two core workflow tables:
--   1) workflow_instances
--   2) workflow_events
--
-- Both tables are tenant-scoped via company_id and protected by RLS policies
-- that:
--   - Allow SELECT for tenant members (based on user_roles).
--   - Allow INSERT for:
--       * service_role (for system automation), OR
--       * admin/manager roles in user_roles for the target company.
--
-- NOTE:
--   - We use CREATE TABLE IF NOT EXISTS to avoid conflicts with any prior
--     experimental workflow tables; this migration defines the unified shape.
--   - RLS is intentionally minimal; UPDATE/DELETE are not granted explicitly
--     and can be added later as needed.
-- ============================================================================

-- ============================================================================
-- 1. Table: workflow_instances
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_state TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite index for fast lookups by tenant + entity
CREATE INDEX IF NOT EXISTS idx_workflow_instances_company_entity
  ON public.workflow_instances (company_id, entity_type, entity_id);

-- ============================================================================
-- 2. Table: workflow_events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_state TEXT,
  new_state TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for event streams by tenant + instance + time
CREATE INDEX IF NOT EXISTS idx_workflow_events_company_instance_created
  ON public.workflow_events (company_id, workflow_instance_id, created_at);

-- ============================================================================
-- 3. Row Level Security (RLS)
-- ============================================================================
-- Tenancy & roles are enforced via:
--   - public.user_roles (user_id, company_id, role, is_active)
--   - public.profiles (id, user_id)
--
-- Conventions:
--   - "Tenant members" for SELECT: any active user_roles row for the company.
--   - INSERT:
--       * service_role can always insert (auth.role() = 'service_role').
--       * application users must have role IN ('admin','manager') in user_roles
--         for the target company.
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events    ENABLE ROW LEVEL SECURITY;

-- Clean up any legacy policies if they exist
DROP POLICY IF EXISTS "workflow_instances_select_tenant" ON public.workflow_instances;
DROP POLICY IF EXISTS "workflow_instances_insert_roles"  ON public.workflow_instances;

DROP POLICY IF EXISTS "workflow_events_select_tenant" ON public.workflow_events;
DROP POLICY IF EXISTS "workflow_events_insert_roles"  ON public.workflow_events;

-- --------------------------------------------------------------------------
-- 3.1 workflow_instances policies
-- --------------------------------------------------------------------------

-- SELECT: tenant members (any active membership in user_roles for company_id)
CREATE POLICY "workflow_instances_select_tenant"
  ON public.workflow_instances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = workflow_instances.company_id
        AND ur.is_active = TRUE
    )
  );

-- INSERT: service_role OR admin/manager membership in user_roles
CREATE POLICY "workflow_instances_insert_roles"
  ON public.workflow_instances
  FOR INSERT
  WITH CHECK (
    -- System automation via service_role
    auth.role() = 'service_role'
    OR
    -- Application users with admin/manager role for this company
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = workflow_instances.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('admin', 'manager')
    )
  );

-- --------------------------------------------------------------------------
-- 3.2 workflow_events policies
-- --------------------------------------------------------------------------

-- SELECT: tenant members (same criteria as workflow_instances)
CREATE POLICY "workflow_events_select_tenant"
  ON public.workflow_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = workflow_events.company_id
        AND ur.is_active = TRUE
    )
  );

-- INSERT: service_role OR admin/manager membership in user_roles
CREATE POLICY "workflow_events_insert_roles"
  ON public.workflow_events
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = workflow_events.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('admin', 'manager')
    )
  );

