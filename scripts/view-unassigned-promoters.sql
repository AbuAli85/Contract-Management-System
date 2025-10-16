-- ============================================================================
-- VIEW UNASSIGNED PROMOTERS (Need Employer Assignment)
-- ============================================================================

-- Show the 8 promoters without employer
SELECT 
  id,
  name_en,
  name_ar,
  job_title,
  status,
  id_card_number,
  mobile_number,
  email,
  created_at
FROM promoters
WHERE employer_id IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- To assign an employer to these promoters:
-- 
-- First, get the employer ID:
-- SELECT id, name_en FROM parties WHERE type = 'Employer';
--
-- Then update the promoter:
-- UPDATE promoters 
-- SET employer_id = 'EMPLOYER-UUID-HERE'
-- WHERE id = 'PROMOTER-UUID-HERE';
-- ============================================================================

