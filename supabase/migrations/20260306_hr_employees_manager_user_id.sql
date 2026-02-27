-- ============================================================================
-- HR Employees: manager_user_id helper column
-- ============================================================================
-- Adds an optional direct link from an employee to their manager's auth user.
-- This is used for workflow approval routing (e.g. leave approvals).
-- ============================================================================

ALTER TABLE hr.employees
  ADD COLUMN IF NOT EXISTS manager_user_id UUID REFERENCES auth.users(id);

