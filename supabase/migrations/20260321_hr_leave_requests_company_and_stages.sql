-- ============================================================================
-- HR Leave Requests: company_id and two-stage approval metadata
-- ============================================================================

-- 1. Add company_id and stage columns if missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'hr' AND table_name = 'leave_requests'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'company_id'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'approval_stage'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN approval_stage TEXT NOT NULL DEFAULT 'pending_manager'
        CHECK (approval_stage IN ('pending_manager', 'pending_hr', 'approved', 'rejected'));
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'manager_approved_at'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN manager_approved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'manager_approved_by'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN manager_approved_by UUID;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'hr_approved_at'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN hr_approved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'hr_approved_by'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN hr_approved_by UUID;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'rejected_at'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN rejected_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'rejected_by'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN rejected_by UUID;
    END IF;
    -- Canonical UUID identifier for workflow + work_items integration
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'hr'
        AND table_name = 'leave_requests'
        AND column_name = 'workflow_entity_id'
    ) THEN
      ALTER TABLE hr.leave_requests
        ADD COLUMN workflow_entity_id UUID NOT NULL DEFAULT gen_random_uuid();
    END IF;
  END IF;
END $$;

-- 2. Backfill company_id from employees.company_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'hr'
      AND table_name = 'leave_requests'
      AND column_name = 'company_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'hr'
      AND table_name = 'employees'
      AND column_name = 'company_id'
  ) THEN
    UPDATE hr.leave_requests lr
    SET company_id = e.company_id
    FROM hr.employees e
    WHERE lr.employee_id = e.id
      AND e.company_id IS NOT NULL
      AND lr.company_id IS NULL;
  END IF;
END $$;

-- 3. Index for tenant-scoped leave queries
CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_company
  ON hr.leave_requests (company_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_leave_requests_workflow_entity
  ON hr.leave_requests (workflow_entity_id);

