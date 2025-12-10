# 👑 Admin Guide: System Review & User Permission Management

## 📋 Overview

This guide helps **System Administrators** review the Promoter Intelligence Hub and manage user roles/permissions.

---

## 🔍 Part 1: System Review & Verification

### **Step 1: Verify Role-Based System is Working**

#### **1.1 Check Role Detection**

**Method A: Via React DevTools**
1. Open Promoter Intelligence Hub
2. Press `F12` → React DevTools
3. Find `RoleContextProvider` component
4. Inspect `value` prop:
   ```javascript
   {
     userRole: 'admin',
     isEmployer: true,
     isEmployee: false,
     isAdmin: true,
     employerId: null,
     canViewAll: true,
     canCreate: true,
     canEdit: true,
     canDelete: true,
     // ... all permissions
   }
   ```

**Method B: Via Browser Console**
```javascript
// Check current admin session
const checkAdminRole = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Admin Role:', session?.user?.user_metadata?.role);
  console.log('Profile Role:', await supabase.from('profiles').select('role').eq('id', session?.user?.id).single());
};
```

#### **1.2 Verify Admin Access**

As Admin, you should see:
- ✅ **All promoters** (not filtered by employer)
- ✅ **Full dashboard** with all metrics
- ✅ **All features enabled:**
  - Create, Edit, Delete promoters
  - Export functionality
  - Bulk actions
  - Analytics dashboard
  - Advanced filters
  - Assignment management

#### **1.3 Test Role-Based Filtering**

**Test Employee View:**
1. Create/update a test user as employee:
   ```sql
   UPDATE profiles 
   SET user_metadata = '{"role": "promoter"}'::jsonb
   WHERE email = 'test-employee@example.com';
   ```
2. Login as that user
3. Verify: Only sees "My Profile", no filters, no bulk actions

**Test Employer View:**
1. Create/update a test user as employer:
   ```sql
   UPDATE profiles 
   SET user_metadata = '{"role": "employer", "employer_id": "your-employer-uuid"}'::jsonb
   WHERE email = 'test-employer@example.com';
   ```
2. Login as that user
3. Verify: Sees full dashboard, only assigned promoters, all features except delete

---

## 👥 Part 2: User Permission Management

### **Method 1: Direct Database Management (Recommended)**

#### **2.1 Assign Employee Role**

```sql
-- Make user an employee/promoter
UPDATE profiles 
SET 
  role = 'user',
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"promoter"'
  )
WHERE email = 'employee@example.com';

-- Verify
SELECT id, email, role, user_metadata 
FROM profiles 
WHERE email = 'employee@example.com';
```

**Result:** User will see only their own profile, no management features.

---

#### **2.2 Assign Employer Role**

```sql
-- First, get or create employer/company ID
-- Option A: Use existing company ID
SELECT id FROM companies WHERE name = 'Company Name';

-- Option B: Create new employer ID
-- (Use a UUID generator or existing company UUID)

-- Make user an employer
UPDATE profiles 
SET 
  role = 'manager',  -- or 'admin' for more permissions
  user_metadata = jsonb_set(
    jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      '"employer"'
    ),
    '{employer_id}',
    '"YOUR-EMPLOYER-UUID-HERE"'
  )
WHERE email = 'employer@example.com';

-- Also set company_id if available
UPDATE profiles 
SET user_metadata = jsonb_set(
  user_metadata,
  '{company_id}',
  '"YOUR-COMPANY-UUID-HERE"'
)
WHERE email = 'employer@example.com';

-- Verify
SELECT 
  id, 
  email, 
  role, 
  user_metadata->>'role' as metadata_role,
  user_metadata->>'employer_id' as employer_id,
  user_metadata->>'company_id' as company_id
FROM profiles 
WHERE email = 'employer@example.com';
```

**Result:** User will see full dashboard, only their assigned promoters, all management features.

---

#### **2.3 Assign Admin Role**

```sql
-- Make user an admin
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@example.com';

-- Optionally set in metadata too
UPDATE profiles 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';

-- Verify
SELECT id, email, role, user_metadata 
FROM profiles 
WHERE email = 'admin@example.com';
```

**Result:** User will see all promoters, all features, full system access.

---

#### **2.4 Assign Manager Role**

```sql
-- Make user a manager (acts like employer with limited delete)
UPDATE profiles 
SET role = 'manager'
WHERE email = 'manager@example.com';

-- Verify
SELECT id, email, role 
FROM profiles 
WHERE email = 'manager@example.com';
```

**Result:** User can create, edit, view, but cannot delete.

---

### **Method 2: Bulk Role Assignment**

#### **2.5 Assign Multiple Users as Employees**

```sql
-- Assign multiple users as employees
UPDATE profiles 
SET 
  role = 'user',
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"promoter"'
  )
WHERE email IN (
  'employee1@example.com',
  'employee2@example.com',
  'employee3@example.com'
);
```

#### **2.6 Assign Multiple Users to Same Employer**

```sql
-- Assign multiple users to same employer
UPDATE profiles 
SET 
  role = 'manager',
  user_metadata = jsonb_set(
    jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      '"employer"'
    ),
    '{employer_id}',
    '"SHARED-EMPLOYER-UUID"'
  )
WHERE email IN (
  'employer1@example.com',
  'employer2@example.com',
  'employer3@example.com'
);
```

---

### **Method 3: Assign Promoters to Employers**

#### **2.7 Link Promoters to Employer**

```sql
-- Assign promoters to an employer
UPDATE promoters 
SET employer_id = 'EMPLOYER-UUID-HERE'
WHERE id IN (
  'promoter-uuid-1',
  'promoter-uuid-2',
  'promoter-uuid-3'
);

-- Verify assignments
SELECT 
  p.id,
  p.display_name,
  p.employer_id,
  pr.email as employer_email
FROM promoters p
LEFT JOIN profiles pr ON pr.id::text = p.employer_id
WHERE p.employer_id = 'EMPLOYER-UUID-HERE';
```

---

## 🔐 Part 3: Permission Management

### **3.1 Grant Specific Permissions**

The system uses role-based permissions. To grant specific permissions:

**Option A: Change Role (Recommended)**
```sql
-- Promote user to manager for more permissions
UPDATE profiles 
SET role = 'manager'
WHERE email = 'user@example.com';
```

**Option B: Custom Permissions (Advanced)**
```sql
-- Add custom permissions to user_metadata
UPDATE profiles 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{custom_permissions}',
  '["promoter:create", "promoter:export"]'::jsonb
)
WHERE email = 'user@example.com';
```

---

### **3.2 Permission Levels**

| Role | Can View | Can Create | Can Edit | Can Delete | Can Export | Can Bulk Actions |
|------|----------|------------|----------|------------|------------|------------------|
| **Employee** | Own Only | ❌ | Own Only* | ❌ | ❌ | ❌ |
| **Employer** | Assigned | ✅ | Assigned | ❌ | ✅ | ✅ |
| **Manager** | Assigned | ✅ | Assigned | ❌ | ✅ | ✅ |
| **Admin** | All | ✅ | All | ✅ | ✅ | ✅ |

*If `canEdit` permission is granted

---

## 📊 Part 4: System Review Checklist

### **4.1 Role Detection Review**

- [ ] Admin can see all promoters
- [ ] Employers see only assigned promoters
- [ ] Employees see only their own profile
- [ ] Role context correctly detects user type
- [ ] Permissions are correctly applied

### **4.2 UI Review**

- [ ] Employee view shows "My Profile" header
- [ ] Employer view shows full dashboard
- [ ] Admin view shows all features
- [ ] Filters appear/disappear based on role
- [ ] Bulk actions appear/disappear based on role
- [ ] Analytics accessible based on role

### **4.3 Data Filtering Review**

- [ ] API calls include correct filter parameters
- [ ] Employees: `?userId=<id>` filter applied
- [ ] Employers: `?employerId=<id>` filter applied
- [ ] Admins: No filters (see all data)

### **4.4 Permission Review**

- [ ] Create button only for authorized roles
- [ ] Edit button only for authorized roles
- [ ] Delete button only for admins
- [ ] Export button only for authorized roles
- [ ] Bulk actions only for authorized roles

---

## 🛠️ Part 5: User Management Queries

### **5.1 View All Users and Their Roles**

```sql
SELECT 
  id,
  email,
  role,
  user_metadata->>'role' as metadata_role,
  user_metadata->>'employer_id' as employer_id,
  user_metadata->>'company_id' as company_id,
  created_at,
  last_sign_in_at
FROM profiles
ORDER BY created_at DESC;
```

### **5.2 Find All Employees**

```sql
SELECT 
  id,
  email,
  role,
  user_metadata
FROM profiles
WHERE 
  user_metadata->>'role' = 'promoter' 
  OR user_metadata->>'role' = 'employee'
  OR role = 'user';
```

### **5.3 Find All Employers**

```sql
SELECT 
  id,
  email,
  role,
  user_metadata->>'employer_id' as employer_id,
  user_metadata->>'company_id' as company_id
FROM profiles
WHERE 
  user_metadata->>'role' = 'employer'
  OR user_metadata->>'employer_id' IS NOT NULL
  OR user_metadata->>'company_id' IS NOT NULL
  OR role IN ('manager', 'admin');
```

### **5.4 Find Users Without Roles**

```sql
SELECT 
  id,
  email,
  role,
  user_metadata
FROM profiles
WHERE 
  (user_metadata->>'role' IS NULL OR user_metadata->>'role' = '')
  AND role IS NULL;
```

### **5.5 Count Users by Role**

```sql
SELECT 
  COALESCE(user_metadata->>'role', role, 'unassigned') as user_role,
  COUNT(*) as count
FROM profiles
GROUP BY COALESCE(user_metadata->>'role', role, 'unassigned')
ORDER BY count DESC;
```

---

## 🔄 Part 6: Common Admin Tasks

### **Task 1: Promote User to Employer**

```sql
-- Step 1: Get employer/company UUID
SELECT id, name FROM companies LIMIT 10;

-- Step 2: Assign user as employer
UPDATE profiles 
SET 
  role = 'manager',
  user_metadata = jsonb_set(
    jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      '"employer"'
    ),
    '{employer_id}',
    '"EMPLOYER-UUID-HERE"'
  )
WHERE email = 'user@example.com';

-- Step 3: Verify
SELECT email, role, user_metadata FROM profiles WHERE email = 'user@example.com';
```

### **Task 2: Demote Employer to Employee**

```sql
-- Remove employer permissions
UPDATE profiles 
SET 
  role = 'user',
  user_metadata = jsonb_set(
    jsonb_set(
      user_metadata,
      '{role}',
      '"promoter"'
    ),
    '{employer_id}',
    'null'
  )
WHERE email = 'user@example.com';
```

### **Task 3: Transfer Promoters Between Employers**

```sql
-- Transfer promoters from one employer to another
UPDATE promoters 
SET employer_id = 'NEW-EMPLOYER-UUID'
WHERE employer_id = 'OLD-EMPLOYER-UUID';

-- Verify transfer
SELECT 
  employer_id,
  COUNT(*) as promoter_count
FROM promoters
GROUP BY employer_id;
```

### **Task 4: Grant Temporary Admin Access**

```sql
-- Grant admin access temporarily
UPDATE profiles 
SET role = 'admin'
WHERE email = 'user@example.com';

-- Later, revoke admin access
UPDATE profiles 
SET role = 'manager'  -- or 'user' for employee
WHERE email = 'user@example.com';
```

---

## 📝 Part 7: Admin Verification Script

### **Complete System Check**

```sql
-- Run this comprehensive check
WITH role_summary AS (
  SELECT 
    COALESCE(user_metadata->>'role', role, 'unassigned') as user_role,
    COUNT(*) as user_count
  FROM profiles
  GROUP BY COALESCE(user_metadata->>'role', role, 'unassigned')
),
promoter_summary AS (
  SELECT 
    CASE 
      WHEN employer_id IS NOT NULL THEN 'assigned'
      ELSE 'unassigned'
    END as assignment_status,
    COUNT(*) as promoter_count
  FROM promoters
  GROUP BY assignment_status
)
SELECT 
  'User Roles' as category,
  user_role as detail,
  user_count as count
FROM role_summary
UNION ALL
SELECT 
  'Promoter Assignments' as category,
  assignment_status as detail,
  promoter_count as count
FROM promoter_summary;
```

---

## 🎯 Part 8: Quick Admin Actions

### **Action 1: View System Status**

```sql
-- Get system overview
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admins,
  (SELECT COUNT(*) FROM profiles WHERE user_metadata->>'role' = 'employer') as employers,
  (SELECT COUNT(*) FROM profiles WHERE user_metadata->>'role' = 'promoter') as employees,
  (SELECT COUNT(*) FROM promoters) as total_promoters,
  (SELECT COUNT(*) FROM promoters WHERE employer_id IS NOT NULL) as assigned_promoters;
```

### **Action 2: Find Users Needing Role Assignment**

```sql
-- Find users without clear role
SELECT 
  id,
  email,
  role,
  user_metadata,
  created_at
FROM profiles
WHERE 
  (user_metadata->>'role' IS NULL OR user_metadata->>'role' = '')
  AND role IS NULL
ORDER BY created_at DESC;
```

### **Action 3: Audit User Permissions**

```sql
-- Check all users and their effective permissions
SELECT 
  p.id,
  p.email,
  p.role as profile_role,
  p.user_metadata->>'role' as metadata_role,
  p.user_metadata->>'employer_id' as employer_id,
  CASE 
    WHEN p.role = 'admin' THEN 'Full Access'
    WHEN p.role = 'manager' OR p.user_metadata->>'role' = 'employer' THEN 'Employer Access'
    WHEN p.user_metadata->>'role' = 'promoter' OR p.user_metadata->>'role' = 'employee' THEN 'Employee Access'
    ELSE 'Limited Access'
  END as effective_permission
FROM profiles p
ORDER BY p.email;
```

---

## 🚨 Part 9: Troubleshooting

### **Issue: User has wrong permissions**

**Solution:**
```sql
-- Check current role
SELECT email, role, user_metadata FROM profiles WHERE email = 'user@example.com';

-- Fix role
UPDATE profiles 
SET 
  role = 'correct-role',
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"correct-role"'
  )
WHERE email = 'user@example.com';

-- User needs to logout and login again for changes to take effect
```

### **Issue: Employer can't see their promoters**

**Solution:**
```sql
-- Check employer_id in user metadata
SELECT email, user_metadata->>'employer_id' FROM profiles WHERE email = 'employer@example.com';

-- Check if promoters have matching employer_id
SELECT COUNT(*) FROM promoters WHERE employer_id = 'EMPLOYER-UUID';

-- Fix: Ensure promoters are assigned
UPDATE promoters 
SET employer_id = 'EMPLOYER-UUID'
WHERE id IN (SELECT id FROM promoters LIMIT 10);  -- Example: assign some promoters
```

### **Issue: Employee sees all promoters**

**Solution:**
```sql
-- Verify user is set as employee
SELECT email, role, user_metadata FROM profiles WHERE email = 'employee@example.com';

-- Fix: Set as employee
UPDATE profiles 
SET 
  role = 'user',
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"promoter"'
  )
WHERE email = 'employee@example.com';
```

---

## 📋 Part 10: Admin Dashboard Queries

### **10.1 System Health Check**

```sql
-- Complete system health overview
SELECT 
  'Users' as metric,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE role = 'admin') as admins,
  COUNT(*) FILTER (WHERE user_metadata->>'role' = 'employer') as employers,
  COUNT(*) FILTER (WHERE user_metadata->>'role' = 'promoter') as employees
FROM profiles
UNION ALL
SELECT 
  'Promoters' as metric,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE employer_id IS NOT NULL) as assigned,
  COUNT(*) FILTER (WHERE employer_id IS NULL) as unassigned,
  0 as employees
FROM promoters;
```

### **10.2 Permission Audit**

```sql
-- Audit all users and their permissions
SELECT 
  p.email,
  p.role,
  p.user_metadata->>'role' as metadata_role,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Full Access'
    WHEN p.role = 'manager' OR p.user_metadata->>'role' = 'employer' THEN '✅ Employer Access'
    WHEN p.user_metadata->>'role' = 'promoter' THEN '✅ Employee Access'
    ELSE '⚠️ Limited/Unassigned'
  END as access_level,
  p.created_at,
  p.last_sign_in_at
FROM profiles p
ORDER BY p.created_at DESC;
```

---

## ✅ Admin Quick Reference

### **Common Commands:**

```sql
-- Make user employee
UPDATE profiles SET role = 'user', user_metadata = '{"role": "promoter"}'::jsonb WHERE email = 'user@example.com';

-- Make user employer
UPDATE profiles SET role = 'manager', user_metadata = '{"role": "employer", "employer_id": "UUID"}'::jsonb WHERE email = 'user@example.com';

-- Make user admin
UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';

-- View all users
SELECT email, role, user_metadata FROM profiles ORDER BY email;

-- View all promoters by employer
SELECT employer_id, COUNT(*) FROM promoters GROUP BY employer_id;
```

---

## 🎯 Summary

As an **Admin**, you can:

1. **Review System:**
   - Check role detection via DevTools
   - Verify UI shows correct features
   - Test data filtering

2. **Manage Users:**
   - Assign roles via SQL
   - Set employer_id for employers
   - Grant/revoke permissions

3. **Monitor System:**
   - Run health checks
   - Audit permissions
   - Track user assignments

**All SQL commands are ready to use!** Just replace email addresses and UUIDs with actual values.

---

**Status:** ✅ Ready for Admin Use

