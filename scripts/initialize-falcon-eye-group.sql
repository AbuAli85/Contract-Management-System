-- ============================================================================
-- INITIALIZE FALCON EYE GROUP AND DIGITAL MORPH
-- ============================================================================
-- This script creates the Falcon Eye Group holding group and
-- assigns all Falcon Eye companies to it
-- Also creates Digital Morph as a trademark under Falcon Eye Modern Investments
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE FALCON EYE GROUP HOLDING GROUP
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
)
RETURNING id as falcon_eye_group_id;

-- Get the Falcon Eye Group ID
DO $$
DECLARE
  v_falcon_eye_group_id UUID;
  v_falcon_eye_modern_id UUID;
  v_members_added INTEGER;
BEGIN
  SELECT id INTO v_falcon_eye_group_id
  FROM holding_groups
  WHERE name_en = 'Falcon Eye Group'
  LIMIT 1;

  IF v_falcon_eye_group_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create Falcon Eye Group';
  END IF;

  RAISE NOTICE 'Falcon Eye Group created with ID: %', v_falcon_eye_group_id;

  -- ============================================================================
  -- PART 2: ADD ALL FALCON EYE COMPANIES TO THE HOLDING GROUP
  -- ============================================================================

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
  -- PART 3: CREATE DIGITAL MORPH AS TRADEMARK
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
-- PART 4: VERIFICATION
-- ============================================================================

SELECT 
  '=== VERIFICATION ===' as section;

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

