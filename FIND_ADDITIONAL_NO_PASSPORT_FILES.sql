-- Find Additional Promoters with NO_PASSPORT files
-- These are files that weren't in the original 27 but still need fixing

-- Check for these specific promoters
SELECT 
  id,
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_number IS NOT NULL AND passport_number != '' THEN
      'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
      LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(passport_number, ' ', '_')) || '.png'
    ELSE NULL
  END as correct_url
FROM promoters
WHERE 
  name_en ILIKE '%syed roshaan%'
  OR name_en ILIKE '%MAHMOUD ELMASRY%'
  OR name_en ILIKE '%husnain sohail butt%'
  OR name_en ILIKE '%haider ali gulam abbas merchant%'
ORDER BY name_en;

-- Also check for any other NO_PASSPORT files in storage
SELECT 
  'STORAGE_FILES' as source,
  name as filename
FROM storage.objects
WHERE 
  bucket_id = 'promoter-documents'
  AND (
    name LIKE '%NO_PASSPORT%'
    OR name LIKE '%no_passport%'
  )
ORDER BY name;

