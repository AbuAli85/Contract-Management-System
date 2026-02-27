-- ============================================================================
-- Fix hr.attendance_requests RLS: auth_user_has_role signature
-- ============================================================================
-- Canonical signature is auth_user_has_role(p_company_id UUID, p_role TEXT).
-- Replace incorrect three-arg calls with (company_id, 'admin'|'manager').
-- ============================================================================

DO $$
BEGIN
  -- Only apply when hr.attendance_requests exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'hr'
      AND table_name = 'attendance_requests'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'hr'
        AND tablename = 'attendance_requests'
        AND policyname = 'hr_attendance_requests_update_managers'
    ) THEN
      DROP POLICY "hr_attendance_requests_update_managers" ON hr.attendance_requests;
    END IF;

    CREATE POLICY "hr_attendance_requests_update_managers"
      ON hr.attendance_requests
      FOR UPDATE
      TO authenticated
      USING (
        company_id = ANY (public.auth_user_company_ids())
        AND (
          public.auth_user_has_role(attendance_requests.company_id, 'admin')
          OR public.auth_user_has_role(attendance_requests.company_id, 'manager')
        )
      )
      WITH CHECK (
        company_id = ANY (public.auth_user_company_ids())
        AND (
          public.auth_user_has_role(attendance_requests.company_id, 'admin')
          OR public.auth_user_has_role(attendance_requests.company_id, 'manager')
        )
      );
  END IF;
END $$;
