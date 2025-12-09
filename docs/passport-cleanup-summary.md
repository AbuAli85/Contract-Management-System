# Passport URL Cleanup Summary

## Current Status

Based on your verification query results:

- **Total Promoters**: 181
- **Valid Passport URLs**: 32 ✅
- **Null Passport URLs**: 108 ✅ (correct - no passport image)
- **Remaining Placeholders**: 41 ⚠️ (should be cleaned up)

## Action Required

### Step 1: Clean Up NO_PASSPORT Placeholders

The 41 remaining `NO_PASSPORT` placeholders should be set to `NULL` for clarity. This makes it explicit that no passport image exists, rather than having a placeholder URL.

**Run this script**: `scripts/cleanup-no-passport-placeholders.sql`

**Preview first** (safe - read-only):

```sql
SELECT id, name_en, passport_url
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%'
ORDER BY name_en;
```

**Then execute cleanup**:

```sql
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE passport_url LIKE '%NO_PASSPORT%';
```

**Expected result after cleanup**:

- Valid Passport URLs: 32 ✅
- Null Passport URLs: 149 ✅ (108 + 41)
- Remaining Placeholders: 0 ✅

### Step 2: Verify Valid Passport URLs

Verify that the 32 valid passport URLs are correctly assigned to their promoters.

**Run this script**: `scripts/verify-valid-passport-urls.sql`

This will check:

- ✅ Name matches in URL
- ✅ Passport number matches in URL
- ⚠️ Potential mismatches

### Step 3: Test Contract Generation

After cleanup, test contract generation:

1. **Test with valid passport** (one of the 32):
   - Select a promoter with a valid passport URL
   - Generate a contract
   - Verify passport image appears correctly in PDF

2. **Test with null passport** (one of the 149):
   - Select a promoter with NULL passport_url
   - Generate a contract
   - Verify contract generates successfully without passport image

## Benefits of Cleanup

1. **Clearer Data**: NULL explicitly means "no image" vs placeholder URL
2. **Better Filtering**: Code already filters NO_PASSPORT, but NULL is cleaner
3. **Easier Queries**: Can use `IS NULL` instead of pattern matching
4. **Consistent State**: All promoters either have valid URLs or NULL

## Verification Queries

### Check cleanup was successful:

```sql
SELECT
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN passport_url IS NOT NULL AND passport_url NOT LIKE '%NO_PASSPORT%' THEN 1 END) as valid_passport_urls,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as null_passport_urls,
  COUNT(CASE WHEN passport_url LIKE '%NO_PASSPORT%' THEN 1 END) as remaining_placeholders
FROM promoters;
```

### List promoters needing passport images:

```sql
SELECT
  name_en,
  passport_number,
  passport_url
FROM promoters
WHERE passport_number IS NOT NULL
  AND passport_url IS NULL
ORDER BY name_en;
```

## Next Steps After Cleanup

1. ✅ **Cleanup complete** - All NO_PASSPORT placeholders set to NULL
2. ✅ **Verify valid URLs** - Check the 32 valid passport URLs are correct
3. ✅ **Test generation** - Verify contracts generate correctly
4. 📝 **Document missing images** - Note which promoters need passport images uploaded

## Related Files

- `scripts/cleanup-no-passport-placeholders.sql` - Cleanup script
- `scripts/verify-valid-passport-urls.sql` - Verification script
- `scripts/fix-passport-urls-analysis.sql` - Full analysis script
- `docs/passport-url-fix-guide.md` - Detailed fix guide
