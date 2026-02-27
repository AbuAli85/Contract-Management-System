-- ============================================================================
-- Work Items: escalated flag for efficient overdue routing
-- ============================================================================
-- Adds:
--   - escalated boolean flag (default false)
--   - composite index (company_id, status, sla_due_at, escalated)
-- ============================================================================

ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_work_items_company_status_sla_escalated
  ON public.work_items (company_id, status, sla_due_at, escalated);

