-- ============================================================================
-- FIX ATTENDANCE ISSUES
-- ============================================================================
-- This script fixes common attendance issues after employer_employee records
-- are properly set up
-- ============================================================================

-- ============================================================================
-- PART 1: VERIFY EMPLOYER_EMPLOYEE RECORDS FOR ATTENDANCE
-- ============================================================================

-- Check how many promoters/employees can track attendance
SELECT 
  'Promoters with employer_employee records (can track attendance)' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
JOIN employer_employees ee ON ee.employee_id = emp_profile.id
  AND ee.employer_id = emp_pr.id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND ee.employment_status = 'active'

UNION ALL

SELECT 
  'Promoters without employer_employee records (cannot track attendance)' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  )
  AND EXISTS (
    SELECT 1 FROM profiles pr
    JOIN parties pt2 ON LOWER(TRIM(pt2.contact_email)) = LOWER(TRIM(pr.email))
    WHERE pt2.id = pt.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM employer_employees ee
    JOIN profiles emp_pr ON emp_pr.id = ee.employer_id
    JOIN profiles emp_profile ON emp_profile.id = ee.employee_id
    WHERE LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
      AND LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
      AND ee.employment_status = 'active'
  );

-- ============================================================================
-- PART 2: FIX MISSING COMPANY_ID IN EMPLOYER_EMPLOYEES
-- ============================================================================

-- Update employer_employees with missing company_id
UPDATE employer_employees ee
SET company_id = (
  SELECT c.id
  FROM companies c
  WHERE c.party_id = ee.party_id
  LIMIT 1
),
updated_at = NOW()
WHERE ee.company_id IS NULL
  AND ee.party_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM companies c
    WHERE c.party_id = ee.party_id
  );

-- ============================================================================
-- PART 3: VERIFY ATTENDANCE RECORDS
-- ============================================================================

-- Check attendance records linked to active employer_employees
SELECT 
  'Total attendance records' as metric,
  COUNT(*) as count
FROM employee_attendance ea
JOIN employer_employees ee ON ee.id = ea.employer_employee_id
WHERE ee.employment_status = 'active'

UNION ALL

SELECT 
  'Attendance records for today' as metric,
  COUNT(*) as count
FROM employee_attendance ea
JOIN employer_employees ee ON ee.id = ea.employer_employee_id
WHERE ee.employment_status = 'active'
  AND ea.attendance_date = CURRENT_DATE

UNION ALL

SELECT 
  'Employees with attendance records' as metric,
  COUNT(DISTINCT ee.employee_id) as count
FROM employee_attendance ea
JOIN employer_employees ee ON ee.id = ea.employer_employee_id
WHERE ee.employment_status = 'active';

-- ============================================================================
-- PART 4: IDENTIFY ATTENDANCE ISSUES
-- ============================================================================

-- Check for orphaned attendance records (employer_employee deleted but attendance remains)
SELECT 
  'Orphaned attendance records' as issue_type,
  COUNT(*) as count
FROM employee_attendance ea
WHERE NOT EXISTS (
  SELECT 1 FROM employer_employees ee
  WHERE ee.id = ea.employer_employee_id
)

UNION ALL

-- Check for attendance records with invalid dates
SELECT 
  'Attendance records with future dates' as issue_type,
  COUNT(*) as count
FROM employee_attendance
WHERE attendance_date > CURRENT_DATE

UNION ALL

-- Check for attendance records with missing check_in/check_out
SELECT 
  'Attendance records missing both check_in and check_out' as issue_type,
  COUNT(*) as count
FROM employee_attendance
WHERE check_in IS NULL
  AND check_out IS NULL;

-- ============================================================================
-- PART 5: FIX ATTENDANCE DATA QUALITY
-- ============================================================================

-- Fix attendance records with invalid status
UPDATE employee_attendance
SET status = CASE
  WHEN check_in IS NULL AND check_out IS NULL THEN 'absent'
  WHEN check_in IS NOT NULL AND check_out IS NULL THEN 'present'
  WHEN check_in IS NOT NULL AND check_out IS NOT NULL THEN 'present'
  ELSE 'absent'
END,
updated_at = NOW()
WHERE status IS NULL
  OR status NOT IN ('present', 'absent', 'late', 'half_day', 'leave', 'holiday');

-- Fix attendance records with missing total_hours when check_in and check_out exist
UPDATE employee_attendance
SET total_hours = EXTRACT(EPOCH FROM (check_out - check_in)) / 3600.0,
    updated_at = NOW()
WHERE check_in IS NOT NULL
  AND check_out IS NOT NULL
  AND total_hours IS NULL;

-- ============================================================================
-- PART 6: SUMMARY REPORT
-- ============================================================================

DO $$
DECLARE
  v_total_employer_employees INTEGER;
  v_with_attendance INTEGER;
  v_without_attendance INTEGER;
  v_orphaned_attendance INTEGER;
BEGIN
  -- Count total active employer_employees
  SELECT COUNT(*) INTO v_total_employer_employees
  FROM employer_employees
  WHERE employment_status = 'active';
  
  -- Count with attendance records
  SELECT COUNT(DISTINCT ee.id) INTO v_with_attendance
  FROM employer_employees ee
  JOIN employee_attendance ea ON ea.employer_employee_id = ee.id
  WHERE ee.employment_status = 'active';
  
  v_without_attendance := v_total_employer_employees - v_with_attendance;
  
  -- Count orphaned attendance
  SELECT COUNT(*) INTO v_orphaned_attendance
  FROM employee_attendance ea
  WHERE NOT EXISTS (
    SELECT 1 FROM employer_employees ee
    WHERE ee.id = ea.employer_employee_id
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ATTENDANCE SYSTEM STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total active employer_employees: %', v_total_employer_employees;
  RAISE NOTICE 'With attendance records: %', v_with_attendance;
  RAISE NOTICE 'Without attendance records: %', v_without_attendance;
  RAISE NOTICE 'Orphaned attendance records: %', v_orphaned_attendance;
  RAISE NOTICE '';
  
  IF v_orphaned_attendance > 0 THEN
    RAISE WARNING 'Found % orphaned attendance records. These may need cleanup.', v_orphaned_attendance;
  END IF;
  
  RAISE NOTICE '✅ Attendance system ready!';
  RAISE NOTICE '';
END $$;

