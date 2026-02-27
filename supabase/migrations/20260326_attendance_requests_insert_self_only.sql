-- ============================================================================
-- hr.attendance_requests INSERT: self-only unless admin/manager
-- ============================================================================
-- Allow INSERT when tenant member AND (admin/manager OR inserting for self).
-- ============================================================================

DO $$
BEGIN
  -- Only apply policy when hr.attendance_requests table exists
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
        AND policyname = 'hr_attendance_requests_insert_tenant'
    ) THEN
      DROP POLICY "hr_attendance_requests_insert_tenant" ON hr.attendance_requests;
    END IF;

    CREATE POLICY "hr_attendance_requests_insert_tenant"
      ON hr.attendance_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (
        company_id = ANY (public.auth_user_company_ids())
        AND (
          public.auth_user_has_role(attendance_requests.company_id, 'admin')
          OR public.auth_user_has_role(attendance_requests.company_id, 'manager')
          OR EXISTS (
            SELECT 1
            FROM hr.user_profiles up
            WHERE up.user_id = auth.uid()
              AND up.employee_id = attendance_requests.employee_id
          )
        )
      );
  END IF;
END $$;
