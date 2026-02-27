-- ============================================================================
-- HR Employees: helper indexes for manager routing
-- ============================================================================
-- Adds indexes used by approval routing:
--   - idx_hr_employees_user_id
--   - idx_hr_employees_manager_user_id
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_hr_employees_user_id
  ON hr.employees (user_id);

CREATE INDEX IF NOT EXISTS idx_hr_employees_manager_user_id
  ON hr.employees (manager_user_id);

