# Passport URL Fix Guide

## Problem Summary

Based on the analysis of passport URLs in your database:

1. **Many NO_PASSPORT placeholders** - These are placeholder images that should be filtered out
2. **Some mismatched URLs** - Wrong passport images assigned to wrong promoters
3. **Missing passport images** - Some promoters have passport numbers but no images

## Current Status

From the data provided:
- ✅ **~30 promoters** have real passport images (with passport numbers in filename)
- ⚠️ **~50+ promoters** have NO_PASSPORT placeholders (will be filtered out automatically)
- ❌ **Some mismatched** passport URLs (wrong files assigned)

## Automatic Filtering

The code now automatically:
1. ✅ Filters out `NO_PASSPORT` placeholders
2. ✅ Filters out `NO_ID_CARD` placeholders  
3. ✅ Validates URL format
4. ✅ Normalizes partial URLs to full Supabase URLs

## Manual Fixes Needed

### Fix 1: Set NO_PASSPORT Placeholders to NULL

**Why**: Setting them to NULL makes it clearer that no passport image exists, rather than having a placeholder URL.

**SQL Fix**:
```sql
UPDATE promoters
SET passport_url = NULL
WHERE passport_url LIKE '%NO_PASSPORT%';
```

### Fix 2: Fix Mismatched Passport URLs

**Identified Issues**:

1. **"vishnu dathan binu"** has `Muhammad_qamar_fd4227081.png` (wrong file)
   - Should be: `vishnu_dathan_binu_t9910557.png`

2. **"ahtisham ul haq"** has `vishnu_dathan_binu_t9910557.png` (wrong file)
   - Need to find the correct file for this promoter

**SQL Fix**:
```sql
-- Fix vishnu dathan binu
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/vishnu_dathan_binu_t9910557.png'
WHERE name_en = 'vishnu dathan binu'
  AND passport_number = 't9910557';

-- Fix ahtisham ul haq (update with correct filename when found)
-- UPDATE promoters
-- SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/[correct_filename]'
-- WHERE name_en = 'ahtisham ul haq';
```

### Fix 3: Verify Image Files Exist

**Check if image files actually exist in Supabase storage**:

1. Go to Supabase Dashboard → Storage → `promoter-documents` bucket
2. Verify the files listed in passport_url actually exist
3. Check file sizes - very small files (< 10KB) might be corrupted or error pages

## Testing After Fixes

### Step 1: Run Analysis Script

Run the SQL script `scripts/fix-passport-urls-analysis.sql` to see current status:

```sql
-- This will show:
-- - Total promoters with passport URLs
-- - Number of NO_PASSPORT placeholders
-- - Number of real passport images
-- - Mismatched URLs
```

### Step 2: Test Contract Generation

1. Generate a contract for a promoter with a real passport image
2. Check server logs for:
   ```
   📸 Passport URL from database: { raw_url, is_full_url, ... }
   ✅ Passport URL after validation: { final_url, is_valid, ... }
   ```
3. Verify the passport image appears correctly in the generated PDF

### Step 3: Test with NO_PASSPORT Promoters

1. Generate a contract for a promoter with NO_PASSPORT placeholder
2. Verify in logs:
   ```
   ⚠️ Placeholder document detected in URL, skipping image
   ```
3. Verify the contract generates without passport image (or uses placeholder)

## Prevention

### When Uploading New Passport Images

1. **Always use the document upload feature** in the Promoters page
2. **Verify the uploaded image** displays correctly before saving
3. **Check the generated URL** matches the promoter's name and passport number
4. **Don't upload placeholder images** - leave passport_url as NULL if no image exists

### Database Maintenance

Run this query periodically to check for issues:

```sql
SELECT 
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_url LIKE '%NO_PASSPORT%' THEN 'Placeholder'
    WHEN passport_url IS NULL THEN 'Missing'
    WHEN passport_url LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND passport_url LIKE '%' || passport_number || '%' 
    THEN 'Valid'
    ELSE 'Mismatch'
  END as status
FROM promoters
WHERE passport_number IS NOT NULL
ORDER BY status, name_en;
```

## Expected Behavior After Fixes

1. ✅ **Promoters with real passport images**: Image appears in generated contracts
2. ✅ **Promoters with NO_PASSPORT**: No passport image in contract (filtered out)
3. ✅ **Promoters with NULL passport_url**: No passport image in contract
4. ✅ **Mismatched URLs**: Fixed manually, then work correctly

## Related Files

- `app/api/contracts/makecom/generate/route.ts` - Contract generation with URL validation
- `scripts/fix-passport-urls-analysis.sql` - Analysis and fix SQL script
- `docs/passport-image-fix.md` - Technical documentation

