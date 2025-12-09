# How to Execute the Passport URL Cleanup

## Current Status

- ✅ Valid Passport URLs: 32
- ⚠️ NO_PASSPORT Placeholders: 41 (need to clean up)
- ✅ Null Passport URLs: 108

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Run Preview Query (Safe - Read Only)

Copy and paste this query to see what will be changed:

```sql
SELECT
  id,
  name_en,
  passport_number,
  passport_url,
  'Will be set to NULL' as action
FROM promoters
WHERE passport_url LIKE '%NO_PASSPORT%'
ORDER BY name_en;
```

**Review the results** - You should see 41 rows with NO_PASSPORT in the URL.

### Step 3: Execute the Cleanup

Copy and paste this query to perform the cleanup:

```sql
UPDATE promoters
SET
  passport_url = NULL,
  updated_at = NOW()
WHERE passport_url LIKE '%NO_PASSPORT%';
```

**Click "Run"** to execute.

### Step 4: Verify the Cleanup

Run this verification query:

```sql
SELECT
  'FINAL STATUS' as section,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN passport_url IS NOT NULL AND passport_url NOT LIKE '%NO_PASSPORT%' THEN 1 END) as valid_passport_urls,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as null_passport_urls,
  COUNT(CASE WHEN passport_url LIKE '%NO_PASSPORT%' THEN 1 END) as remaining_placeholders
FROM promoters;
```

**Expected Results After Cleanup:**

- ✅ Total Promoters: 181
- ✅ Valid Passport URLs: 32
- ✅ Null Passport URLs: 149 (108 + 41)
- ✅ Remaining Placeholders: 0

## Alternative: Use the Script File

You can also use the provided script file:

1. Open `scripts/cleanup-no-passport-placeholders-EXECUTE.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Review the preview results
5. Uncomment the UPDATE statement (remove `/*` and `*/`)
6. Run the query

## What This Does

- Sets all `NO_PASSPORT` placeholder URLs to `NULL`
- Updates the `updated_at` timestamp
- Makes the data cleaner and easier to query
- The code already filters out NO_PASSPORT, but NULL is clearer

## Safety Notes

- ✅ **Safe to run** - Only affects URLs containing "NO_PASSPORT"
- ✅ **Reversible** - You can restore if needed (though not necessary)
- ✅ **No data loss** - These are placeholder images, not real passport images
- ✅ **Preview first** - Always review the preview query results

## After Cleanup

Once cleanup is complete:

1. ✅ Run `scripts/verify-valid-passport-urls.sql` to verify the 32 valid URLs
2. ✅ Test contract generation with a promoter that has a valid passport
3. ✅ Test contract generation with a promoter that has NULL passport_url

## Troubleshooting

### If you see errors:

1. **Permission Error**: Make sure you're using a user with UPDATE permissions
2. **Syntax Error**: Check that you copied the entire UPDATE statement
3. **No Rows Affected**: Check that the WHERE clause matches your data

### If remaining_placeholders is still > 0:

Check for case variations:

```sql
SELECT passport_url
FROM promoters
WHERE passport_url ILIKE '%no_passport%'
   OR passport_url ILIKE '%no-passport%';
```

Then update accordingly:

```sql
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE passport_url ILIKE '%no_passport%'
   OR passport_url ILIKE '%no-passport%';
```
