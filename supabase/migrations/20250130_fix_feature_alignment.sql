-- ============================================================================
-- FEATURE ALIGNMENT FIX MIGRATION
-- ============================================================================
-- This migration fixes alignment issues between:
-- 1. Promoters ↔ Team Management (Payroll, Targets, Tasks, Attendance)
-- 2. Parties ↔ Employers/Companies
-- 3. Users Management ↔ Profiles ↔ Companies
-- ============================================================================

-- ============================================================================
-- PART 1: FIX EMPLOYER_EMPLOYEES TABLE
-- ============================================================================

-- Add party_id to employer_employees to link to parties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'employer_employees' 
    AND column_name = 'party_id'
  ) THEN
    ALTER TABLE employer_employees 
    ADD COLUMN party_id UUID REFERENCES parties(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_employer_employees_party_id 
    ON employer_employees(party_id);
    
    RAISE NOTICE 'Added party_id column to employer_employees';
  ELSE
    RAISE NOTICE 'party_id column already exists in employer_employees';
  END IF;
END $$;

-- Add promoter_id to employer_employees to link to promoters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'employer_employees' 
    AND column_name = 'promoter_id'
  ) THEN
    ALTER TABLE employer_employees 
    ADD COLUMN promoter_id UUID REFERENCES promoters(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_employer_employees_promoter_id 
    ON employer_employees(promoter_id);
    
    RAISE NOTICE 'Added promoter_id column to employer_employees';
  ELSE
    RAISE NOTICE 'promoter_id column already exists in employer_employees';
  END IF;
END $$;

-- Add company_id to employer_employees if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'employer_employees' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE employer_employees 
    ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_employer_employees_company_id 
    ON employer_employees(company_id);
    
    RAISE NOTICE 'Added company_id column to employer_employees';
  ELSE
    RAISE NOTICE 'company_id column already exists in employer_employees';
  END IF;
END $$;

-- Populate party_id from employer_id (via profiles → parties)
UPDATE employer_employees ee
SET party_id = (
  SELECT p.id
  FROM parties p
  JOIN profiles pr ON pr.email = p.contact_email
  WHERE pr.id = ee.employer_id
    AND p.type = 'Employer'
  LIMIT 1
)
WHERE ee.party_id IS NULL
  AND ee.employer_id IS NOT NULL;

-- Populate promoter_id from employee_id (match by email)
UPDATE employer_employees ee
SET promoter_id = (
  SELECT pr.id
  FROM promoters pr
  JOIN profiles p ON p.email = pr.email
  WHERE p.id = ee.employee_id
  LIMIT 1
)
WHERE ee.promoter_id IS NULL
  AND ee.employee_id IS NOT NULL;

-- Populate company_id from party_id
UPDATE employer_employees ee
SET company_id = (
  SELECT c.id
  FROM companies c
  WHERE c.party_id = ee.party_id
  LIMIT 1
)
WHERE ee.company_id IS NULL
  AND ee.party_id IS NOT NULL;

-- ============================================================================
-- PART 2: FIX COMPANIES TABLE
-- ============================================================================

-- Add party_id to companies if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'party_id'
  ) THEN
    ALTER TABLE companies 
    ADD COLUMN party_id UUID REFERENCES parties(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_companies_party_id 
    ON companies(party_id);
    
    RAISE NOTICE 'Added party_id column to companies';
  ELSE
    RAISE NOTICE 'party_id column already exists in companies';
  END IF;
END $$;

-- Sync companies from parties (Employers only)
INSERT INTO companies (
  id,
  name,
  slug,
  description,
  logo_url,
  email,
  phone,
  is_active,
  party_id,
  created_at,
  updated_at
)
SELECT 
  COALESCE(c.id, gen_random_uuid()),
  p.name_en,
  LOWER(REGEXP_REPLACE(COALESCE(p.name_en, 'company'), '[^a-zA-Z0-9]+', '-', 'g')),
  COALESCE(p.notes, ''),
  p.logo_url,
  p.contact_email,
  p.contact_phone,
  CASE WHEN p.overall_status = 'active' THEN true ELSE false END,
  p.id,
  COALESCE(p.created_at, NOW()),
  COALESCE(p.updated_at, NOW())
FROM parties p
LEFT JOIN companies c ON c.party_id = p.id
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND c.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  party_id = EXCLUDED.party_id,
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- Update existing companies with party_id if not set
UPDATE companies c
SET party_id = p.id
FROM parties p
WHERE p.type = 'Employer'
  AND LOWER(TRIM(c.name)) = LOWER(TRIM(p.name_en))
  AND c.party_id IS NULL;

-- ============================================================================
-- PART 3: FIX PROFILES AND COMPANY_MEMBERS
-- ============================================================================

-- Update profiles.active_company_id from company_members
UPDATE profiles p
SET active_company_id = (
  SELECT cm.company_id 
  FROM company_members cm
  WHERE cm.user_id = p.id
    AND cm.is_primary = true
    AND cm.status = 'active'
  LIMIT 1
)
WHERE p.active_company_id IS NULL
  AND EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = p.id
      AND cm.is_primary = true
      AND cm.status = 'active'
  );

-- Create company_members for users who don't have one (from parties)
INSERT INTO company_members (company_id, user_id, role, is_primary, status, joined_at)
SELECT 
  c.id,
  p.id,
  'owner',
  true,
  'active',
  NOW()
FROM profiles p
JOIN parties pt ON LOWER(pt.contact_email) = LOWER(p.email)
JOIN companies c ON c.party_id = pt.id
WHERE pt.type = 'Employer'
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.user_id = p.id AND cm.company_id = c.id
  );

-- ============================================================================
-- PART 4: CREATE BRIDGE FUNCTIONS
-- ============================================================================

-- Function to sync promoter to employer_employee
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

  -- Get employee profile from promoter
  SELECT pr.id INTO v_employee_profile_id
  FROM profiles pr
  JOIN promoters p ON LOWER(p.email) = LOWER(pr.email)
  WHERE p.id = p_promoter_id
  LIMIT 1;

  -- Get company_id from party
  SELECT c.id INTO v_company_id
  FROM companies c
  WHERE c.party_id = p_party_id
  LIMIT 1;

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

-- Function to sync party to company
CREATE OR REPLACE FUNCTION sync_party_to_company(
  p_party_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
BEGIN
  INSERT INTO companies (
    name,
    slug,
    description,
    logo_url,
    email,
    phone,
    is_active,
    party_id,
    created_at,
    updated_at
  )
  SELECT 
    p.name_en,
    LOWER(REGEXP_REPLACE(COALESCE(p.name_en, 'company'), '[^a-zA-Z0-9]+', '-', 'g')),
    COALESCE(p.notes, ''),
    p.logo_url,
    p.contact_email,
    p.contact_phone,
    CASE WHEN p.overall_status = 'active' THEN true ELSE false END,
    p.id,
    COALESCE(p.created_at, NOW()),
    COALESCE(p.updated_at, NOW())
  FROM parties p
  WHERE p.id = p_party_id
    AND p.type = 'Employer'
  ON CONFLICT (party_id) 
  DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO v_company_id;

  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: CREATE TRIGGERS FOR AUTO-SYNC
-- ============================================================================

-- Trigger: Auto-sync promoter to employer_employee when promoter.employer_id is set
CREATE OR REPLACE FUNCTION trigger_sync_promoter_to_employer_employee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employer_id IS NOT NULL THEN
    PERFORM sync_promoter_to_employer_employee(NEW.id, NEW.employer_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_promoter_to_employer_employee_trigger ON promoters;
CREATE TRIGGER sync_promoter_to_employer_employee_trigger
  AFTER INSERT OR UPDATE OF employer_id ON promoters
  FOR EACH ROW
  WHEN (NEW.employer_id IS NOT NULL)
  EXECUTE FUNCTION trigger_sync_promoter_to_employer_employee();

-- Trigger: Auto-sync party to company when party is created/updated
CREATE OR REPLACE FUNCTION trigger_sync_party_to_company()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'Employer' AND NEW.overall_status = 'active' THEN
    PERFORM sync_party_to_company(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_party_to_company_trigger ON parties;
CREATE TRIGGER sync_party_to_company_trigger
  AFTER INSERT OR UPDATE OF type, overall_status ON parties
  FOR EACH ROW
  WHEN (NEW.type = 'Employer' AND NEW.overall_status = 'active')
  EXECUTE FUNCTION trigger_sync_party_to_company();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN employer_employees.party_id IS 'Links to parties table (business entity)';
COMMENT ON COLUMN employer_employees.promoter_id IS 'Links to promoters table (employee/promoter)';
COMMENT ON COLUMN employer_employees.company_id IS 'Links to companies table (user management entity)';
COMMENT ON COLUMN companies.party_id IS 'Links to parties table (business entity)';

COMMENT ON FUNCTION sync_promoter_to_employer_employee IS 'Syncs a promoter to employer_employee record';
COMMENT ON FUNCTION sync_party_to_company IS 'Syncs a party (Employer) to companies table';

