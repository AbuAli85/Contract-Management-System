-- ============================================================================
-- Align hr.attendance_requests.employee_id with hr.employees.id (BIGINT)
-- ============================================================================
-- hr.employees.id is BIGSERIAL (BIGINT). Change INTEGER -> BIGINT for FK consistency.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'hr' AND table_name = 'attendance_requests'
  ) THEN
    -- Drop FK so we can alter type (recreate after)
    ALTER TABLE hr.attendance_requests
      DROP CONSTRAINT IF EXISTS attendance_requests_employee_id_fkey;

    ALTER TABLE hr.attendance_requests
      ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

    ALTER TABLE hr.attendance_requests
      ADD CONSTRAINT attendance_requests_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES hr.employees(id) ON DELETE CASCADE;
  END IF;
END $$;
