-- ============================================================================
-- FIX EMPLOYER-EMPLOYEE UNIFIED SYSTEM
-- ============================================================================
-- This script ensures all promoters, employees, and team members are properly
-- linked in the employer_employees table for unified access to attendance,
-- tasks, targets, and other features.
-- ============================================================================
-- Run this script to fix all relationships and ensure attendance works
-- ============================================================================

-- First, run the migration
\i supabase/migrations/20250120_fix_employer_employee_unified_system.sql

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check how many promoters have employer_employee records
SELECT 
  'Promoters with employer_employee records' as check_type,
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

UNION ALL

-- Check how many promoters are missing employer_employee records
SELECT 
  'Promoters missing employer_employee records' as check_type,
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
  )

UNION ALL

-- Check employer_employees with missing party_id
SELECT 
  'Employer_employees missing party_id' as check_type,
  COUNT(*) as count
FROM employer_employees
WHERE party_id IS NULL
  AND promoter_id IS NOT NULL

UNION ALL

-- Check employer_employees with missing promoter_id
SELECT 
  'Employer_employees missing promoter_id' as check_type,
  COUNT(*) as count
FROM employer_employees ee
WHERE ee.promoter_id IS NULL
  AND EXISTS (
    SELECT 1 FROM promoters p
    JOIN profiles pr ON pr.id = ee.employee_id
    WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(pr.email))
      AND p.employer_id = ee.party_id
  )

UNION ALL

-- Check employer_employees with missing company_id
SELECT 
  'Employer_employees missing company_id' as check_type,
  COUNT(*) as count
FROM employer_employees
WHERE company_id IS NULL
  AND party_id IS NOT NULL

UNION ALL

-- Check attendance records linked to employer_employees
SELECT 
  'Attendance records' as check_type,
  COUNT(*) as count
FROM employee_attendance ea
JOIN employer_employees ee ON ee.id = ea.employer_employee_id
WHERE ee.employment_status = 'active';

-- ============================================================================
-- DETAILED REPORT BY EMPLOYER PARTY
-- ============================================================================

SELECT 
  pt.name_en as employer_name,
  pt.id as party_id,
  COUNT(DISTINCT p.id) as total_promoters,
  COUNT(DISTINCT ee.id) as employer_employee_records,
  COUNT(DISTINCT CASE WHEN ea.id IS NOT NULL THEN ee.id END) as with_attendance_records
FROM parties pt
LEFT JOIN promoters p ON p.employer_id = pt.id
  AND p.status = 'active'
LEFT JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
LEFT JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
LEFT JOIN employer_employees ee ON ee.employee_id = emp_profile.id
  AND ee.employer_id = emp_pr.id
LEFT JOIN employee_attendance ea ON ea.employer_employee_id = ee.id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
GROUP BY pt.id, pt.name_en
ORDER BY pt.name_en;

