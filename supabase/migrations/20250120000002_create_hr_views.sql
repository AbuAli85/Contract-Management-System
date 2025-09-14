-- HR Module Views Migration
-- Creates reporting and alert views for the HR system

-- 1. Expiring documents view (60 days)
CREATE OR REPLACE VIEW hr.expiring_documents_60d AS
SELECT 
  'PASSPORT' as kind, 
  e.id as employee_id, 
  e.full_name,
  p.passport_number as ref, 
  p.expiry_date as expires_on,
  (p.expiry_date - CURRENT_DATE) as days_until_expiry
FROM hr.employees e
JOIN hr.passports p ON p.employee_id = e.id
WHERE p.expiry_date <= (CURRENT_DATE + INTERVAL '60 days')
  AND e.employment_status = 'active'
UNION ALL
SELECT 
  'VISA', 
  e.id, 
  e.full_name,
  v.visa_number, 
  v.expiry_date,
  (v.expiry_date - CURRENT_DATE) as days_until_expiry
FROM hr.employees e
JOIN hr.visas v ON v.employee_id = e.id
WHERE v.expiry_date <= (CURRENT_DATE + INTERVAL '60 days')
  AND e.employment_status = 'active';

-- 2. Attendance summary view
CREATE OR REPLACE VIEW hr.attendance_monthly AS
SELECT
  e.id as employee_id,
  e.full_name,
  e.employee_code,
  DATE_TRUNC('month', a.check_in) as month,
  COUNT(*) FILTER (WHERE a.check_out IS NOT NULL) as days_present,
  COUNT(*) FILTER (WHERE a.check_out IS NULL) as days_incomplete,
  SUM(EXTRACT(EPOCH FROM (a.check_out - a.check_in))/3600) FILTER (WHERE a.check_out IS NOT NULL) as total_hours,
  AVG(EXTRACT(EPOCH FROM (a.check_out - a.check_in))/3600) FILTER (WHERE a.check_out IS NOT NULL) as avg_daily_hours
FROM hr.attendance_logs a
JOIN hr.employees e ON e.id = a.employee_id
WHERE e.employment_status = 'active'
GROUP BY e.id, e.full_name, e.employee_code, DATE_TRUNC('month', a.check_in);

-- 3. Employee summary view
CREATE OR REPLACE VIEW hr.employee_summary AS
SELECT 
  e.id,
  e.employee_code,
  e.full_name,
  e.job_title,
  d.name as department_name,
  e.employment_status,
  e.hire_date,
  e.phone,
  e.email,
  p.passport_number,
  p.expiry_date as passport_expiry,
  v.visa_number,
  v.expiry_date as visa_expiry,
  COUNT(DISTINCT al.id) FILTER (WHERE (al.check_in::DATE) = CURRENT_DATE) as today_attendance,
  COUNT(DISTINCT lr.id) FILTER (WHERE lr.approval_status = 'pending') as pending_leave_requests
FROM hr.employees e
LEFT JOIN hr.departments d ON d.id = e.department_id
LEFT JOIN hr.passports p ON p.employee_id = e.id AND p.is_primary = true
LEFT JOIN hr.visas v ON v.employee_id = e.id AND v.is_primary = true
LEFT JOIN hr.attendance_logs al ON al.employee_id = e.id
LEFT JOIN hr.leave_requests lr ON lr.employee_id = e.id
GROUP BY e.id, e.employee_code, e.full_name, e.job_title, d.name, e.employment_status, 
         e.hire_date, e.phone, e.email, p.passport_number, p.expiry_date, v.visa_number, v.expiry_date;

-- Grant permissions on views
GRANT SELECT ON hr.expiring_documents_60d TO authenticated;
GRANT SELECT ON hr.attendance_monthly TO authenticated;
GRANT SELECT ON hr.employee_summary TO authenticated;
