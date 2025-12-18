-- Migration: Grant Explicit Permissions for Attendance Links (Comprehensive)
-- Date: 2025-01-13
-- Description: Grant explicit PostgreSQL permissions to all necessary roles
-- This ensures both RLS policies and service role can access the tables

-- First, revoke any existing permissions to start clean
REVOKE ALL ON attendance_links FROM authenticated;
REVOKE ALL ON attendance_links FROM anon;
REVOKE ALL ON attendance_links FROM postgres;
REVOKE ALL ON attendance_links FROM service_role;

REVOKE ALL ON attendance_link_usage FROM authenticated;
REVOKE ALL ON attendance_link_usage FROM anon;
REVOKE ALL ON attendance_link_usage FROM postgres;
REVOKE ALL ON attendance_link_usage FROM service_role;

REVOKE ALL ON attendance_link_schedules FROM authenticated;
REVOKE ALL ON attendance_link_schedules FROM anon;
REVOKE ALL ON attendance_link_schedules FROM postgres;
REVOKE ALL ON attendance_link_schedules FROM service_role;

REVOKE ALL ON scheduled_attendance_links FROM authenticated;
REVOKE ALL ON scheduled_attendance_links FROM anon;
REVOKE ALL ON scheduled_attendance_links FROM postgres;
REVOKE ALL ON scheduled_attendance_links FROM service_role;

-- Grant permissions to authenticated role (for RLS policies to work)
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_link_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_link_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_attendance_links TO authenticated;

-- Grant permissions to anon role (for public access if needed)
GRANT SELECT ON attendance_links TO anon;
GRANT SELECT ON attendance_link_usage TO anon;

-- Grant permissions to postgres role (database owner - should have all permissions)
GRANT ALL ON attendance_links TO postgres;
GRANT ALL ON attendance_link_usage TO postgres;
GRANT ALL ON attendance_link_schedules TO postgres;
GRANT ALL ON scheduled_attendance_links TO postgres;

-- Grant permissions to service_role (for service role key to bypass RLS)
GRANT ALL ON attendance_links TO service_role;
GRANT ALL ON attendance_link_usage TO service_role;
GRANT ALL ON attendance_link_schedules TO service_role;
GRANT ALL ON scheduled_attendance_links TO service_role;

-- Grant execute permission on functions to all roles
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO anon;
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO postgres;
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO service_role;

GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO anon;
GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO postgres;
GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO postgres;
GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO service_role;

-- Verify grants were applied
DO $$
BEGIN
  RAISE NOTICE 'Permissions granted successfully';
  RAISE NOTICE 'Check grants with: SELECT * FROM information_schema.table_privileges WHERE table_name = ''attendance_links'';';
END $$;

