-- ============================================================================
-- FEATURE ALIGNMENT VERIFICATION SCRIPT
-- ============================================================================
-- Run this script after applying the migration to verify all alignments
-- ============================================================================

-- ============================================================================
-- 1. VERIFY PROMOTERS ↔ TEAM ALIGNMENT
-- ============================================================================

SELECT 
  'PROMOTERS ↔ TEAM ALIGNMENT' as check_type,
  COUNT(*) as total_promoters,
  COUNT(ee.id) as linked_to_team,
  COUNT(*) - COUNT(ee.id) as not_linked
FROM promoters p
LEFT JOIN employer_employees ee ON ee.promoter_id = p.id
WHERE p.employer_id IS NOT NULL;

-- Show sample promoters with team membership
SELECT 
  'Sample Promoters with Team Membership' as check_type,
  p.id as promoter_id,
  p.name_en,
  p.employer_id as party_id,
  pt.name_en as employer_name,
  ee.id as employer_employee_id,
  ee.party_id,
  ee.promoter_id,
  ee.company_id,
  ee.employment_status
FROM promoters p
LEFT JOIN parties pt ON pt.id = p.employer_id
LEFT JOIN employer_employees ee ON ee.promoter_id = p.id
WHERE p.employer_id IS NOT NULL
LIMIT 10;

-- ============================================================================
-- 2. VERIFY PARTIES ↔ COMPANIES ALIGNMENT
-- ============================================================================

SELECT 
  'PARTIES ↔ COMPANIES ALIGNMENT' as check_type,
  COUNT(*) as total_employer_parties,
  COUNT(c.id) as linked_to_companies,
  COUNT(*) - COUNT(c.id) as not_linked
FROM parties p
LEFT JOIN companies c ON c.party_id = p.id
WHERE p.type = 'Employer'
  AND p.overall_status = 'active';

-- Show sample parties with companies
SELECT 
  'Sample Parties with Companies' as check_type,
  p.id as party_id,
  p.name_en as party_name,
  p.type,
  p.overall_status,
  c.id as company_id,
  c.name as company_name,
  c.party_id,
  c.is_active
FROM parties p
LEFT JOIN companies c ON c.party_id = p.id
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
LIMIT 10;

-- ============================================================================
-- 3. VERIFY USERS ↔ PROFILES ↔ COMPANIES ALIGNMENT
-- ============================================================================

SELECT 
  'USERS ↔ PROFILES ↔ COMPANIES ALIGNMENT' as check_type,
  COUNT(*) as total_profiles,
  COUNT(pr.active_company_id) as has_active_company,
  COUNT(cm.id) as has_company_membership,
  COUNT(*) - COUNT(pr.active_company_id) as missing_active_company
FROM profiles pr
LEFT JOIN company_members cm ON cm.user_id = pr.id AND cm.status = 'active';

-- Show sample profiles with companies
SELECT 
  'Sample Profiles with Companies' as check_type,
  pr.id as profile_id,
  pr.email,
  pr.full_name,
  pr.active_company_id,
  c.id as company_id,
  c.name as company_name,
  cm.role,
  cm.status as membership_status,
  cm.is_primary
FROM profiles pr
LEFT JOIN company_members cm ON cm.user_id = pr.id
LEFT JOIN companies c ON c.id = cm.company_id OR c.id = pr.active_company_id
LIMIT 10;

-- ============================================================================
-- 4. VERIFY EMPLOYER_EMPLOYEES TABLE STRUCTURE
-- ============================================================================

SELECT 
  'EMPLOYER_EMPLOYEES STRUCTURE' as check_type,
  COUNT(*) as total_records,
  COUNT(party_id) as has_party_id,
  COUNT(promoter_id) as has_promoter_id,
  COUNT(company_id) as has_company_id,
  COUNT(employer_id) as has_employer_id
FROM employer_employees;

-- Show sample employer_employees with all relationships
SELECT 
  'Sample Employer Employees with Relationships' as check_type,
  ee.id,
  ee.employer_id,
  ee.employee_id,
  ee.party_id,
  ee.promoter_id,
  ee.company_id,
  pt.name_en as party_name,
  pr.name_en as promoter_name,
  c.name as company_name,
  ee.employment_status
FROM employer_employees ee
LEFT JOIN parties pt ON pt.id = ee.party_id
LEFT JOIN promoters pr ON pr.id = ee.promoter_id
LEFT JOIN companies c ON c.id = ee.company_id
LIMIT 10;

-- ============================================================================
-- 5. VERIFY HR FEATURES ALIGNMENT
-- ============================================================================

-- Check attendance alignment
SELECT 
  'ATTENDANCE ALIGNMENT' as check_type,
  COUNT(*) as total_attendance_records,
  COUNT(ee.promoter_id) as linked_to_promoters,
  COUNT(ee.party_id) as linked_to_parties
FROM employee_attendance ea
JOIN employer_employees ee ON ee.id = ea.employer_employee_id;

-- Check tasks alignment
SELECT 
  'TASKS ALIGNMENT' as check_type,
  COUNT(*) as total_tasks,
  COUNT(ee.promoter_id) as linked_to_promoters,
  COUNT(ee.party_id) as linked_to_parties
FROM employee_tasks et
JOIN employer_employees ee ON ee.id = et.employer_employee_id;

-- Check targets alignment
SELECT 
  'TARGETS ALIGNMENT' as check_type,
  COUNT(*) as total_targets,
  COUNT(ee.promoter_id) as linked_to_promoters,
  COUNT(ee.party_id) as linked_to_parties
FROM employee_targets et
JOIN employer_employees ee ON ee.id = et.employer_employee_id;

-- ============================================================================
-- 6. SUMMARY REPORT
-- ============================================================================

SELECT 
  'SUMMARY' as report_section,
  'Promoters with employer_id' as metric,
  COUNT(*) as count
FROM promoters
WHERE employer_id IS NOT NULL

UNION ALL

SELECT 
  'SUMMARY',
  'Employer Employees with party_id',
  COUNT(*)
FROM employer_employees
WHERE party_id IS NOT NULL

UNION ALL

SELECT 
  'SUMMARY',
  'Employer Employees with promoter_id',
  COUNT(*)
FROM employer_employees
WHERE promoter_id IS NOT NULL

UNION ALL

SELECT 
  'SUMMARY',
  'Companies with party_id',
  COUNT(*)
FROM companies
WHERE party_id IS NOT NULL

UNION ALL

SELECT 
  'SUMMARY',
  'Profiles with active_company_id',
  COUNT(*)
FROM profiles
WHERE active_company_id IS NOT NULL

UNION ALL

SELECT 
  'SUMMARY',
  'Company Members (active)',
  COUNT(*)
FROM company_members
WHERE status = 'active';

