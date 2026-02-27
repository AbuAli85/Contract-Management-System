-- ============================================================================
-- Company Members: canonical membership table for UI
-- ============================================================================
-- This migration ensures public.company_members exists with a schema that matches
-- the generated types and existing code expectations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  status TEXT NOT NULL DEFAULT 'active',
  department TEXT NULL,
  job_title TEXT NULL,
  is_primary BOOLEAN NULL,
  joined_at TIMESTAMPTZ NULL,
  permissions JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

-- Ensure one active membership row per (company, user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_members_company_user
  ON public.company_members (company_id, user_id);

-- Simple index to speed up company lookups
CREATE INDEX IF NOT EXISTS idx_company_members_company
  ON public.company_members (company_id);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Helper functions auth_user_company_ids() and auth_user_has_role(...) are
-- defined in 20260226_week1_tenant_isolation.sql and reused here.

-- Tenant members can view members of their companies
CREATE POLICY "company_members_select_tenant"
  ON public.company_members
  FOR SELECT
  USING (
    company_id = ANY(auth_user_company_ids())
  );

-- Admins/managers can insert memberships for their company
CREATE POLICY "company_members_insert_admin_manager"
  ON public.company_members
  FOR INSERT
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
    AND (
      auth_user_has_role(company_id, 'admin')
      OR auth_user_has_role(company_id, 'manager')
    )
  );

-- Admins/managers can update memberships for their company
CREATE POLICY "company_members_update_admin_manager"
  ON public.company_members
  FOR UPDATE
  USING (
    company_id = ANY(auth_user_company_ids())
    AND (
      auth_user_has_role(company_id, 'admin')
      OR auth_user_has_role(company_id, 'manager')
    )
  )
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
    AND (
      auth_user_has_role(company_id, 'admin')
      OR auth_user_has_role(company_id, 'manager')
    )
  );

-- Only admins can delete memberships in their company
CREATE POLICY "company_members_delete_admin"
  ON public.company_members
  FOR DELETE
  USING (
    company_id = ANY(auth_user_company_ids())
    AND auth_user_has_role(company_id, 'admin')
  );

