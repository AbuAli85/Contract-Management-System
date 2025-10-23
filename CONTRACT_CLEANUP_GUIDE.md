# 📋 Contract Review & Cleanup Guide

## 🎯 Purpose

Clean up mock, test, and incorrect contracts from your database while preserving real business contracts.

---

## ✅ Current Status

**Total Verified Real Contracts**: 424+ across top 5 parties
- United Electronics: 205 contracts
- Falcon Eye: 116 contracts  
- Amjad Al Maerifa: 75 contracts
- AL AMRI INVESTMENT: 16 contracts
- Vision Electronics: 12 contracts

---

## 🔍 Step 1: Identify Mock Contracts

Run this query first to see what might be mock data:

**File**: `identify-mock-contracts.sql`

This will show:
- ✅ Contracts with "test", "mock", "sample" in title/number
- ✅ Contracts with placeholder parties
- ✅ Contracts without ANY parties assigned
- ✅ Duplicate contract numbers
- ✅ Contracts with missing critical data

### Patterns to Look For

| Pattern | Example | Likely Mock? |
|---------|---------|--------------|
| Keywords | "Test Contract", "Mock Data" | ✅ YES |
| Contract Number | "CNT-TEST-001", "MOCK-123" | ✅ YES |
| No Parties | All party fields NULL | ⚠️ MAYBE |
| Seed Pattern | "CNT-2024-001", "CNT-2024-002" | ⚠️ MAYBE |
| Generic Title | "Sales Promoter - Contract 1" repeated 50x | ⚠️ REVIEW |
| Missing Data | No title, no dates, no promoter | ⚠️ MAYBE |

---

## 📊 Step 2: Comprehensive Review

Run the comprehensive review:

**File**: `review-and-cleanup-mock-contracts.sql`

This provides:
1. **5 identification categories**
   - Test/mock keywords
   - Old year patterns
   - No parties assigned
   - Generic/duplicate titles
   - Seed data patterns

2. **Data quality checks**
   - Missing critical fields
   - Invalid date ranges
   - Orphaned contracts

3. **Summary statistics**
   - Percentage breakdown
   - Counts by issue type
   - Recommended actions

---

## 🗑️ Step 3: Safe Deletion Process

### Important Rules

⚠️ **NEVER delete contracts that:**
- Have real party assignments
- Have real promoter assignments
- Are marked as "active" or "approved"
- Have PDF URLs generated
- Are recent (last 30 days) unless confirmed as test

✅ **SAFE to delete contracts that:**
- Contain "test", "mock", "sample" keywords
- Have NO parties AND NO promoter
- Were created by seed-data endpoint
- Are marked as "draft" AND > 90 days old with no activity

### Deletion Template

The review script includes commented DELETE sections:

```sql
/* UNCOMMENT TO DELETE - REVIEW FIRST!

-- Option 1: Delete test/mock contracts
DELETE FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%'
  ...;

-- Option 2: Delete contracts without parties
DELETE FROM contracts
WHERE 
  employer_id IS NULL 
  AND client_id IS NULL 
  AND first_party_id IS NULL 
  AND second_party_id IS NULL;

*/
```

---

## 🧪 Step 4: Test First (Dry Run)

Before deleting, create a backup table:

```sql
-- Create backup
CREATE TABLE contracts_backup AS
SELECT * FROM contracts;

-- Or export to CSV via Supabase Dashboard
```

Then test your DELETE query as a SELECT first:

```sql
-- Test query - shows what WOULD be deleted
SELECT 
  id, contract_number, title, status, created_at
FROM contracts
WHERE 
  LOWER(title) LIKE '%test%'
  OR LOWER(title) LIKE '%mock%';
  
-- If results look correct, uncomment the DELETE
```

---

## 📈 Step 5: Verify After Cleanup

After deletion, verify the cleanup:

```sql
-- Run the top parties query again
WITH party_counts AS (
  SELECT 
    p.name_en,
    COUNT(DISTINCT c.id) as total_contracts
  FROM parties p
  LEFT JOIN contracts c ON (
    c.employer_id = p.id OR 
    c.client_id = p.id OR 
    c.first_party_id = p.id OR 
    c.second_party_id = p.id
  )
  GROUP BY p.id, p.name_en
)
SELECT 
  name_en,
  total_contracts
FROM party_counts
WHERE total_contracts > 0
ORDER BY total_contracts DESC
LIMIT 10;
```

**Expected**: Should still show ~424 contracts (or slightly less if mock data removed)

---

## 🎯 Recommended Cleanup Strategy

### Phase 1: Safe Deletions (High Confidence)

Run these in order:

1. **Delete obvious test/mock contracts**
   ```sql
   -- Contracts with test keywords in title/number
   DELETE FROM contracts
   WHERE 
     LOWER(title) LIKE '%test%'
     OR LOWER(title) LIKE '%mock%'
     OR contract_number LIKE '%TEST%';
   ```

2. **Delete placeholder party contracts** (already done in previous script)
   ```sql
   -- Should already be nullified/cleaned
   ```

### Phase 2: Review Deletions (Medium Confidence)

1. **Contracts without parties**
   - Review the list first
   - If truly orphaned with no data, delete
   - If recent, might need party assignment instead

2. **Seed data pattern (CNT-YYYY-00X)**
   - Check if these are early real contracts
   - Only delete if confirmed as test data

### Phase 3: Data Improvement (Don't Delete)

1. **Contracts without promoters**
   - Don't delete - use bulk assignment tool instead
   - See: `/admin/contracts-without-promoters`

2. **Draft contracts**
   - Review case-by-case
   - Might be in-progress real contracts

---

## 📊 Example Cleanup Session

```sql
-- 1. Review
\i identify-mock-contracts.sql
-- Shows: 5 contracts with "test" in title

-- 2. Confirm
SELECT id, contract_number, title FROM contracts 
WHERE LOWER(title) LIKE '%test%';
-- Verify these are test data

-- 3. Delete (drop trigger first)
DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts CASCADE;

DELETE FROM contracts
WHERE LOWER(title) LIKE '%test%';
-- Deleted 5 rows

-- 4. Recreate trigger
CREATE TRIGGER sync_contract_party_ids_trigger...;

-- 5. Verify
SELECT COUNT(*) FROM contracts;
-- Shows: 424 remaining (was 429)
```

---

## 🚨 Important Notes

### Before Deleting ANY Contracts:

1. ✅ **Backup your database** (Supabase auto-backups daily)
2. ✅ **Review the list** of contracts to be deleted
3. ✅ **Check with stakeholders** if unsure
4. ✅ **Test on development** environment first if possible
5. ✅ **Drop triggers** before bulk deletions
6. ✅ **Recreate triggers** after deletions

### Red Flags (DON'T Delete):

- ❌ Contracts with `pdf_url` generated
- ❌ Contracts with status "active" or "approved"
- ❌ Contracts created in last 7 days
- ❌ Contracts with real party names (not "Placeholder")
- ❌ Contracts with real promoter names

### Green Lights (Safe to Delete):

- ✅ Title contains "test", "mock", "sample"
- ✅ Contract number contains "TEST", "MOCK"
- ✅ No parties AND no promoter AND status = "draft"
- ✅ Created via seed-data endpoint (if confirmed)
- ✅ Placeholder party references (already handled)

---

## 📁 Files Available

| File | Purpose |
|------|---------|
| `identify-mock-contracts.sql` | Quick identification query |
| `cleanup-mock-contracts.sql` | Safe deletion with preview |
| `review-and-cleanup-mock-contracts.sql` | **Comprehensive review (USE THIS)** |
| `cleanup-placeholders-complete.sql` | Placeholder parties cleanup |

---

## 🎯 Recommended Next Steps

### 1. Run Comprehensive Review
```sql
\i review-and-cleanup-mock-contracts.sql
```

### 2. Analyze Results
Look at the counts and examples for each category

### 3. Make Decision
- How many contracts have test keywords?
- How many without parties?
- Are any clearly mock data?

### 4. Selective Cleanup
Uncomment ONLY the sections you're confident about

### 5. Verify
Check party contract counts remain accurate after cleanup

---

## 📞 Need Help Deciding?

Share the results from `review-and-cleanup-mock-contracts.sql` and I can help you:
- Identify which contracts are safe to delete
- Determine if contracts are real vs mock
- Create a custom cleanup query for your specific data

---

## ✅ Success Criteria

After cleanup, you should have:
- ✅ No contracts with "test", "mock", "sample" in title
- ✅ No contracts with placeholder parties
- ✅ All real business contracts preserved (424+)
- ✅ Party contract counts still accurate
- ✅ Manage Parties page showing correct totals

---

**Status**: 📋 Review scripts ready  
**Safety**: 🔒 All DELETE sections commented out  
**Next**: Run review, analyze, then decide on cleanup  
**Date**: October 23, 2025

