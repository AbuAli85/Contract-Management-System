# Passport Image Fix - Contract Generation

## Problem

Passport images in generated contracts are showing as black images with error text instead of the actual passport image.

## Root Causes

1. **Partial URLs**: Passport URLs stored in database might be partial (just filenames) instead of full public Supabase URLs
2. **Broken Image Files**: The actual image file might be corrupted, a screenshot, or an error page
3. **Invalid URLs**: URLs might point to non-existent or inaccessible files

## Solution Implemented

### 1. URL Normalization

Added `normalizeSupabaseUrl()` function that:

- Converts partial URLs (just filenames) to full public Supabase storage URLs
- Preserves already-full URLs
- Handles different URL formats

### 2. Enhanced Validation

Enhanced `ensureValidUrl()` function now:

- Normalizes Supabase storage URLs automatically
- Detects placeholder images (NO_PASSPORT, NO_ID_CARD)
- Detects broken image patterns (screenshot, placeholder, error messages)
- Validates URL format and protocol

### 3. Better Logging

Added detailed logging to track:

- Raw passport URL from database
- URL normalization process
- Final validated URL
- Reasons for URL rejection

## How to Verify the Fix

### Step 1: Check Server Logs

When generating a contract, check the server logs for:

```
📸 Passport URL from database: { raw_url, is_full_url, contains_placeholder, url_length }
✅ Normalized image URL: https://...
✅ Passport URL after validation: { final_url, is_valid, url_type }
```

### Step 2: Verify Passport URLs in Database

Run this SQL query to check passport URLs:

```sql
SELECT
  name_en,
  passport_number,
  passport_url,
  CASE
    WHEN passport_url IS NULL THEN 'MISSING'
    WHEN passport_url LIKE 'https://%' THEN 'FULL_URL'
    ELSE 'PARTIAL_URL'
  END as url_type,
  CASE
    WHEN passport_url LIKE '%NO_PASSPORT%' THEN 'PLACEHOLDER'
    WHEN passport_url LIKE '%placeholder%' THEN 'PLACEHOLDER'
    ELSE 'REAL_IMAGE'
  END as image_type
FROM promoters
WHERE passport_url IS NOT NULL
ORDER BY name_en;
```

### Step 3: Test Image Accessibility

For each passport URL, verify the image is accessible:

1. Copy the URL from the database
2. Open it in a browser
3. Verify it shows the actual passport image (not a screenshot or error)

## Fixing Broken Passport Images

### Option 1: Re-upload the Passport Image

1. Go to the Promoters page
2. Find the promoter with the broken passport image
3. Click "Edit Details" or use the document upload dialog
4. Upload a new passport image
5. Verify the new URL is correct

### Option 2: Fix URLs in Database

If you have the correct image filename in Supabase storage:

```sql
-- Replace [PROJECT_ID] with your Supabase project ID
-- Replace [filename] with the actual filename
UPDATE promoters
SET passport_url = 'https://[PROJECT_ID].supabase.co/storage/v1/object/public/promoter-documents/[filename]'
WHERE id = '[promoter_id]';
```

### Option 3: Bulk Fix Partial URLs

If many promoters have partial URLs:

```sql
-- Replace [PROJECT_ID] with your Supabase project ID
UPDATE promoters
SET passport_url = 'https://[PROJECT_ID].supabase.co/storage/v1/object/public/promoter-documents/' || passport_url
WHERE passport_url IS NOT NULL
  AND passport_url NOT LIKE 'https://%'
  AND passport_url NOT LIKE '%NO_PASSPORT%';
```

## Testing the Fix

1. **Generate a Test Contract**:
   - Go to `/en/generate-contract`
   - Select a promoter with a passport image
   - Generate the contract
   - Check the server logs for URL processing

2. **Verify in Generated PDF**:
   - Download the generated PDF
   - Check if passport image appears correctly
   - If still broken, check the logs for the exact URL used

3. **Check Make.com Logs** (if using Make.com):
   - Check Make.com scenario execution logs
   - Look for image download/upload errors
   - Verify the passport URL being used

## Common Issues and Solutions

### Issue: "Passport URL was filtered out during validation"

**Cause**: URL contains placeholder or broken image pattern  
**Solution**: Re-upload the passport image or fix the URL in database

### Issue: "Invalid URL format"

**Cause**: URL is malformed or partial  
**Solution**: The normalization function should fix this automatically, but verify the URL format

### Issue: Image shows as black box with error text

**Cause**: The actual image file is corrupted or is a screenshot  
**Solution**: Re-upload the actual passport image file

### Issue: "Normalized image URL" but still broken

**Cause**: Image file doesn't exist in Supabase storage  
**Solution**: Verify the file exists in the `promoter-documents` bucket

## Prevention

1. **Always use the document upload feature** - This ensures URLs are properly formatted
2. **Verify images after upload** - Check that uploaded images display correctly
3. **Regular database checks** - Run the verification SQL query periodically
4. **Monitor logs** - Watch for URL validation warnings in server logs

## Related Files

- `app/api/contracts/makecom/generate/route.ts` - Main contract generation logic
- `lib/promoter-file-upload.ts` - File upload utilities
- `components/promoters/promoter-document-upload-dialog.tsx` - Upload UI component
