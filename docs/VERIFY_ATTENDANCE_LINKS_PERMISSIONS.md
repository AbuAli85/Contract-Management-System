# Verify Attendance Links Permissions

## Quick Verification

Run this SQL to check if permissions are granted:

```sql
-- Check table permissions
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name IN ('attendance_links', 'attendance_link_usage', 'attendance_link_schedules', 'scheduled_attendance_links')
ORDER BY table_name, grantee;
```

**Expected Result:**
You should see:
- `authenticated` role with SELECT, INSERT, UPDATE, DELETE
- `postgres` role with ALL privileges
- `service_role` role with ALL privileges

## Apply Permissions (If Missing)

If permissions are missing, run this SQL:

```sql
-- Grant to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_link_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_link_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_attendance_links TO authenticated;

-- Grant to postgres (database owner)
GRANT ALL ON attendance_links TO postgres;
GRANT ALL ON attendance_link_usage TO postgres;
GRANT ALL ON attendance_link_schedules TO postgres;
GRANT ALL ON scheduled_attendance_links TO postgres;

-- Grant to service_role (for service role key)
GRANT ALL ON attendance_links TO service_role;
GRANT ALL ON attendance_link_usage TO service_role;
GRANT ALL ON attendance_link_schedules TO service_role;
GRANT ALL ON scheduled_attendance_links TO service_role;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO postgres;
GRANT EXECUTE ON FUNCTION generate_attendance_link_code() TO service_role;

GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO postgres;
GRANT EXECUTE ON FUNCTION validate_attendance_link(VARCHAR, DECIMAL, DECIMAL, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO postgres;
GRANT EXECUTE ON FUNCTION auto_generate_daily_attendance_links() TO service_role;
```

## Check RLS Status

```sql
-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('attendance_links', 'attendance_link_usage', 'attendance_link_schedules', 'scheduled_attendance_links');
```

**Expected:** All should show `true` (RLS enabled)

## Check Policies

```sql
-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('attendance_links', 'attendance_link_usage', 'attendance_link_schedules', 'scheduled_attendance_links')
ORDER BY tablename, policyname;
```

**Expected:** Should see policies like:
- `attendance_links_company_manage`
- `attendance_links_employee_read`
- etc.

## Complete Fix Checklist

- [ ] RLS is enabled on all tables
- [ ] RLS policies are created
- [ ] GRANT permissions are given to `authenticated` role
- [ ] GRANT permissions are given to `postgres` role
- [ ] GRANT permissions are given to `service_role` role
- [ ] Function execute permissions are granted
- [ ] Test creating an attendance link

