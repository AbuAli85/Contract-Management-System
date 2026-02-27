-- ============================================================================
-- Work Items: explicit schema and RLS
-- ============================================================================
-- This migration creates the public.work_items table used by the Work Engine
-- and Inbox APIs, matching the expectations in lib/work-engine and /api/inbox.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NULL,
  assignee_id UUID NULL,
  due_at TIMESTAMPTZ NULL,
  sla_due_at TIMESTAMPTZ NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  source TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NULL,
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uniqueness per entity within a company (defined also in 20260305)
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_items_company_entity_unique
  ON public.work_items (company_id, entity_type, entity_id);

-- Indexes to support common Inbox queries
CREATE INDEX IF NOT EXISTS idx_work_items_company_assignee_status
  ON public.work_items (company_id, assignee_id, status);

CREATE INDEX IF NOT EXISTS idx_work_items_company_status_created
  ON public.work_items (company_id, status, created_at);

-- Escalation index is created in 20260311_work_items_escalated.sql; keep here
CREATE INDEX IF NOT EXISTS idx_work_items_company_status_sla_escalated
  ON public.work_items (company_id, status, sla_due_at, escalated);

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

-- Tenant members can view work items for their companies
CREATE POLICY "work_items_select_tenant"
  ON public.work_items
  FOR SELECT
  USING (
    company_id = ANY(auth_user_company_ids())
  );

-- Insert is restricted to service_role; work_items is a projection/index
CREATE POLICY "work_items_insert_service"
  ON public.work_items
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
  );

-- Tenant members can update work items for their companies (assign/complete/etc.)
CREATE POLICY "work_items_update_tenant"
  ON public.work_items
  FOR UPDATE
  USING (
    company_id = ANY(auth_user_company_ids())
  )
  WITH CHECK (
    company_id = ANY(auth_user_company_ids())
  );

