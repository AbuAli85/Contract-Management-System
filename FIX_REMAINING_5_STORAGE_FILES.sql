-- Fix Remaining 5 Storage Files
-- These files need to be renamed in storage to match their passport numbers

-- ============================================
-- STEP 1: Find passport numbers for these promoters
-- ============================================
SELECT 
  'PASSPORT_LOOKUP' as action,
  id,
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_number IS NOT NULL AND passport_number != '' THEN
      LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
      LOWER(REPLACE(passport_number, ' ', '_')) || 
      CASE 
        WHEN passport_url LIKE '%.jpeg' THEN '.jpeg'
        WHEN passport_url LIKE '%.jpg' THEN '.jpg'
        ELSE '.png'
      END
    ELSE NULL
  END as expected_storage_filename
FROM promoters
WHERE 
  name_en ILIKE '%abdelrhman ahmed hassan abdelmoniem hassan%'
  OR name_en ILIKE '%haider ali gulam abbas merchant%'
  OR name_en ILIKE '%husnain sohail butt%'
  OR name_en ILIKE '%MAHMOUD ELMASRY%'
  OR name_en ILIKE '%mahmoud elmasry%'
  OR name_en ILIKE '%syed roshaan%'
  OR name_en ILIKE '%syed roshaan e haider abbas jafri%'
ORDER BY name_en;

-- ============================================
-- STEP 2: Generate rename commands
-- ============================================
SELECT 
  'RENAME_COMMAND' as action,
  'OLD: ' || 
  CASE 
    WHEN name_en ILIKE '%abdelrhman%' THEN 'abdelrhman_ahmed_hassan_abdelmoniem_hassan_NO_PASSPORT.jpeg'
    WHEN name_en ILIKE '%haider ali%' THEN 'haider_ali_gulam_abbas_merchant_NO_PASSPORT.jpeg'
    WHEN name_en ILIKE '%husnain sohail%' THEN 'husnain_sohail_butt_NO_PASSPORT.jpeg'
    WHEN name_en ILIKE '%mahmoud elmasry%' THEN 'MAHMOUD_ELMASRY_ABDELKARIM_ZAHRAN_NO_PASSPORT.jpeg'
    WHEN name_en ILIKE '%syed roshaan%' THEN 'syed_roshaan_e_haider_abbas_jafri_NO_PASSPORT.png'
  END || 
  ' → NEW: ' ||
  LOWER(REPLACE(REPLACE(name_en, ' ', '_'), '-', '_')) || '_' || 
  LOWER(REPLACE(passport_number, ' ', '_')) || 
  CASE 
    WHEN name_en ILIKE '%abdelrhman%' THEN '.jpeg'
    WHEN name_en ILIKE '%haider ali%' THEN '.jpeg'
    WHEN name_en ILIKE '%husnain sohail%' THEN '.jpeg'
    WHEN name_en ILIKE '%mahmoud elmasry%' THEN '.jpeg'
    WHEN name_en ILIKE '%syed roshaan%' THEN '.png'
  END as rename_command
FROM promoters
WHERE 
  (name_en ILIKE '%abdelrhman ahmed hassan abdelmoniem hassan%'
    OR name_en ILIKE '%haider ali gulam abbas merchant%'
    OR name_en ILIKE '%husnain sohail butt%'
    OR name_en ILIKE '%MAHMOUD ELMASRY%'
    OR name_en ILIKE '%mahmoud elmasry%'
    OR name_en ILIKE '%syed roshaan%')
  AND passport_number IS NOT NULL
  AND passport_number != ''
ORDER BY name_en;

