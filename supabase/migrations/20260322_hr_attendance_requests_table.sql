-- ============================================================================
-- HR Attendance Requests: canonical correction request entity + tenancy
-- ============================================================================

-- Ensure hr schema exists
CREATE SCHEMA IF NOT EXISTS hr;

-- 1. Create attendance_requests table if it does not exist
CREATE TABLE IF NOT EXISTS hr.attendance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES hr.employees(id) ON DELETE CASCADE,

  -- Target date for the attendance correction
  attendance_date DATE NOT NULL,

  -- Optional original / requested times for auditability
  original_check_in TIMESTAMPTZ,
  original_check_out TIMESTAMPTZ,
  requested_check_in TIMESTAMPTZ,
  requested_check_out TIMESTAMPTZ,

  reason TEXT,

  -- Simple status + stage flags for workflow integration
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  approval_stage TEXT NOT NULL DEFAULT 'pending_manager'
    CHECK (approval_stage IN ('pending_manager', 'approved', 'rejected')),

  -- Workflow integration identifier (mirrors hr.leave_requests pattern)
  workflow_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure workflow_entity_id is unique for safe workflow + work_items mapping
CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_attendance_requests_workflow_entity
  ON hr.attendance_requests (workflow_entity_id);

-- Tenant / employee query patterns
CREATE INDEX IF NOT EXISTS idx_hr_attendance_requests_company_status_created
  ON hr.attendance_requests (company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hr_attendance_requests_company_employee_date
  ON hr.attendance_requests (company_id, employee_id, attendance_date DESC);

-- 2. Enable Row Level Security
ALTER TABLE hr.attendance_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
DO $$
BEGIN
  -- Drop legacy policies if present (for idempotency)
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'hr'
      AND tablename = 'attendance_requests'
      AND policyname = 'hr_attendance_requests_select_tenant'
  ) THEN
    DROP POLICY "hr_attendance_requests_select_tenant" ON hr.attendance_requests;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'hr'
      AND tablename = 'attendance_requests'
      AND policyname = 'hr_attendance_requests_insert_tenant'
  ) THEN
    DROP POLICY "hr_attendance_requests_insert_tenant" ON hr.attendance_requests;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'hr'
      AND tablename = 'attendance_requests'
      AND policyname = 'hr_attendance_requests_update_managers'
  ) THEN
    DROP POLICY "hr_attendance_requests_update_managers" ON hr.attendance_requests;
  END IF;

  -- 3a. SELECT: allow any authenticated user whose active companies include the row's company
  CREATE POLICY "hr_attendance_requests_select_tenant"
    ON hr.attendance_requests
    FOR SELECT
    TO authenticated
    USING (company_id = ANY (public.auth_user_company_ids()));

  -- 3b. INSERT: allow tenant members to create requests for employees in their company
  -- Detailed "self-only" enforcement is handled at the application layer.
  CREATE POLICY "hr_attendance_requests_insert_tenant"
    ON hr.attendance_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (company_id = ANY (public.auth_user_company_ids()));

  -- 3c. UPDATE: restrict to tenant managers/admins (company-level roles)
  CREATE POLICY "hr_attendance_requests_update_managers"
    ON hr.attendance_requests
    FOR UPDATE
    TO authenticated
    USING (
      company_id = ANY (public.auth_user_company_ids())
      AND (
        public.auth_user_has_role(auth.uid(), 'admin', company_id)
        OR public.auth_user_has_role(auth.uid(), 'manager', company_id)
      )
    )
    WITH CHECK (
      company_id = ANY (public.auth_user_company_ids())
      AND (
        public.auth_user_has_role(auth.uid(), 'admin', company_id)
        OR public.auth_user_has_role(auth.uid(), 'manager', company_id)
      )
    );
END $$;

