-- ============================================================================
-- COMPLETE SETUP: HOLDING GROUPS SYSTEM
-- ============================================================================
-- This script runs everything in the correct order:
-- 1. Creates the tables (migration)
-- 2. Initializes Falcon Eye Group
-- 3. Verifies the setup
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE TABLES (Migration)
-- ============================================================================

-- 1. HOLDING GROUPS TABLE
CREATE TABLE IF NOT EXISTS holding_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  CONSTRAINT holding_groups_name_en_unique UNIQUE (name_en)
);

CREATE INDEX IF NOT EXISTS idx_holding_groups_name_en ON holding_groups(name_en);
CREATE INDEX IF NOT EXISTS idx_holding_groups_is_active ON holding_groups(is_active);

-- 2. HOLDING GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS holding_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holding_group_id UUID NOT NULL REFERENCES holding_groups(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL CHECK (member_type IN ('party', 'company')),
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  CONSTRAINT holding_group_members_member_check 
    CHECK ((party_id IS NOT NULL AND company_id IS NULL) OR 
           (party_id IS NULL AND company_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_holding_group_members_holding_group_id ON holding_group_members(holding_group_id);
CREATE INDEX IF NOT EXISTS idx_holding_group_members_party_id ON holding_group_members(party_id);
CREATE INDEX IF NOT EXISTS idx_holding_group_members_company_id ON holding_group_members(company_id);

-- Ensure a party/company can only belong to one holding group (using partial unique indexes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_holding_group_members_party_unique 
  ON holding_group_members(party_id) 
  WHERE party_id IS NOT NULL;
  
CREATE UNIQUE INDEX IF NOT EXISTS idx_holding_group_members_company_unique 
  ON holding_group_members(company_id) 
  WHERE company_id IS NOT NULL;

-- 3. TRADEMARKS TABLE
CREATE TABLE IF NOT EXISTS trademarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  parent_party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  parent_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  CONSTRAINT trademarks_name_unique UNIQUE (name),
  CONSTRAINT trademarks_parent_check 
    CHECK ((parent_party_id IS NOT NULL AND parent_company_id IS NULL) OR 
           (parent_party_id IS NULL AND parent_company_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_trademarks_parent_party_id ON trademarks(parent_party_id);
CREATE INDEX IF NOT EXISTS idx_trademarks_parent_company_id ON trademarks(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_trademarks_is_active ON trademarks(is_active);

-- 4. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_holding_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_holding_groups_updated_at ON holding_groups;
CREATE TRIGGER trigger_holding_groups_updated_at
  BEFORE UPDATE ON holding_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_holding_groups_updated_at();

DROP TRIGGER IF EXISTS trigger_holding_group_members_updated_at ON holding_group_members;
CREATE TRIGGER trigger_holding_group_members_updated_at
  BEFORE UPDATE ON holding_group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_holding_groups_updated_at();

DROP TRIGGER IF EXISTS trigger_trademarks_updated_at ON trademarks;
CREATE TRIGGER trigger_trademarks_updated_at
  BEFORE UPDATE ON trademarks
  FOR EACH ROW
  EXECUTE FUNCTION update_holding_groups_updated_at();

DO $$
BEGIN
  RAISE NOTICE '✅ Tables created successfully';
END $$;

-- ============================================================================
-- PART 2: CREATE FALCON EYE GROUP HOLDING GROUP
-- ============================================================================

INSERT INTO holding_groups (
  id,
  name_en,
  name_ar,
  description,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'Falcon Eye Group',
  'مجموعة عين الصقر',
  'Holding group managing 16+ Falcon Eye companies',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM holding_groups WHERE name_en = 'Falcon Eye Group'
);

-- ============================================================================
-- PART 3: ADD ALL FALCON EYE COMPANIES TO THE HOLDING GROUP
-- ============================================================================

DO $$
DECLARE
  v_falcon_eye_group_id UUID;
  v_falcon_eye_modern_id UUID;
  v_members_added INTEGER;
BEGIN
  -- Get Falcon Eye Group ID
  SELECT id INTO v_falcon_eye_group_id
  FROM holding_groups
  WHERE name_en = 'Falcon Eye Group'
  LIMIT 1;

  IF v_falcon_eye_group_id IS NULL THEN
    RAISE EXCEPTION 'Failed to find Falcon Eye Group';
  END IF;

  RAISE NOTICE 'Falcon Eye Group ID: %', v_falcon_eye_group_id;

  -- Add all Falcon Eye parties to the holding group
  INSERT INTO holding_group_members (
    holding_group_id,
    party_id,
    member_type,
    display_order,
    created_at,
    updated_at
  )
  SELECT 
    v_falcon_eye_group_id,
    pt.id,
    'party',
    ROW_NUMBER() OVER (ORDER BY pt.name_en),
    NOW(),
    NOW()
  FROM parties pt
  WHERE (LOWER(pt.name_en) LIKE '%falcon%eye%'
     OR LOWER(pt.name_ar) LIKE '%falcon%eye%')
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM holding_group_members hgm
      WHERE hgm.party_id = pt.id
    );

  GET DIAGNOSTICS v_members_added = ROW_COUNT;
  RAISE NOTICE 'Added % Falcon Eye companies to holding group', v_members_added;

  -- ============================================================================
  -- PART 4: CREATE DIGITAL MORPH AS TRADEMARK
  -- ============================================================================

  -- Find Falcon Eye Modern Investments party
  SELECT pt.id INTO v_falcon_eye_modern_id
  FROM parties pt
  WHERE LOWER(pt.name_en) LIKE '%falcon%eye%modern%investment%'
     OR LOWER(pt.name_en) LIKE '%falcon eye modern investments%'
  LIMIT 1;

  IF v_falcon_eye_modern_id IS NOT NULL THEN
    -- Create Digital Morph trademark
    INSERT INTO trademarks (
      name,
      description,
      parent_party_id,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      'Digital Morph',
      'Social marketing agency trademark under Falcon Eye Modern Investments SPC',
      v_falcon_eye_modern_id,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (name) DO UPDATE SET
      description = EXCLUDED.description,
      parent_party_id = EXCLUDED.parent_party_id,
      updated_at = NOW();

    RAISE NOTICE 'Digital Morph trademark created under Falcon Eye Modern Investments (ID: %)', v_falcon_eye_modern_id;
  ELSE
    RAISE WARNING 'Falcon Eye Modern Investments not found. Digital Morph trademark not created.';
  END IF;

END $$;

-- ============================================================================
-- PART 5: VERIFICATION
-- ============================================================================

SELECT 
  '=== SETUP VERIFICATION ===' as section;

-- Check holding group
SELECT 
  'Falcon Eye Group' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM holding_groups WHERE name_en = 'Falcon Eye Group')
    THEN '✅ Created'
    ELSE '❌ Not found'
  END as status;

-- Count members
SELECT 
  'Falcon Eye Group Members' as item,
  COUNT(*)::text as count
FROM holding_group_members hgm
JOIN holding_groups hg ON hg.id = hgm.holding_group_id
WHERE hg.name_en = 'Falcon Eye Group';

-- Check Digital Morph trademark
SELECT 
  'Digital Morph Trademark' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM trademarks WHERE name = 'Digital Morph')
    THEN '✅ Created'
    ELSE '❌ Not found'
  END as status;

-- Show all members
SELECT 
  '=== FALCON EYE GROUP MEMBERS ===' as section;

SELECT 
  pt.name_en as company_name,
  pt.type as party_type,
  pt.overall_status as status
FROM holding_group_members hgm
JOIN holding_groups hg ON hg.id = hgm.holding_group_id
JOIN parties pt ON pt.id = hgm.party_id
WHERE hg.name_en = 'Falcon Eye Group'
ORDER BY pt.name_en;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ HOLDING GROUPS SYSTEM SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Access UI at: /manage-parties/holding-groups';
  RAISE NOTICE '2. Verify the structure in the UI';
  RAISE NOTICE '3. Add/remove members as needed';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

