# 🔄 Feature Alignment Data Sync Instructions

## Current Status (From Verification)

Based on your verification results:

| Metric | Current Count | Expected | Status |
|--------|--------------|----------|--------|
| Promoters with employer_id | 181 | 181 | ✅ Good |
| Employer Employees with party_id | 2 | ~181 | ❌ **LOW** |
| Employer Employees with promoter_id | 1 | ~181 | ❌ **VERY LOW** |
| Companies with party_id | 18 | 18 | ✅ Good |
| Profiles with active_company_id | 14 | 14 | ✅ Good |
| Company Members (active) | 50 | 50 | ✅ Good |

## Problem

The migration created the new columns (`party_id`, `promoter_id`, `company_id`) but didn't fully populate them with existing data. Most `employer_employees` records are missing:
- `party_id` (only 2 out of many)
- `promoter_id` (only 1 out of ~181)

## Solution

Run the data sync script to populate the missing relationships.

---

## Steps to Fix

### Step 1: Run the Sync Script

Execute the sync script in Supabase SQL Editor:

```sql
-- File: scripts/sync-feature-alignment-data.sql
```

**What it does:**
1. ✅ Updates existing `employer_employees` records with `party_id`, `promoter_id`, `company_id`
2. ✅ Creates missing `employer_employee` records for promoters that don't have one
3. ✅ Ensures all employer parties have corresponding companies
4. ✅ Creates `company_members` entries for users
5. ✅ Updates `profiles.active_company_id`

### Step 2: Verify Results

After running the sync script, run the verification script again:

```sql
-- File: scripts/verify-feature-alignment.sql
```

**Expected Results After Sync:**

| Metric | Expected Count |
|--------|---------------|
| Employer Employees with party_id | ~181 (should match promoters) |
| Employer Employees with promoter_id | ~181 (should match promoters) |
| Companies with party_id | 18+ (should match active employers) |

---

## Quick Fix Command

If you want to run just the essential sync (without verification), use this:

```sql
-- Quick sync: Update existing employer_employees
UPDATE employer_employees ee
SET party_id = (
  SELECT p.employer_id FROM promoters p WHERE p.id = ee.promoter_id LIMIT 1
)
WHERE ee.party_id IS NULL AND ee.promoter_id IS NOT NULL;

UPDATE employer_employees ee
SET promoter_id = (
  SELECT pr.id FROM promoters pr 
  JOIN profiles p ON LOWER(p.email) = LOWER(pr.email)
  WHERE p.id = ee.employee_id LIMIT 1
)
WHERE ee.promoter_id IS NULL AND ee.employee_id IS NOT NULL;

UPDATE employer_employees ee
SET company_id = (
  SELECT c.id FROM companies c WHERE c.party_id = ee.party_id LIMIT 1
)
WHERE ee.company_id IS NULL AND ee.party_id IS NOT NULL;
```

---

## What to Expect

After running the sync script:

1. ✅ **All promoters with employer_id** will have corresponding `employer_employee` records
2. ✅ **All employer_employees** will have `party_id` populated
3. ✅ **All employer_employees** will have `promoter_id` populated (where applicable)
4. ✅ **All employer_employees** will have `company_id` populated
5. ✅ **All features** (Payroll, Attendance, Tasks, Targets) will properly link to promoters

---

## Troubleshooting

### If sync doesn't work:

1. **Check if promoters have emails:**
   ```sql
   SELECT COUNT(*) FROM promoters WHERE email IS NOT NULL;
   ```

2. **Check if profiles match promoter emails:**
   ```sql
   SELECT COUNT(*) 
   FROM promoters p
   JOIN profiles pr ON LOWER(pr.email) = LOWER(p.email);
   ```

3. **Check if parties have contact_email:**
   ```sql
   SELECT COUNT(*) FROM parties WHERE type = 'Employer' AND contact_email IS NOT NULL;
   ```

### Manual Fix (if needed):

If automatic sync doesn't work, you may need to manually link some records based on your business logic.

---

## Next Steps

1. ✅ Run `scripts/sync-feature-alignment-data.sql`
2. ✅ Run `scripts/verify-feature-alignment.sql` again
3. ✅ Verify counts match expected values
4. ✅ Test features (Promoters page, Team page, Payroll, Attendance, etc.)

---

**Status:** ⚠️ **Data Sync Required** - Run the sync script to complete the alignment.

