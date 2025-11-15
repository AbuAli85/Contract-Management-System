# Fix Guide: Final 3 Passport URLs

## Current Status

✅ **4 cases fixed** - Case mismatches are now recognized as valid  
❌ **3 cases remaining** - Need manual fixes

## The 3 Remaining Cases

### 1. ahmed khalil
- **Current**: `ahmed_khalil_REAL_PASSPORT.png`
- **Expected**: `ahmed_khalil_eg4128603.png`
- **Issue**: Has REAL_PASSPORT marker instead of passport number

### 2. ahtisham ul haq
- **Current**: `vishnu_dathan_binu_t9910557.png` (wrong name)
- **Expected**: `ahtisham_ul_haq_t9910557.png`
- **Issue**: File has wrong promoter name

### 3. vishnu dathan binu
- **Current**: `Muhammad_qamar_fd4227081.png` (wrong name)
- **Expected**: `vishnu_dathan_binu_fd4227081.png`
- **Issue**: File has wrong promoter name

## Fix Steps

### Step 1: Check Storage for Correct Files

Run this query to see if correct files exist:

```sql
SELECT name as filename
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
  AND (
    name LIKE '%ahmed_khalil%eg4128603%'
    OR name LIKE '%ahtisham_ul_haq%t9910557%'
    OR name LIKE '%vishnu_dathan_binu%fd4227081%'
  )
ORDER BY name;
```

### Step 2: Fix Each Case

#### Fix 1: ahmed khalil

**If correct file exists** (`ahmed_khalil_eg4128603.png` or `.jpeg`):
```sql
UPDATE promoters
SET 
  passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/ahmed_khalil_eg4128603.png',
  updated_at = NOW()
WHERE name_en = 'ahmed khalil' AND passport_number = 'eg4128603';
```

**If REAL_PASSPORT file is actually correct** (contains the real passport image):
- The code now accepts REAL_PASSPORT files with passport numbers
- But the verification query needs updating (see Step 3)
- OR: Rename the file in storage to include the passport number

**If no correct file exists**:
```sql
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE name_en = 'ahmed khalil';
-- Then re-upload through Promoters page
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

**If current file is actually correct** (vishnu_dathan_binu_t9910557.png is actually ahtisham's passport):
- **Best**: Rename the file in Supabase storage
- **Workaround**: Update URL to current file (keeps wrong filename)
- **Alternative**: Set to NULL and re-upload with correct name

**If no correct file exists**:
```sql
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE name_en = 'ahtisham ul haq';
-- Then re-upload through Promoters page
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

**If current file is actually correct** (Muhammad_qamar_fd4227081.png is actually vishnu's passport):
- **Best**: Rename the file in Supabase storage
- **Workaround**: Update URL to current file (keeps wrong filename)
- **Alternative**: Set to NULL and re-upload with correct name

**If no correct file exists**:
```sql
UPDATE promoters
SET passport_url = NULL, updated_at = NOW()
WHERE name_en = 'vishnu dathan binu';
-- Then re-upload through Promoters page
```

### Step 3: Update Verification Query

The verification query should accept REAL_PASSPORT files with passport numbers. Use this updated query:

```sql
SELECT 
  name_en,
  passport_number,
  passport_url,
  CASE 
    -- Standard validation: name and passport number match (case-insensitive)
    WHEN LOWER(passport_url) LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%')
    THEN '✅ Valid'
    -- REAL_PASSPORT files: if they contain the passport number, they're valid
    WHEN LOWER(passport_url) LIKE '%real_passport%' 
         AND passport_number IS NOT NULL
         AND LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%'
    THEN '✅ Valid (REAL_PASSPORT with passport number)'
    ELSE '❌ Needs fix'
  END as status
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%'
ORDER BY status, name_en;
```

## Recommended Approach

### For ahmed khalil (REAL_PASSPORT):
1. Check if `ahmed_khalil_eg4128603.png` exists
2. If yes → Update URL to correct file
3. If no → Check if REAL_PASSPORT file is actually the passport image
   - If yes → Keep it (code accepts it) OR rename file in storage
   - If no → Set to NULL and re-upload

### For ahtisham ul haq & vishnu dathan binu (wrong names):
1. Check if correct files exist with correct names
2. If yes → Update URLs to correct files
3. If no → Check if current files are actually correct images
   - If yes → **Best**: Rename files in storage to correct names
   - **Alternative**: Set to NULL and re-upload with correct names

## After All Fixes

Run final verification:

```sql
SELECT 
  COUNT(*) as total_valid_urls,
  COUNT(CASE 
    WHEN LOWER(passport_url) LIKE '%' || LOWER(REPLACE(name_en, ' ', '_')) || '%' 
         AND (passport_number IS NULL OR LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%')
    THEN 1 
    WHEN LOWER(passport_url) LIKE '%real_passport%' 
         AND passport_number IS NOT NULL
         AND LOWER(passport_url) LIKE '%' || LOWER(passport_number) || '%'
    THEN 1
  END) as fully_matched_urls
FROM promoters
WHERE passport_url IS NOT NULL 
  AND passport_url NOT LIKE '%NO_PASSPORT%';
```

**Expected Result**: `fully_matched_urls` = 32 (all valid URLs matched)

## Files Created

- `scripts/fix-final-3-passport-urls.sql` - Complete fix script with all options
- Updated `scripts/verify-valid-passport-urls.sql` - Now accepts REAL_PASSPORT files

