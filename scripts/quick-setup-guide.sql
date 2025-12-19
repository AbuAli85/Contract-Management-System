-- ============================================================================
-- QUICK SETUP GUIDE - ATTENDANCE SYSTEM
-- ============================================================================
-- Follow these steps in order:
-- ============================================================================

-- STEP 1: Check your current user and company
-- Run this to see your user ID and active company
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.active_company_id,
  c.name as active_company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.active_company_id
WHERE p.id = auth.uid();

-- STEP 2: If no active company, list your companies
SELECT 
  c.id as company_id,
  c.name as company_name,
  cm.role,
  cm.is_primary
FROM companies c
JOIN company_members cm ON cm.company_id = c.id
WHERE cm.user_id = auth.uid()
ORDER BY cm.is_primary DESC;

-- STEP 3: Set active company (if needed)
-- Uncomment and update with your company ID from Step 2
-- UPDATE profiles 
-- SET active_company_id = 'your-company-id-here'::UUID
-- WHERE id = auth.uid();

-- STEP 4: Run the simple setup script
-- Now run: scripts/setup-attendance-system-simple.sql
-- It will use your active company automatically!

