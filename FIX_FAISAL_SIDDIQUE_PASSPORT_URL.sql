-- Fix Faisal Siddique Passport URL
-- Issue: passport_url points to NO_PASSPORT.png instead of the correct file with passport number

-- Current incorrect URL:
-- https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/faisal_siddique_NO_PASSPORT.png

-- Correct URL should be:
-- https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/faisal_siddique_hy5460522.png

-- Update the passport URL
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/faisal_siddique_hy5460522.png',
  updated_at = NOW()
WHERE 
  id = 'd42c2302-6ae1-4ac2-b9a8-4b9af1233311'
  AND name_en ILIKE 'faisal siddique'
  AND passport_number = 'hy5460522';

-- Verify the update
SELECT 
  id,
  name_en,
  id_card_number,
  passport_number,
  id_card_url,
  passport_url,
  updated_at
FROM promoters
WHERE id = 'd42c2302-6ae1-4ac2-b9a8-4b9af1233311';

