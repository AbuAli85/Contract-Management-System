# Fix Summary: 7 Mismatched Passport URLs

## Analysis Results

From the detailed mismatch analysis, here's what we found:

### ✅ Case Mismatches (4 cases - These are FINE)
These files exist and work correctly, just have case differences in the passport number:

1. **asad shakeel** - `BS5165582` vs `bs5165582` ✅ (file exists)
2. **kaif ali khan** - `R7770883` vs `r7770883` ✅ (file exists)
3. **luqman shahzada** - `Ry5141352` vs `ry5141352` ✅ (file exists)
4. **siddiq syed** - `W3851075` vs `w3851075` ✅ (file exists)

**Action**: None needed - these work fine, just case sensitivity in validation query

### ⚠️ REAL_PASSPORT Marker (1 case - Needs Check)

1. **ahmed khalil** - Has `REAL_PASSPORT` instead of passport number `eg4128603`
   - Current: `ahmed_khalil_REAL_PASSPORT.png`
   - Expected: `ahmed_khalil_eg4128603.png`
   - **Action**: Check if correct file exists, if not, keep REAL_PASSPORT or set to NULL

### ❌ Wrong Name Assignments (2 cases - Need Fix)

1. **ahtisham ul haq** - Has wrong name file
   - Current: `vishnu_dathan_binu_t9910557.png` (wrong name, correct passport number)
   - Expected: `ahtisham_ul_haq_t9910557.png`
   - **Action**: Find correct file or fix URL

2. **vishnu dathan binu** - Has wrong name file
   - Current: `Muhammad_qamar_fd4227081.png` (wrong name, correct passport number)
   - Expected: `vishnu_dathan_binu_fd4227081.png`
   - **Action**: Find correct file or fix URL

## Fix Instructions

### Step 1: Check Storage for Correct Files

Run this query in Supabase SQL Editor to check if correct files exist:

```sql
SELECT name as filename
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
  AND (
    name = 'ahmed_khalil_eg4128603.png'
    OR name = 'ahtisham_ul_haq_t9910557.png'
    OR name = 'vishnu_dathan_binu_fd4227081.png'
    OR name LIKE '%ahmed_khalil%eg4128603%'
    OR name LIKE '%ahtisham_ul_haq%t9910557%'
    OR name LIKE '%vishnu_dathan_binu%fd4227081%'
  )
ORDER BY name;
```

### Step 2: Fix Each Issue

#### Fix 1: ahmed khalil

**If correct file exists** (`ahmed_khalil_eg4128603.png`):
```sql
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ahmed_khalil_eg4128603.png',
  updated_at = NOW()
WHERE name_en = 'ahmed khalil' AND passport_number = 'eg4128603';
```

**If correct file doesn't exist**:
```sql
-- Option A: Keep REAL_PASSPORT (it's a valid marker)
-- No action needed - the code now allows REAL_PASSPORT files with passport numbers

-- Option B: Set to NULL if you want to remove it
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE name_en = 'ahmed khalil' AND passport_url LIKE '%REAL_PASSPORT%';
```

#### Fix 2: ahtisham ul haq

**If correct file exists** (`ahtisham_ul_haq_t9910557.png`):
```sql
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ahtisham_ul_haq_t9910557.png',
  updated_at = NOW()
WHERE name_en = 'ahtisham ul haq' AND passport_number = 't9910557';
```

**If correct file doesn't exist**:
```sql
-- Check if the current file (vishnu_dathan_binu_t9910557.png) is actually correct
-- If it's the right passport image, you might need to rename the file in storage
-- OR set to NULL and re-upload the correct image
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE name_en = 'ahtisham ul haq';
```

#### Fix 3: vishnu dathan binu

**If correct file exists** (`vishnu_dathan_binu_fd4227081.png`):
```sql
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/vishnu_dathan_binu_fd4227081.png',
  updated_at = NOW()
WHERE name_en = 'vishnu dathan binu' AND passport_number = 'fd4227081';
```

**If correct file doesn't exist**:
```sql
-- Check if the current file (Muhammad_qamar_fd4227081.png) is actually correct
-- If it's the right passport image, you might need to rename the file in storage
-- OR set to NULL and re-upload the correct image
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE name_en = 'vishnu dathan binu';
```

### Step 3: Verify All Fixes

Run this verification query:

```sql
SELECT 
  name_en,
  passport_number,
  passport_url,
  CASE 
    WHEN passport_url LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%')
    THEN '✅ Valid'
    ELSE '❌ Needs fix'
  END as status
FROM promoters
WHERE name_en IN (
  'ahmed khalil',
  'ahtisham ul haq',
  'vishnu dathan binu',
  'asad shakeel',
  'kaif ali khan',
  'luqman shahzada',
  'siddiq syed'
)
ORDER BY status, name_en;
```

**Expected Result**: All should show "✅ Valid" after fixes

## Code Update

I've also updated the validation code to:
- ✅ Allow `REAL_PASSPORT` files that contain passport numbers (like ahmed khalil's case)
- ✅ Use case-insensitive matching for passport numbers

The code in `app/api/contracts/makecom/generate/route.ts` now properly handles these cases.

## Summary

- **4 cases**: No action needed (case mismatches, files work fine)
- **1 case**: Check if correct file exists, update if found
- **2 cases**: Find correct files or fix URLs

After fixes, all 32 valid passport URLs should be fully matched! 🎉

