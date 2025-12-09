# 🧪 Promoter Field Bug - Testing Guide

## Quick Verification (2 minutes)

### Step 1: Check the Fix is Applied ✅

1. Open your browser's developer console (F12)
2. Navigate to: `/en/contracts`
3. Open Network tab and refresh the page
4. Look for the API call to `/api/contracts?page=1&limit=20`
5. Click on it and check the Response tab

**Expected Result:**

```json
{
  "contracts": [
    {
      "promoters": {
        // ✅ Should be an object, not an array
        "id": "...",
        "name_en": "...",
        "name_ar": "..."
      }
    }
  ]
}
```

### Step 2: Visual Verification ✅

1. Look at the contracts table
2. Check the "Promoter" column

**Before Fix:** ❌ All rows show "N/A"  
**After Fix:** ✅ Should show actual promoter names like "John Doe", "Jane Smith", etc.

---

## Comprehensive Testing Checklist

### 1. Contracts Table View

- [ ] **Table Display**
  - [ ] Promoter column shows names (not "N/A")
  - [ ] Both English names display correctly
  - [ ] No JavaScript errors in console
  - [ ] Hover tooltips work correctly

- [ ] **Locale Switching**
  - [ ] Switch to `/ar/contracts` (Arabic)
  - [ ] Promoter names show in Arabic (name_ar)
  - [ ] Switch back to `/en/contracts` (English)
  - [ ] Promoter names show in English (name_en)

- [ ] **Pagination**
  - [ ] Go to page 2, 3, etc.
  - [ ] Promoter names display on all pages
  - [ ] No "N/A" values for contracts with promoters

### 2. Grid View

- [ ] Click the grid view toggle button (top right)
- [ ] Each contract card should show promoter name
- [ ] Purple icon with user symbol appears next to promoter name
- [ ] Name displays correctly in grid cards

### 3. Search Functionality

- [ ] **Search by Promoter Name**
  - [ ] Type a promoter name in search box (e.g., "John")
  - [ ] Results should filter to show only contracts with that promoter
  - [ ] Promoter name still displays correctly in filtered results

- [ ] **Search by Other Fields**
  - [ ] Search by contract ID
  - [ ] Search by party names
  - [ ] Verify promoter column still shows correctly

### 4. Export to CSV

- [ ] Click "Export CSV" button
- [ ] Open the downloaded CSV file
- [ ] Check the "Promoter" column
- [ ] Verify promoter names are present (not "N/A")

**Expected CSV:**

```csv
Contract ID,Contract Number,First Party,Second Party,Promoter,Job Title,...
abc-123,...,ACME Corp,XYZ Ltd,John Doe,Sales Manager,...
def-456,...,Tech Inc,Global LLC,Jane Smith,Developer,...
```

### 5. Sorting

- [ ] Click on "Promoter" column header (if sortable)
- [ ] Contracts should sort by promoter name
- [ ] Names still display correctly after sorting

### 6. Filters

- [ ] **Status Filter**
  - [ ] Filter by "Active" status
  - [ ] Promoter names show for active contracts
  - [ ] Filter by "Pending" status
  - [ ] Promoter names show for pending contracts

### 7. Contract Details View

- [ ] Click on a contract to view details
- [ ] Navigate to `/en/contracts/[contract-id]`
- [ ] Verify promoter information displays correctly in detail view

### 8. New Contract Creation

- [ ] Navigate to `/en/generate-contract`
- [ ] Fill out the form and select a promoter
- [ ] Submit the contract
- [ ] Navigate back to contracts list
- [ ] Verify newly created contract shows promoter name immediately

---

## Database Verification

### Check Data Integrity

Run this SQL in Supabase SQL Editor:

```sql
-- 1. Verify promoter_id is populated
SELECT
    COUNT(*) as total_contracts,
    COUNT(promoter_id) as with_promoter_id,
    COUNT(*) - COUNT(promoter_id) as missing_promoter_id,
    ROUND(100.0 * COUNT(promoter_id) / NULLIF(COUNT(*), 0), 2) as percentage
FROM contracts;
```

**Expected Result:**

- `with_promoter_id` should be close to `total_contracts`
- `percentage` should be high (>90%)

### Verify Foreign Key Integrity

```sql
-- 2. Check if promoter_id references valid promoters
SELECT
    c.id as contract_id,
    c.contract_number,
    c.promoter_id,
    CASE
        WHEN p.id IS NOT NULL THEN '✅ Valid'
        ELSE '❌ Invalid - Promoter not found'
    END as status
FROM contracts c
LEFT JOIN promoters p ON c.promoter_id = p.id
WHERE c.promoter_id IS NOT NULL
LIMIT 20;
```

**Expected Result:**

- All rows should show "✅ Valid"
- No "❌ Invalid" entries

### Sample Data Query

```sql
-- 3. Get sample contracts with promoter data
SELECT
    c.contract_number,
    c.title,
    p.name_en as promoter_name_en,
    p.name_ar as promoter_name_ar,
    p.email as promoter_email,
    c.status,
    c.created_at
FROM contracts c
INNER JOIN promoters p ON c.promoter_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;
```

**Expected Result:**

- Should return 10 rows with promoter names
- No NULL values in promoter_name_en or promoter_name_ar

---

## API Testing

### Using Browser Console

Open browser console (F12) and run:

```javascript
// Test the API directly
fetch('/api/contracts?page=1&limit=5')
  .then(res => res.json())
  .then(data => {
    console.log('Total contracts:', data.contracts.length);

    // Check first contract's promoter structure
    const firstContract = data.contracts[0];
    console.log('First contract promoter:', firstContract.promoters);

    // Verify it's an object, not an array
    console.log('Is array?', Array.isArray(firstContract.promoters)); // Should be FALSE
    console.log('Promoter name:', firstContract.promoters?.name_en); // Should show name

    // Check all contracts
    const withPromoter = data.contracts.filter(c => c.promoters);
    const withPromoterName = data.contracts.filter(c => c.promoters?.name_en);

    console.log('Contracts with promoter object:', withPromoter.length);
    console.log('Contracts with promoter name:', withPromoterName.length);
    console.log(
      'Percentage with names:',
      Math.round((100 * withPromoterName.length) / data.contracts.length) + '%'
    );
  });
```

**Expected Console Output:**

```
Total contracts: 5
First contract promoter: {id: "...", name_en: "John Doe", name_ar: "...", ...}
Is array? false ✅
Promoter name: John Doe ✅
Contracts with promoter object: 5
Contracts with promoter name: 5
Percentage with names: 100% ✅
```

### Using cURL or Postman

```bash
# Get contracts list
curl -X GET 'http://localhost:3000/api/contracts?page=1&limit=5' \
  -H 'Cookie: your-session-cookie'

# Check response structure
# promoters should be an object: { "promoters": { "id": "...", "name_en": "..." } }
# NOT an array: { "promoters": [{ "id": "...", "name_en": "..." }] }
```

---

## Console Logging Verification

### New Logging Features Added

The fix includes enhanced logging. You should see these logs in your server console:

#### ✅ Success Logs

```
✅ Contracts API: Fetched 113 promoters
✅ Contracts API: Successfully fetched 50 contracts
```

#### ⚠️ Warning Logs (if data issues exist)

```
⚠️ Contracts API: Error fetching promoters: [error message]
⚠️ Promoter data not found for contract xyz-789 with promoter_id abc-123
```

---

## Performance Testing

### Response Time Checks

1. Open Network tab in DevTools
2. Reload `/en/contracts` page
3. Check `/api/contracts` request timing

**Expected:**

- Response time: < 500ms for 20 contracts
- No significant increase from before the fix
- Promoter data fetched in single batch query (efficient)

### Memory Usage

1. Open Performance tab in DevTools
2. Take a heap snapshot before loading contracts
3. Load contracts page
4. Take another heap snapshot
5. Compare memory usage

**Expected:**

- No memory leaks
- Similar memory footprint to before fix
- Objects properly shaped (not arrays)

---

## Regression Testing

### Ensure Nothing Else Broke

- [ ] **First Party / Second Party still display correctly**
  - [ ] Check "First Party" column shows company names
  - [ ] Check "Second Party" column shows company names
  - [ ] No "N/A" where there should be data

- [ ] **Other Contract Fields**
  - [ ] Contract dates display correctly
  - [ ] Contract status badges show correct colors
  - [ ] Job titles display
  - [ ] Contract values display

- [ ] **Statistics Cards**
  - [ ] Total contracts count is correct
  - [ ] Active/Pending/Expired counts match reality
  - [ ] No JavaScript errors in stats calculation

---

## Edge Cases to Test

### 1. Contracts Without Promoter

```sql
-- Create a test contract without promoter (if allowed)
-- Or find existing contracts where promoter_id IS NULL
SELECT * FROM contracts WHERE promoter_id IS NULL LIMIT 5;
```

**Expected Behavior:**

- Should show "N/A" (this is correct)
- No JavaScript errors
- No warnings in console (unless intentionally added)

### 2. Deleted Promoter

```sql
-- Check if any promoter_ids reference non-existent promoters
SELECT c.*
FROM contracts c
LEFT JOIN promoters p ON c.promoter_id = p.id
WHERE c.promoter_id IS NOT NULL AND p.id IS NULL;
```

**Expected Behavior:**

- Should log warning in console: "Promoter data not found for contract..."
- Display should show "N/A" gracefully
- No JavaScript errors

### 3. Promoter with Missing Name Fields

```sql
-- Check promoters with null names
SELECT * FROM promoters
WHERE name_en IS NULL OR name_ar IS NULL;
```

**Expected Behavior:**

- Should fallback to available name (English or Arabic)
- If both null, show "N/A"
- No JavaScript errors

---

## Rollback Plan

If issues are found:

### Immediate Rollback

```bash
# Revert the changes
git revert HEAD
git push
```

### Or Manual Fix

In `app/api/contracts/route.ts` line 269, change back to:

```javascript
promoters: promoter ? [promoter] : null,  // Temporary rollback
```

**Note:** This brings back the bug but restores previous behavior.

---

## Success Criteria

✅ **Fix is successful if:**

1. Promoter names display in contracts table (not "N/A")
2. No JavaScript errors in browser console
3. API response returns `promoters` as object (not array)
4. CSV export includes promoter names
5. Search by promoter name works
6. Both English and Arabic names display correctly
7. No performance degradation
8. All regression tests pass

❌ **Fix needs review if:**

1. Some contracts still show "N/A" when they shouldn't
2. JavaScript errors appear in console
3. API returns arrays instead of objects
4. Performance significantly degrades
5. Other fields stop working (first_party, second_party, etc.)

---

## Post-Deployment Monitoring

### Metrics to Watch (First 24 Hours)

1. **Error Logs**
   - Monitor server logs for warnings about missing promoter data
   - Check Sentry/error tracking for JavaScript errors related to promoters

2. **User Feedback**
   - Ask users if promoter names are displaying
   - Check support tickets for related issues

3. **Database Queries**
   - Monitor query performance
   - Check for any slow queries related to promoter joins

4. **API Response Times**
   - Monitor `/api/contracts` endpoint response times
   - Should remain under 500ms for typical loads

---

## Documentation Updates Needed

After successful deployment:

- [ ] Update API documentation to reflect correct response structure
- [ ] Update TypeScript type definitions (already correct, no change needed)
- [ ] Add this bug to "Known Issues" (resolved) section
- [ ] Update changelog with fix details

---

**Created:** 2025-10-22  
**Last Updated:** 2025-10-22  
**Status:** ✅ **Ready for Testing**
