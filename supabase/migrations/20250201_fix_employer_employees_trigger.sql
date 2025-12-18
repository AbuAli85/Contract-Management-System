-- ============================================================================
-- Fix employer_employees Trigger to Prevent NULL employee_id
-- Date: 2025-02-01
-- Description: Fixes the sync_promoter_to_employer_employee function to
--              prevent inserting records with NULL employee_id
-- ============================================================================

-- Drop and recreate the function with proper NULL checking
CREATE OR REPLACE FUNCTION sync_promoter_to_employer_employee(
  p_promoter_id UUID,
  p_party_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_employer_profile_id UUID;
  v_employee_profile_id UUID;
  v_company_id UUID;
  v_employer_employee_id UUID;
BEGIN
  -- Get employer profile from party
  SELECT pr.id INTO v_employer_profile_id
  FROM profiles pr
  JOIN parties pt ON LOWER(pt.contact_email) = LOWER(pr.email)
  WHERE pt.id = p_party_id
  LIMIT 1;

  -- Get employee profile from promoter (match by email)
  SELECT pr.id INTO v_employee_profile_id
  FROM profiles pr
  JOIN promoters p ON LOWER(COALESCE(p.email, '')) = LOWER(COALESCE(pr.email, ''))
  WHERE p.id = p_promoter_id
    AND p.email IS NOT NULL
    AND TRIM(p.email) != ''
    AND pr.email IS NOT NULL
    AND TRIM(pr.email) != ''
  LIMIT 1;

  -- If employee profile not found by email, try to find by name matching
  -- (This is a fallback for promoters without emails)
  IF v_employee_profile_id IS NULL THEN
    SELECT pr.id INTO v_employee_profile_id
    FROM profiles pr
    JOIN promoters p ON p.id = p_promoter_id
    WHERE (
      -- Match by name_en
      (p.name_en IS NOT NULL AND TRIM(p.name_en) != '' 
       AND (
         LOWER(TRIM(p.name_en)) = LOWER(TRIM(COALESCE(pr.full_name, '')))
         OR LOWER(TRIM(p.name_en)) = LOWER(TRIM(COALESCE(pr.first_name || ' ' || pr.last_name, '')))
       ))
      -- Match by name_ar
      OR (p.name_ar IS NOT NULL AND TRIM(p.name_ar) != ''
       AND (
         LOWER(TRIM(p.name_ar)) = LOWER(TRIM(COALESCE(pr.full_name, '')))
         OR LOWER(TRIM(p.name_ar)) = LOWER(TRIM(COALESCE(pr.first_name || ' ' || pr.last_name, '')))
       ))
      -- Match by first_name + last_name
      OR (p.first_name IS NOT NULL AND p.last_name IS NOT NULL
       AND LOWER(TRIM(p.first_name)) = LOWER(TRIM(COALESCE(pr.first_name, '')))
       AND LOWER(TRIM(p.last_name)) = LOWER(TRIM(COALESCE(pr.last_name, ''))))
    )
    LIMIT 1;
  END IF;

  -- Get company_id from party
  SELECT c.id INTO v_company_id
  FROM companies c
  WHERE c.party_id = p_party_id
  LIMIT 1;

  -- ✅ CRITICAL FIX: Only insert if both employer_id and employee_id are NOT NULL
  IF v_employer_profile_id IS NULL THEN
    RAISE WARNING 'Cannot create employer_employees: employer profile not found for party %', p_party_id;
    RETURN NULL;
  END IF;

  IF v_employee_profile_id IS NULL THEN
    RAISE WARNING 'Cannot create employer_employees: employee profile not found for promoter %', p_promoter_id;
    RETURN NULL;
  END IF;

  -- Create or update employer_employee record
  INSERT INTO employer_employees (
    employer_id,
    employee_id,
    party_id,
    promoter_id,
    company_id,
    employment_status,
    created_at,
    updated_at
  )
  VALUES (
    v_employer_profile_id,
    v_employee_profile_id,
    p_party_id,
    p_promoter_id,
    v_company_id,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (employee_id, employer_id) 
  DO UPDATE SET
    party_id = EXCLUDED.party_id,
    promoter_id = EXCLUDED.promoter_id,
    company_id = EXCLUDED.company_id,
    updated_at = NOW()
  RETURNING id INTO v_employer_employee_id;

  RETURN v_employer_employee_id;
END;
$$ LANGUAGE plpgsql;

-- Also update the trigger function to handle NULL returns gracefully
CREATE OR REPLACE FUNCTION trigger_sync_promoter_to_employer_employee()
RETURNS TRIGGER AS $$
DECLARE
  v_result UUID;
BEGIN
  IF NEW.employer_id IS NOT NULL THEN
    v_result := sync_promoter_to_employer_employee(NEW.id, NEW.employer_id);
    -- If sync failed (returned NULL), log but don't fail the trigger
    IF v_result IS NULL THEN
      RAISE WARNING 'Failed to sync promoter % to employer_employees (missing profile)', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the function exists and is correct
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'sync_promoter_to_employer_employee'
  ) THEN
    RAISE NOTICE 'Function sync_promoter_to_employer_employee updated successfully';
  ELSE
    RAISE WARNING 'Function sync_promoter_to_employer_employee not found';
  END IF;
END;
$$;

