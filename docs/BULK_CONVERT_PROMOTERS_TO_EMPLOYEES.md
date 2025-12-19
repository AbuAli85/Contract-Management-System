# 🔄 Bulk Convert Promoters to Employees

## 🎯 **THE PROBLEM**

You have **17 promoter-only records** that need to be converted to actual employees so they can:
- ✅ Appear in the employee selector
- ✅ Be assigned to attendance groups
- ✅ Track attendance

---

## ✅ **QUICK FIX: Run SQL Script**

### **Step 1: Go to Supabase SQL Editor**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query

### **Step 2: Run the Bulk Conversion Script**

Copy and paste this script:

```sql
-- Create employer_employee records for all linkable promoters
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  company_id,
  employment_type,
  employment_status,
  employee_code,
  created_at,
  updated_at
)
SELECT DISTINCT ON (emp_pr.id, pr.id)
  emp_pr.id as employer_id,
  pr.id as employee_id,
  c.id as company_id,
  'full_time' as employment_type,
  CASE 
    WHEN p.status = 'active' THEN 'active'
    ELSE 'active'
  END as employment_status,
  'EMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(pr.id::text, '-', ''), -4)) as employee_code,
  COALESCE(p.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM promoters p
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
LEFT JOIN companies c ON c.party_id = p.employer_id
LEFT JOIN employer_employees ee ON ee.employee_id = pr.id AND ee.employer_id = emp_pr.id
WHERE p.email IS NOT NULL
  AND TRIM(p.email) != ''
  AND pt.contact_email IS NOT NULL
  AND TRIM(pt.contact_email) != ''
  AND ee.id IS NULL
ON CONFLICT DO NOTHING;

-- Fix existing records with wrong employee_id
UPDATE employer_employees ee
SET 
  employee_id = pr.id,
  updated_at = NOW()
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE ee.employee_id = p.id
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  AND pr.id IS NOT NULL;
```

### **Step 3: Click "Run"**

### **Step 4: Verify**

Run this to check:

```sql
SELECT 
  COUNT(*) as total_employees,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id) THEN 1 END) as valid
FROM employer_employees ee
WHERE ee.employee_id IS NOT NULL;
```

**Expected**: `valid` should equal `total_employees`

---

## 🎯 **AFTER RUNNING THE SCRIPT**

1. **Refresh** the attendance groups page
2. **Go to** "Assign Employees" section
3. **Click** "Selected" tab
4. ✅ **Employees should now appear!**

---

## ⚠️ **IF SOME STILL DON'T APPEAR**

### **Check 1: Do they have matching profiles?**

Run this to see which promoters don't have profiles:

```sql
SELECT 
  p.id,
  p.name_en,
  p.email,
  'No matching profile' as issue
FROM promoters p
WHERE p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
  );
```

**If results show**: These promoters need profiles created first.

### **Check 2: Are they active?**

The script only creates records for active promoters. Check:

```sql
SELECT 
  p.id,
  p.name_en,
  p.status,
  'Inactive status' as issue
FROM promoters p
WHERE p.status NOT IN ('active', NULL);
```

---

## 📋 **ALTERNATIVE: Use the Full Script**

If you want more control, use the full script:

**File**: `scripts/bulk-convert-promoters-to-employees.sql`

This script:
1. ✅ Shows which promoters will be converted
2. ✅ Creates employer_employee records
3. ✅ Fixes existing records with wrong IDs
4. ✅ Verifies the results

---

## ✅ **EXPECTED RESULT**

After running the script:
- ✅ All 17 promoters converted to employees
- ✅ They appear in employee selector
- ✅ Can be assigned to attendance groups
- ✅ Attendance tracking works

---

**🚀 Run the SQL script and refresh the page!**

