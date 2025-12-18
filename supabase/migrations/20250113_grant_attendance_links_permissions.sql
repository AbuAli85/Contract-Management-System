-- Migration: Grant Explicit Permissions for Attendance Links
-- Date: 2025-01-13
-- Description: Grant explicit PostgreSQL permissions to authenticated and service_role users
-- This is needed in addition to RLS policies for the service role to work

-- Grant permissions to authenticated role (for RLS policies to work)
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_link_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_link_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_attendance_links TO authenticated;

-- Grant permissions to postgres role (database owner)
GRANT ALL ON attendance_links TO postgres;
GRANT ALL ON attendance_link_usage TO postgres;
GRANT ALL ON attendance_link_schedules TO postgres;
GRANT ALL ON scheduled_attendance_links TO postgres;

-- Grant permissions to service_role (for service role key to bypass RLS)
-- This is the actual role used by SUPABASE_SERVICE_ROLE_KEY
GRANT ALL ON attendance_links TO service_role;
GRANT ALL ON attendance_link_usage TO service_role;
GRANT ALL ON attendance_link_schedules TO service_role;
GRANT ALL ON scheduled_attendance_links TO service_role;

-- Note: These tables use UUID primary keys (uuid_generate_v4()), so no sequences are needed

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO postgres;
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO service_role;

GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO postgres;
GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO postgres;
GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO service_role;

-- Add helpful comment
COMMENT ON TABLE attendance_links IS 
  'Attendance links table with RLS enabled. Permissions granted to authenticated and postgres roles.';

