-- ============================================================================
-- Metrics History: optional company_id for tenant-safe analytics
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'metrics_history'
  ) THEN
    -- Add company_id column if missing
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'metrics_history'
        AND column_name = 'company_id'
    ) THEN
      ALTER TABLE public.metrics_history
        ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Lightweight index to support future tenant filters
    CREATE INDEX IF NOT EXISTS idx_metrics_history_company_date
      ON public.metrics_history (company_id, snapshot_date DESC);
  END IF;
END $$;

