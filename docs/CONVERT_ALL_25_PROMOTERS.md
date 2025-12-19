# 🔄 Convert All 25 Convertible Promoters

## 📊 **CURRENT STATUS**

- ✅ **6 employees** already converted
- 🔄 **19 more** can be converted (out of 25 total)
- 📋 **183 total promoters** in system
- ✅ **27 have profiles** (can be converted)
- ✅ **181 have employers** (can be converted)
- ✅ **25 can be fully converted** (have both profile + employer)

---

## 🚀 **CONVERT ALL 25**

### **Step 1: Run the Conversion Script**

Go to **Supabase SQL Editor** and run:

**File**: `scripts/convert-all-25-promoters.sql`

Or copy this:

```sql
-- Convert all 25 convertible promoters
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
  CASE WHEN p.status = 'active' THEN 'active' ELSE 'active' END as employment_status,
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

-- Fix existing records
UPDATE employer_employees ee
SET employee_id = pr.id, updated_at = NOW()
FROM promoters p
INNER JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE ee.employee_id = p.id
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = ee.employee_id)
  AND pr.id IS NOT NULL;
```

### **Step 2: Verify Results**

After running, you should see:
- ✅ **25 total employees** (or close to it)
- ✅ All valid (correct profile IDs)

### **Step 3: Refresh and Check**

1. **Refresh** attendance groups page
2. **Go to** "Assign Employees" → "Selected" tab
3. ✅ **Should see 25 employees** (or all that were converted)

---

## 📊 **EXPECTED RESULTS**

After running:
- ✅ **~25 employees** total (6 existing + 19 new)
- ✅ All have valid profile IDs
- ✅ All can be assigned to attendance groups
- ✅ All can track attendance

---

## 🔍 **ABOUT THE OTHER 158 PROMOTERS**

The remaining **158 promoters** (183 - 25) can't be converted because:

1. **156 don't have profiles** (no user accounts)
   - These need profiles created first
   - Or they're not actual employees (just contacts)

2. **2 don't have employers**
   - Need to assign them to an employer/party

---

## ✅ **AFTER CONVERSION**

1. ✅ Refresh attendance groups page
2. ✅ See ~25 employees in selector
3. ✅ Assign them to groups
4. ✅ Attendance tracking works!

---

**🚀 Run the script to convert all 25!**

