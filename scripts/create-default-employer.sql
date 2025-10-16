-- ============================================================================
-- CREATE DEFAULT/UNASSIGNED EMPLOYER FOR TEMPORARY PLACEMENT
-- ============================================================================
-- Use this if you need a placeholder employer for promoters
-- where the actual employer is unknown or pending verification
-- ============================================================================

-- Create a "Default" or "Unassigned" employer
INSERT INTO parties (
  id,
  name_en,
  name_ar,
  type,
  status,
  overall_status,
  crn,
  notes,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'Default Employer (Unassigned)',
  'صاحب عمل افتراضي (غير محدد)',
  'Employer',
  'active',
  'Active',
  'PENDING',
  'Temporary employer category for promoters pending proper assignment',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING id, name_en;

-- After creating, use the returned ID to assign the 8 promoters:
-- UPDATE promoters SET employer_id = 'RETURNED-UUID' WHERE employer_id IS NULL;

-- ============================================================================
-- IMPORTANT: This is a temporary solution!
-- You should reassign these promoters to their actual employers when known.
-- ============================================================================

