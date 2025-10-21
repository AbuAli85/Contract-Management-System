-- Bulk Update Promoter Emails
-- Use this script to update multiple promoter emails at once
-- 
-- IMPORTANT: This is a TEMPLATE. You must provide the actual email addresses.
-- DO NOT run this script without proper data and review!

-- =============================================================================
-- OPTION 1: Update Individual Promoters (if you have a small number)
-- =============================================================================

-- Template for individual updates:
-- UPDATE promoters 
-- SET email = 'actual-email@example.com', updated_at = NOW()
-- WHERE id = 'promoter-id-from-database';

-- Example with name verification (SAFER):
-- UPDATE promoters 
-- SET email = 'john.doe@example.com', updated_at = NOW()
-- WHERE name_en = 'John Doe' AND id_card_number = '12345678'
-- RETURNING id, name_en, email; -- Shows what was updated

-- =============================================================================
-- OPTION 2: Bulk Update from Temporary Table (if you have many emails)
-- =============================================================================

-- Step 1: Create a temporary table with your email data
-- (You'll need to populate this with actual data)
/*
CREATE TEMP TABLE temp_promoter_emails (
  promoter_id UUID,
  promoter_name TEXT,
  email_address TEXT
);

-- Step 2: Insert your data (replace with actual values)
-- You can prepare this in Excel/CSV and convert to INSERT statements
INSERT INTO temp_promoter_emails (promoter_id, promoter_name, email_address) VALUES
('your-uuid-1', 'Promoter Name 1', 'email1@example.com'),
('your-uuid-2', 'Promoter Name 2', 'email2@example.com'),
('your-uuid-3', 'Promoter Name 3', 'email3@example.com');
-- Add more rows as needed...

-- Step 3: Preview the updates (ALWAYS DO THIS FIRST!)
SELECT 
  p.id,
  p.name_en as current_name,
  p.email as current_email,
  t.email_address as new_email,
  CASE 
    WHEN p.email IS NULL OR TRIM(p.email) = '' THEN 'Will add email'
    ELSE 'Will update email'
  END as action
FROM promoters p
INNER JOIN temp_promoter_emails t ON p.id = t.promoter_id;

-- Step 4: If preview looks good, perform the update
UPDATE promoters p
SET 
  email = t.email_address,
  updated_at = NOW()
FROM temp_promoter_emails t
WHERE p.id = t.promoter_id
RETURNING p.id, p.name_en, p.email; -- Shows what was updated

-- Step 5: Clean up
DROP TABLE temp_promoter_emails;
*/

-- =============================================================================
-- OPTION 3: Update Using ID Card Number or Name (if you don't have UUIDs)
-- =============================================================================

/*
-- If you have a list of ID card numbers and emails:
CREATE TEMP TABLE temp_emails_by_id_card (
  id_card_number TEXT,
  email_address TEXT
);

-- Insert your data
INSERT INTO temp_emails_by_id_card (id_card_number, email_address) VALUES
('12345678', 'email1@example.com'),
('87654321', 'email2@example.com');

-- Preview
SELECT 
  p.id,
  p.name_en,
  p.id_card_number,
  p.email as current_email,
  t.email_address as new_email
FROM promoters p
INNER JOIN temp_emails_by_id_card t ON p.id_card_number = t.id_card_number;

-- Update
UPDATE promoters p
SET email = t.email_address, updated_at = NOW()
FROM temp_emails_by_id_card t
WHERE p.id_card_number = t.id_card_number
RETURNING p.id, p.name_en, p.id_card_number, p.email;

DROP TABLE temp_emails_by_id_card;
*/

-- =============================================================================
-- OPTION 4: Generate Template Email Addresses (TEMPORARY SOLUTION ONLY!)
-- =============================================================================

-- WARNING: This is NOT recommended for production!
-- Only use this if you need a temporary email pattern while collecting real emails
/*
UPDATE promoters
SET email = LOWER(REPLACE(COALESCE(name_en, 'promoter'), ' ', '.')) || '@temporary.local',
    updated_at = NOW()
WHERE email IS NULL OR TRIM(email) = '';

-- This would create emails like:
-- 'John Doe' → 'john.doe@temporary.local'
-- 'Jane Smith' → 'jane.smith@temporary.local'

-- You MUST replace these with real emails later!
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- After updates, verify the results:

-- Count promoters with emails now
SELECT 
  COUNT(*) FILTER (WHERE email IS NOT NULL AND TRIM(email) != '') as with_email,
  COUNT(*) FILTER (WHERE email IS NULL OR TRIM(email) = '') as without_email,
  COUNT(*) as total
FROM promoters;

-- Show recent updates
SELECT 
  id,
  name_en,
  email,
  updated_at
FROM promoters
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 20;

-- Validate email formats
SELECT 
  id,
  name_en,
  email
FROM promoters
WHERE 
  email IS NOT NULL 
  AND TRIM(email) != ''
  AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
ORDER BY name_en;

-- =============================================================================
-- NOTES FOR DATA COLLECTION
-- =============================================================================

/*
To collect emails from promoters, you can:

1. Export promoter list to Excel:
   SELECT id, name_en, name_ar, id_card_number, mobile_number, phone
   FROM promoters
   WHERE email IS NULL OR TRIM(email) = ''
   ORDER BY name_en;

2. Add an "email" column to the Excel file

3. Contact each promoter (via phone) to collect their email

4. Convert the Excel data to SQL INSERT statements

5. Use Option 2 above to bulk update

IMPORTANT: 
- Always validate email format before inserting
- Keep a backup of the data before running updates
- Test with a small batch first (5-10 records)
- Verify the updates worked correctly before proceeding with all records
*/

-- =============================================================================
-- ROLLBACK PLAN (if something goes wrong)
-- =============================================================================

/*
-- If you need to rollback email updates, you can:

-- 1. If you're in a transaction:
ROLLBACK;

-- 2. If already committed, clear specific emails:
UPDATE promoters 
SET email = NULL, updated_at = NOW()
WHERE email LIKE '%@temporary.local'; -- Or whatever pattern you used

-- 3. Restore from backup (if you made one):
-- Use your backup restoration process
*/

