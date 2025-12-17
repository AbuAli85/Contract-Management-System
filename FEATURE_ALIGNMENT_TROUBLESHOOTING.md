# 🔧 Feature Alignment Troubleshooting Guide

## Error: Foreign Key Constraint Violation

### Error Message:
```
ERROR: 23503: insert or update on table "employer_employees" violates foreign key constraint "employer_employees_employee_id_fkey"
DETAIL: Key (employee_id)=(...) is not present in table "promoters".
```

### Problem:
The foreign key constraint on `employer_employees.employee_id` is incorrectly pointing to the `promoters` table instead of the `profiles` table.

### Solution:

**Step 1: Fix the Foreign Key Constraint**

Run this script FIRST (use the complete version):
```sql
-- File: scripts/fix-employer-employees-constraints-complete.sql
```

**OR** if that doesn't work, use the original:
```sql
-- File: scripts/fix-employer-employees-constraints.sql
```

This script will:
1. ✅ Check current constraints
2. ✅ Drop incorrect constraints pointing to `promoters`
3. ✅ Add correct constraints pointing to `profiles`
4. ✅ Verify the fix

**Step 2: Then Run the Sync Script**

After fixing the constraints, run:
```sql
-- File: scripts/sync-feature-alignment-data.sql
```

---

## Why This Happened

The `employer_employees` table should have:
- `employer_id` → references `profiles(id)`
- `employee_id` → references `profiles(id)`

But somehow the constraint was created pointing to `promoters` instead. This is incorrect because:
- Not all employees are promoters
- The schema design uses `profiles` as the user identity table
- `promoter_id` is a separate column that links to `promoters(id)`

---

## Correct Schema

```sql
employer_employees (
  employer_id UUID REFERENCES profiles(id),      -- ✅ User (employer)
  employee_id UUID REFERENCES profiles(id),        -- ✅ User (employee)
  promoter_id UUID REFERENCES promoters(id),      -- ✅ Promoter (if employee is a promoter)
  party_id UUID REFERENCES parties(id),           -- ✅ Business entity
  company_id UUID REFERENCES companies(id)        -- ✅ Company
)
```

---

## Verification

After fixing constraints, verify with:

```sql
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'employer_employees'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('employee_id', 'employer_id');
```

**Expected Result:**
- `employee_id` → `profiles`
- `employer_id` → `profiles`

---

## Alternative: Work Around (Not Recommended)

If you can't fix the constraint immediately, you could:
1. Only sync promoters that have matching profiles
2. Create profiles for promoters that don't have them
3. Then fix the constraint

But it's better to fix the constraint first.

---

**Status:** ⚠️ **Run fix-employer-employees-constraints.sql FIRST**

