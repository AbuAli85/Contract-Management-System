-- ============================================================================
-- Work Items: index for assignee/status/sla_due_at filters
-- Hardened to handle legacy schemas where assignee_id may be missing.
-- ============================================================================

DO $$
BEGIN
  -- Ensure assignee_id column exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'work_items'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_items'
      AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE public.work_items
      ADD COLUMN assignee_id UUID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_items_company_assignee_status_sla
  ON public.work_items (company_id, assignee_id, status, sla_due_at);

