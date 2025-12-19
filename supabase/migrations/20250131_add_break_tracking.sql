-- Migration: Add Break Tracking to Attendance
-- Date: 2025-01-31
-- Description: Add break_start_time column to track active breaks

-- Add break_start_time column to employee_attendance table
ALTER TABLE employee_attendance
  ADD COLUMN IF NOT EXISTS break_start_time TIMESTAMPTZ;

-- Create index for break queries
CREATE INDEX IF NOT EXISTS idx_employee_attendance_break_start ON employee_attendance(break_start_time)
  WHERE break_start_time IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN employee_attendance.break_start_time IS 'Timestamp when the employee started their current break. NULL if not on break.';

