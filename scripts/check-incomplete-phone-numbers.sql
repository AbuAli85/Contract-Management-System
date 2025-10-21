-- Check for Incomplete or Invalid Phone Numbers in Promoters Table
-- This script identifies phone numbers that appear incomplete (e.g., just country codes like "00968")

-- =============================================================================
-- SECTION 1: Count promoters with incomplete phone numbers
-- =============================================================================

SELECT 
  COUNT(*) FILTER (
    WHERE 
      (phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) <= 4)
      OR (mobile_number IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_number, '[^0-9]', '', 'g')) <= 4)
  ) as incomplete_phone_count,
  COUNT(*) FILTER (
    WHERE 
      (phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) BETWEEN 5 AND 9)
      OR (mobile_number IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_number, '[^0-9]', '', 'g')) BETWEEN 5 AND 9)
  ) as suspicious_phone_count,
  COUNT(*) FILTER (
    WHERE 
      (phone IS NULL OR phone = '') 
      AND (mobile_number IS NULL OR mobile_number = '')
  ) as no_phone_count,
  COUNT(*) as total_promoters
FROM promoters;

-- =============================================================================
-- SECTION 2: List promoters with incomplete phone numbers (likely just country code)
-- =============================================================================

SELECT 
  id,
  COALESCE(name_en, name_ar, 'Unnamed') as name,
  phone,
  LENGTH(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g')) as phone_digits,
  mobile_number,
  LENGTH(REGEXP_REPLACE(COALESCE(mobile_number, ''), '[^0-9]', '', 'g')) as mobile_digits,
  email,
  status,
  created_at,
  'Incomplete - likely just country code' as issue
FROM promoters
WHERE 
  (phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) <= 4)
  OR (mobile_number IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_number, '[^0-9]', '', 'g')) <= 4)
ORDER BY created_at DESC
LIMIT 50;

-- =============================================================================
-- SECTION 3: List promoters with suspicious phone numbers (too short but not just country code)
-- =============================================================================

SELECT 
  id,
  COALESCE(name_en, name_ar, 'Unnamed') as name,
  phone,
  LENGTH(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g')) as phone_digits,
  mobile_number,
  LENGTH(REGEXP_REPLACE(COALESCE(mobile_number, ''), '[^0-9]', '', 'g')) as mobile_digits,
  email,
  status,
  'Suspicious - too short (5-9 digits)' as issue
FROM promoters
WHERE 
  (phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) BETWEEN 5 AND 9)
  OR (mobile_number IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_number, '[^0-9]', '', 'g')) BETWEEN 5 AND 9)
ORDER BY created_at DESC
LIMIT 50;

-- =============================================================================
-- SECTION 4: Common incomplete patterns
-- =============================================================================

-- Group by common incomplete patterns
SELECT 
  CASE 
    WHEN phone ~ '^00968$' OR mobile_number ~ '^00968$' THEN 'Just Oman code (00968)'
    WHEN phone ~ '^968$' OR mobile_number ~ '^968$' THEN 'Just Oman code (968)'
    WHEN phone ~ '^00971$' OR mobile_number ~ '^00971$' THEN 'Just UAE code (00971)'
    WHEN phone ~ '^971$' OR mobile_number ~ '^971$' THEN 'Just UAE code (971)'
    WHEN phone ~ '^00966$' OR mobile_number ~ '^00966$' THEN 'Just Saudi code (00966)'
    WHEN phone ~ '^966$' OR mobile_number ~ '^966$' THEN 'Just Saudi code (966)'
    WHEN phone ~ '^00\d{1,3}$' OR mobile_number ~ '^00\d{1,3}$' THEN 'Country code with 00 prefix'
    WHEN phone ~ '^\+\d{1,3}$' OR mobile_number ~ '^\+\d{1,3}$' THEN 'Country code with + prefix'
    ELSE 'Other incomplete pattern'
  END as pattern_type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT COALESCE(name_en, name_ar, 'Unnamed'), ', ') as example_names
FROM promoters
WHERE 
  (phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) <= 4)
  OR (mobile_number IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_number, '[^0-9]', '', 'g')) <= 4)
GROUP BY pattern_type
ORDER BY count DESC;

-- =============================================================================
-- SECTION 5: Promoters with no contact information at all
-- =============================================================================

SELECT 
  id,
  COALESCE(name_en, name_ar, 'Unnamed') as name,
  id_card_number,
  status,
  employer_id,
  created_at,
  'No contact info - no phone, mobile, or email' as issue
FROM promoters
WHERE 
  (phone IS NULL OR phone = '') 
  AND (mobile_number IS NULL OR mobile_number = '')
  AND (email IS NULL OR email = '')
ORDER BY 
  CASE 
    WHEN status = 'active' THEN 1
    ELSE 2
  END,
  created_at DESC
LIMIT 50;

-- =============================================================================
-- SECTION 6: Summary by status
-- =============================================================================

SELECT 
  status,
  COUNT(*) FILTER (
    WHERE 
      (phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) <= 4)
      OR (mobile_number IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_number, '[^0-9]', '', 'g')) <= 4)
  ) as incomplete_phones,
  COUNT(*) FILTER (
    WHERE 
      (phone IS NULL OR phone = '') 
      AND (mobile_number IS NULL OR mobile_number = '')
  ) as no_phones,
  COUNT(*) as total,
  ROUND(
    COUNT(*) FILTER (
      WHERE 
        (phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) <= 4)
        OR (mobile_number IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_number, '[^0-9]', '', 'g')) <= 4)
    ) * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as incomplete_percentage
FROM promoters
GROUP BY status
ORDER BY incomplete_phones DESC;

-- =============================================================================
-- SECTION 7: Export for manual correction (CSV-ready format)
-- =============================================================================

-- Run this to get a list you can export and fill in correct phone numbers
SELECT 
  id,
  name_en,
  name_ar,
  id_card_number,
  phone as old_phone,
  mobile_number as old_mobile,
  '' as new_phone, -- Fill this in
  '' as new_mobile, -- Fill this in
  email,
  status
FROM promoters
WHERE 
  (phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) <= 9)
  OR (mobile_number IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_number, '[^0-9]', '', 'g')) <= 9)
ORDER BY status, name_en
LIMIT 100;

-- =============================================================================
-- SECTION 8: Sample UPDATE query (DO NOT RUN without proper data!)
-- =============================================================================

/*
-- Template for updating incomplete phone numbers
-- Replace with actual values after collecting correct phone numbers

-- Single update example:
UPDATE promoters 
SET 
  phone = '+968 9123 4567',
  mobile_number = '+968 9876 5432',
  updated_at = NOW()
WHERE id = 'your-promoter-uuid-here'
RETURNING id, name_en, phone, mobile_number;

-- Bulk update example (use with caution):
-- First, create a temp table with corrections
CREATE TEMP TABLE temp_phone_corrections (
  promoter_id UUID,
  new_phone TEXT,
  new_mobile TEXT
);

-- Insert corrections (get these from calling promoters)
INSERT INTO temp_phone_corrections VALUES
('uuid-1', '+968 9123 4567', '+968 9876 5432'),
('uuid-2', '+971 50 123 4567', '+971 50 987 6543');

-- Preview changes
SELECT 
  p.id,
  p.name_en,
  p.phone as old_phone,
  t.new_phone,
  p.mobile_number as old_mobile,
  t.new_mobile
FROM promoters p
JOIN temp_phone_corrections t ON p.id = t.promoter_id;

-- Apply changes (only after reviewing preview!)
UPDATE promoters p
SET 
  phone = t.new_phone,
  mobile_number = t.new_mobile,
  updated_at = NOW()
FROM temp_phone_corrections t
WHERE p.id = t.promoter_id
RETURNING p.id, p.name_en, p.phone, p.mobile_number;

-- Clean up
DROP TABLE temp_phone_corrections;
*/

-- =============================================================================
-- NOTES FOR DATA COLLECTION
-- =============================================================================

/*
To fix incomplete phone numbers:

1. Run Section 2 & 3 to identify promoters with incomplete numbers
2. Export results to Excel/CSV
3. Contact each promoter (via email or in person) to get correct phone number
4. Update the database using the UPDATE template above

IMPORTANT:
- Always include country code (+968 for Oman)
- Minimum 10 digits total (country code + number)
- Example formats:
  * Oman: +968 9123 4567
  * UAE: +971 50 123 4567
  * Saudi: +966 50 123 4567

VALIDATION:
- Before updating, verify the phone number:
  * Has country code
  * Has 10-15 digits total
  * Is not just "00968" or similar incomplete pattern
  * Is not the same as multiple other promoters (likely wrong)
*/

