-- ============================================================================
-- FIX: Generate employee_code for Muhammad Junaid
-- ============================================================================

UPDATE employer_employees
SET 
  employee_code = 'EMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(employee_id::text, '-', ''), -4)),
  updated_at = NOW()
WHERE id = 'b3a4fc61-9d2f-4901-bf12-28798a1e2283'
  AND employee_code IS NULL;

-- Verify the update
SELECT 
  '✅ UPDATED' as status,
  ee.id,
  ee.employee_code,
  pr.full_name as employee_name,
  pr.email as employee_email,
  ee.employment_status
FROM employer_employees ee
INNER JOIN profiles pr ON pr.id = ee.employee_id
WHERE ee.id = 'b3a4fc61-9d2f-4901-bf12-28798a1e2283';

