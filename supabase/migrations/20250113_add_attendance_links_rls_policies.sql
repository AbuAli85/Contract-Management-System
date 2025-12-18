-- Migration: Add RLS Policies for Attendance Links
-- Date: 2025-01-13
-- Description: Enable RLS and create policies for attendance_links and attendance_link_usage tables

-- Enable RLS on attendance_links table
ALTER TABLE attendance_links ENABLE ROW LEVEL SECURITY;

-- Enable RLS on attendance_link_usage table
ALTER TABLE attendance_link_usage ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- ATTENDANCE_LINKS POLICIES
-- ==============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS attendance_links_company_manage ON attendance_links;
DROP POLICY IF EXISTS attendance_links_employee_read ON attendance_links;

-- Policy 1: Admins, Employers, and Managers can manage all attendance links for their company
CREATE POLICY attendance_links_company_manage ON attendance_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'employer', 'manager')
    AND profiles.active_company_id = attendance_links.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'employer', 'manager')
    AND profiles.active_company_id = attendance_links.company_id
  )
);

-- Policy 2: Employees can view active attendance links for their company (for check-in)
CREATE POLICY attendance_links_employee_read ON attendance_links
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND NOW() >= valid_from
  AND NOW() <= valid_until
  AND EXISTS (
    SELECT 1 FROM employer_employees ee
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE ee.employee_id = p.id
    AND ee.company_id = attendance_links.company_id
    AND ee.employment_status = 'active'
  )
);

-- ==============================================
-- ATTENDANCE_LINK_USAGE POLICIES
-- ==============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS attendance_link_usage_company_read ON attendance_link_usage;
DROP POLICY IF EXISTS attendance_link_usage_employee_insert ON attendance_link_usage;
DROP POLICY IF EXISTS attendance_link_usage_employee_read ON attendance_link_usage;

-- Policy 1: Admins, Employers, and Managers can view all usage records for their company
CREATE POLICY attendance_link_usage_company_read ON attendance_link_usage
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM attendance_links al
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE al.id = attendance_link_usage.attendance_link_id
    AND p.role IN ('admin', 'employer', 'manager')
    AND p.active_company_id = al.company_id
  )
);

-- Policy 2: Employees can insert their own usage records (when checking in)
CREATE POLICY attendance_link_usage_employee_insert ON attendance_link_usage
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM attendance_links al
    INNER JOIN employer_employees ee ON ee.company_id = al.company_id
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE al.id = attendance_link_usage.attendance_link_id
    AND ee.id = attendance_link_usage.employer_employee_id
    AND ee.employee_id = p.id
    AND ee.employment_status = 'active'
    AND al.is_active = true
    AND NOW() >= al.valid_from
    AND NOW() <= al.valid_until
  )
);

-- Policy 3: Employees can view their own usage records
CREATE POLICY attendance_link_usage_employee_read ON attendance_link_usage
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employer_employees ee
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE ee.id = attendance_link_usage.employer_employee_id
    AND ee.employee_id = p.id
  )
);

-- Add helpful comments
COMMENT ON POLICY attendance_links_company_manage ON attendance_links IS 
  'Allows admins, employers, and managers to create, read, update, and delete attendance links for their company';

COMMENT ON POLICY attendance_links_employee_read ON attendance_links IS 
  'Allows employees to view active attendance links for their company to check in';

COMMENT ON POLICY attendance_link_usage_company_read ON attendance_link_usage IS 
  'Allows admins, employers, and managers to view all attendance link usage for their company';

COMMENT ON POLICY attendance_link_usage_employee_insert ON attendance_link_usage IS 
  'Allows employees to create usage records when checking in via an attendance link';

COMMENT ON POLICY attendance_link_usage_employee_read ON attendance_link_usage IS 
  'Allows employees to view their own attendance link usage records';

-- ==============================================
-- ATTENDANCE_LINK_SCHEDULES POLICIES
-- ==============================================

-- Enable RLS on attendance_link_schedules table
ALTER TABLE attendance_link_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS attendance_link_schedules_company_manage ON attendance_link_schedules;

-- Policy 1: Admins, Employers, and Managers can manage all schedules for their company
CREATE POLICY attendance_link_schedules_company_manage ON attendance_link_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'employer', 'manager')
    AND profiles.active_company_id = attendance_link_schedules.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'employer', 'manager')
    AND profiles.active_company_id = attendance_link_schedules.company_id
  )
);

-- ==============================================
-- SCHEDULED_ATTENDANCE_LINKS POLICIES
-- ==============================================

-- Enable RLS on scheduled_attendance_links table
ALTER TABLE scheduled_attendance_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS scheduled_attendance_links_company_read ON scheduled_attendance_links;
DROP POLICY IF EXISTS scheduled_attendance_links_service_insert ON scheduled_attendance_links;

-- Policy 1: Admins, Employers, and Managers can view all scheduled links for their company
CREATE POLICY scheduled_attendance_links_company_read ON scheduled_attendance_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM attendance_link_schedules als
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE als.id = scheduled_attendance_links.schedule_id
    AND p.role IN ('admin', 'employer', 'manager')
    AND p.active_company_id = als.company_id
  )
);

-- Policy 2: Service role can insert scheduled links (for cron job)
-- Note: This is handled by using supabaseAdmin in the API, which bypasses RLS
-- But we add a policy for completeness
CREATE POLICY scheduled_attendance_links_service_insert ON scheduled_attendance_links
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM attendance_link_schedules als
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE als.id = scheduled_attendance_links.schedule_id
    AND p.role IN ('admin', 'employer', 'manager')
    AND p.active_company_id = als.company_id
  )
);

-- Add helpful comments
COMMENT ON POLICY attendance_link_schedules_company_manage ON attendance_link_schedules IS 
  'Allows admins, employers, and managers to create, read, update, and delete attendance schedules for their company';

COMMENT ON POLICY scheduled_attendance_links_company_read ON scheduled_attendance_links IS 
  'Allows admins, employers, and managers to view scheduled attendance links for their company';

COMMENT ON POLICY scheduled_attendance_links_service_insert ON scheduled_attendance_links IS 
  'Allows admins, employers, and managers to create scheduled attendance link records';

