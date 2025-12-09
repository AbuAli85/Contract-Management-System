# Fix Mismatched Passport URLs Guide

## Current Status

From the verification results:

- ✅ **25 fully matched URLs** - These are correct, no action needed
- ⚠️ **7 potentially mismatched URLs** - Need review and possible fixes

## What Are Mismatched URLs?

A mismatched passport URL means:

- ❌ The filename doesn't contain the promoter's name, OR
- ❌ The filename doesn't contain the promoter's passport number

## Step-by-Step Fix Process

### Step 1: Identify the 7 Mismatched URLs

Run the script: `scripts/fix-mismatched-passport-urls.sql`

This will show you:

- Which promoters have mismatched URLs
- What the issue is (name mismatch, passport number mismatch, or both)
- What the filename currently is
- What it should contain

### Step 2: Check Storage for Correct Files

For each mismatched URL, you need to:

1. **Check if the correct file exists in Supabase storage**
   - Go to Supabase Dashboard → Storage → `promoter-documents` bucket
   - Look for files matching: `[promoter_name]_[passport_number].png` (or .jpeg)

2. **Or use the SQL query** (uncomment in the script):
   ```sql
   SELECT name as filename
   FROM storage.objects
   WHERE bucket_id = 'promoter-documents'
     AND name LIKE '%[promoter_name]%'
     AND name LIKE '%[passport_number]%';
   ```

### Step 3: Fix Each Mismatched URL

For each mismatched URL, you have three options:

#### Option A: Correct File Exists in Storage

If you find the correct file in storage:

```sql
UPDATE promoters
SET
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/[correct_filename]',
  updated_at = NOW()
WHERE name_en = '[promoter_name]';
```

#### Option B: Current File is Actually Correct

If the current file is correct but the name/passport number in database is wrong:

- Update the promoter's name or passport number in the database
- OR leave the URL as-is if it's actually the right image

#### Option C: File Doesn't Exist

If the correct file doesn't exist:

- Set passport_url to NULL (no image available)
- OR upload the correct passport image through the Promoters page

```sql
UPDATE promoters
SET
  passport_url = NULL,
  updated_at = NOW()
WHERE name_en = '[promoter_name]';
```

### Step 4: Verify Fixes

After fixing each URL, verify:

```sql
SELECT
  name_en,
  passport_number,
  passport_url,
  CASE
    WHEN passport_url LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%'
         AND (passport_number IS NULL OR passport_url LIKE '%' || passport_number || '%')
    THEN '✅ Valid'
    ELSE '❌ Still mismatched'
  END as status
FROM promoters
WHERE passport_url IS NOT NULL
  AND passport_url NOT LIKE '%NO_PASSPORT%'
ORDER BY status, name_en;
```

## Common Scenarios

### Scenario 1: Name Mismatch

**Example**: Promoter "John Doe" but URL has "jane_smith_passport.png"

**Fix**: Find the correct file or update the URL:

```sql
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/john_doe_passport123.png'
WHERE name_en = 'John Doe';
```

### Scenario 2: Passport Number Mismatch

**Example**: Promoter has passport number "AB1234567" but URL has "CD9876543"

**Fix**: Find the file with correct passport number:

```sql
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/john_doe_AB1234567.png'
WHERE name_en = 'John Doe' AND passport_number = 'AB1234567';
```

### Scenario 3: Both Name and Passport Number Mismatch

**Example**: Completely wrong file assigned

**Fix**: Find the correct file or set to NULL:

```sql
-- If correct file exists:
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/correct_filename.png'
WHERE name_en = 'John Doe';

-- If correct file doesn't exist:
UPDATE promoters
SET passport_url = NULL
WHERE name_en = 'John Doe';
```

## Verification After All Fixes

Run this final check:

```sql
SELECT
  'FINAL VERIFICATION' as section,
  COUNT(*) as total_valid_urls,
  COUNT(CASE
    WHEN passport_url LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%'
         AND (passport_number IS NULL OR passport_url LIKE '%' || passport_number || '%')
    THEN 1
  END) as fully_matched_urls,
  COUNT(CASE
    WHEN passport_url NOT LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%'
         OR (passport_number IS NOT NULL AND passport_url NOT LIKE '%' || passport_number || '%')
    THEN 1
  END) as remaining_mismatched_urls
FROM promoters
WHERE passport_url IS NOT NULL
  AND passport_url NOT LIKE '%NO_PASSPORT%';
```

**Expected Result After Fixes**:

- Total Valid URLs: 32
- Fully Matched URLs: 32 (all 25 + 7 fixed)
- Remaining Mismatched URLs: 0

## Prevention

To prevent future mismatches:

1. ✅ **Always use the document upload feature** - Ensures correct file assignment
2. ✅ **Verify after upload** - Check that the URL matches the promoter's name
3. ✅ **Regular audits** - Run verification queries periodically
4. ✅ **Don't manually edit URLs** - Use the upload feature instead

## Related Files

- `scripts/fix-mismatched-passport-urls.sql` - Identification and fix script
- `scripts/verify-valid-passport-urls.sql` - Verification script
- `docs/passport-url-fix-guide.md` - General passport URL fix guide
