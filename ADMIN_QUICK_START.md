# ⚡ Admin Quick Start Guide

## 🎯 5-Minute Admin Setup

### **Step 1: Verify You're Admin**

Run this in your database:
```sql
SELECT email, role, user_metadata 
FROM profiles 
WHERE email = 'your-admin-email@example.com';
```

Should show: `role = 'admin'`

---

### **Step 2: Check System Status**

```sql
-- Quick system overview
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admins,
  (SELECT COUNT(*) FROM profiles WHERE user_metadata->>'role' = 'employer') as employers,
  (SELECT COUNT(*) FROM profiles WHERE user_metadata->>'role' = 'promoter') as employees,
  (SELECT COUNT(*) FROM promoters) as total_promoters;
```

---

### **Step 3: Assign User Roles**

#### **Make User an Employee:**
```sql
UPDATE profiles 
SET role = 'user', user_metadata = '{"role": "promoter"}'::jsonb
WHERE email = 'employee@example.com';
```

#### **Make User an Employer:**
```sql
-- First, get employer UUID (from companies table or create one)
-- Then:
UPDATE profiles 
SET 
  role = 'manager',
  user_metadata = '{"role": "employer", "employer_id": "YOUR-UUID"}'::jsonb
WHERE email = 'employer@example.com';
```

#### **Make User an Admin:**
```sql
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@example.com';
```

---

### **Step 4: Assign Promoters to Employers**

```sql
-- Assign promoters to employer
UPDATE promoters 
SET employer_id = 'EMPLOYER-UUID'
WHERE id IN ('promoter-id-1', 'promoter-id-2');
```

---

### **Step 5: Verify Everything Works**

1. **Login as Employee:**
   - Should see "My Profile" only
   - No filters, no bulk actions

2. **Login as Employer:**
   - Should see full dashboard
   - Only assigned promoters visible
   - All features except delete

3. **Login as Admin:**
   - Should see all promoters
   - All features enabled

---

## 📋 Common Admin Tasks

### **Task: View All Users**
```sql
SELECT email, role, user_metadata->>'role' as metadata_role 
FROM profiles 
ORDER BY email;
```

### **Task: Find Users Without Roles**
```sql
SELECT email, role, user_metadata 
FROM profiles 
WHERE (user_metadata->>'role' IS NULL OR user_metadata->>'role' = '')
  AND role IS NULL;
```

### **Task: View Employer's Promoters**
```sql
SELECT p.* 
FROM promoters p
WHERE p.employer_id = 'EMPLOYER-UUID';
```

---

## ✅ Quick Checklist

- [ ] Admin can see all promoters
- [ ] Employees see only their profile
- [ ] Employers see only assigned promoters
- [ ] Permissions are correctly applied
- [ ] UI shows correct features per role

---

**That's it!** You're ready to manage the system! 🚀

