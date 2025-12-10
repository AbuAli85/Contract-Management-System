# 🧪 Promoter Intelligence Hub - Role-Based Testing & Verification Guide

## 📋 Overview

This guide explains how to verify and test the role-based features for **Employers** and **Employees** in the Promoter Intelligence Hub.

---

## 🔍 How to Check User Roles

### **Method 1: Check User Metadata in Database**

```sql
-- Check user role in profiles table
SELECT id, email, role, user_metadata 
FROM profiles 
WHERE email = 'user@example.com';

-- Check for employer_id or company_id in user_metadata
SELECT 
  id,
  email,
  role,
  user_metadata->>'employer_id' as employer_id,
  user_metadata->>'company_id' as company_id,
  user_metadata->>'role' as metadata_role
FROM profiles;
```

### **Method 2: Check in Browser Console**

1. Open the Promoter Intelligence Hub page
2. Open Browser DevTools (F12)
3. In Console, run:

```javascript
// Check current user role context
// The role context is available in React DevTools
// Or check localStorage/sessionStorage for user data

// Check Supabase session
const { data: { session } } = await supabase.auth.getSession();
console.log('User Role:', session?.user?.user_metadata?.role);
console.log('Employer ID:', session?.user?.user_metadata?.employer_id);
console.log('Company ID:', session?.user?.user_metadata?.company_id);
```

### **Method 3: Check via React DevTools**

1. Install React DevTools browser extension
2. Open React DevTools
3. Find `RoleContextProvider` component
4. Inspect the `value` prop to see:
   - `userRole`: 'employer' | 'employee' | 'admin' | 'manager' | 'viewer'
   - `isEmployer`: boolean
   - `isEmployee`: boolean
   - `employerId`: string | null
   - All permission flags

### **Method 4: Visual UI Indicators**

**For Employees:**
- Header shows "My Profile" instead of full dashboard
- No filters, bulk actions, or analytics tabs
- Only their own profile is visible
- Document status cards are prominent

**For Employers:**
- Full dashboard header with metrics
- Filters and search available
- Bulk actions toolbar visible
- Analytics view accessible
- Can see all assigned promoters

---

## 🎯 Features by Role

### **👤 Employee Role Features**

#### **What Employees CAN See:**
- ✅ **Own Profile View**
  - Personal information (name, email, phone, nationality)
  - Job title and assignment details
  - Document status (ID Card, Passport)
  - Document expiry dates and warnings
  - Action required alerts

- ✅ **Document Management**
  - View document status
  - See expiry dates
  - Download own documents (if implemented)
  - View compliance status

- ✅ **Self-Service Actions**
  - Edit own profile (if `canEdit` permission)
  - Download documents
  - View assignment information

#### **What Employees CANNOT See:**
- ❌ Other promoters' profiles
- ❌ Filters and search
- ❌ Bulk actions
- ❌ Analytics dashboard
- ❌ Export functionality
- ❌ Create/Edit/Delete other promoters
- ❌ Assignment management

#### **UI Elements for Employees:**
```
┌─────────────────────────────────────┐
│  My Profile                         │
├─────────────────────────────────────┤
│  [Profile Card]                     │
│  - Name, Email, Phone               │
│  - Job Title                        │
│  - Assignment Info                  │
│                                     │
│  [Document Status Cards]            │
│  - ID Card Status                   │
│  - Passport Status                  │
│                                     │
│  [Action Alerts]                    │
│  - Expired/Expiring Documents       │
└─────────────────────────────────────┘
```

---

### **🏢 Employer Role Features**

#### **What Employers CAN See:**
- ✅ **Full Dashboard**
  - All assigned promoters (filtered by `employer_id`)
  - Workforce metrics and statistics
  - Compliance rate tracking
  - Document expiry monitoring

- ✅ **Advanced Filtering**
  - Search by name, email, phone
  - Filter by status (active, critical, warning)
  - Filter by document health
  - Filter by assignment status
  - Advanced multi-criteria filters

- ✅ **Bulk Operations**
  - Select multiple promoters
  - Bulk actions (activate, deactivate, assign, etc.)
  - Bulk export
  - Bulk notifications

- ✅ **Analytics & Reports**
  - Analytics dashboard
  - Charts and visualizations
  - Document status distribution
  - Monthly trends
  - Top job titles/companies

- ✅ **Management Actions**
  - Create new promoters
  - Edit assigned promoters
  - Export data (CSV, Excel, JSON)
  - Manage assignments
  - Send notifications

#### **What Employers CANNOT Do:**
- ❌ View other employers' promoters
- ❌ Delete promoters (unless admin)
- ❌ Access system-wide settings
- ❌ View all promoters (only their assigned ones)

#### **UI Elements for Employers:**
```
┌─────────────────────────────────────┐
│  Promoter Intelligence Hub          │
│  [Metrics Cards] [Refresh] [Add]    │
├─────────────────────────────────────┤
│  [Advanced Filters]                 │
│  [Quick Filters] [Search]           │
├─────────────────────────────────────┤
│  [Bulk Actions Toolbar]             │
├─────────────────────────────────────┤
│  [Promoters Table/Grid]             │
│  - All assigned promoters           │
│  - Sortable columns                 │
│  - Inline editing                   │
├─────────────────────────────────────┤
│  [Analytics View]                   │
│  - Charts                           │
│  - Statistics                       │
└─────────────────────────────────────┘
```

---

### **👑 Admin Role Features**

#### **What Admins CAN Do:**
- ✅ **Everything Employers Can Do PLUS:**
  - View ALL promoters (not filtered by employer)
  - Delete promoters
  - System-wide analytics
  - Access all settings
  - Manage all assignments
  - Full system access

---

## 🧪 Testing Checklist

### **Test 1: Employee View**

1. **Setup:**
   ```sql
   -- Set user as employee
   UPDATE profiles 
   SET user_metadata = jsonb_set(
     COALESCE(user_metadata, '{}'::jsonb),
     '{role}',
     '"promoter"'
   )
   WHERE email = 'employee@example.com';
   ```

2. **Verify:**
   - [ ] Header shows "My Profile" (not full dashboard)
   - [ ] Only one profile visible (their own)
   - [ ] No filters section
   - [ ] No bulk actions toolbar
   - [ ] No analytics tab
   - [ ] Document status cards visible
   - [ ] Edit button visible (if permission allows)
   - [ ] Download documents button visible

3. **Expected URL Filter:**
   - API call should include: `?userId=<employee-user-id>`
   - Only returns their own profile

---

### **Test 2: Employer View**

1. **Setup:**
   ```sql
   -- Set user as employer with employer_id
   UPDATE profiles 
   SET user_metadata = jsonb_set(
     jsonb_set(
       COALESCE(user_metadata, '{}'::jsonb),
       '{role}',
       '"employer"'
     ),
     '{employer_id}',
     '"<employer-uuid>"'
   )
   WHERE email = 'employer@example.com';
   ```

2. **Verify:**
   - [ ] Full dashboard header visible
   - [ ] Metrics cards showing assigned promoters count
   - [ ] Filters section visible
   - [ ] Bulk actions toolbar visible
   - [ ] Analytics view accessible
   - [ ] Can create new promoters
   - [ ] Can edit assigned promoters
   - [ ] Can export data
   - [ ] Only sees promoters with matching `employer_id`

3. **Expected URL Filter:**
   - API call should include: `?employerId=<employer-id>`
   - Only returns promoters where `employer_id` matches

---

### **Test 3: Admin View**

1. **Setup:**
   ```sql
   -- Set user as admin
   UPDATE profiles 
   SET role = 'admin'
   WHERE email = 'admin@example.com';
   ```

2. **Verify:**
   - [ ] Full dashboard visible
   - [ ] Can see ALL promoters (no filtering)
   - [ ] Can delete promoters
   - [ ] All features enabled
   - [ ] System-wide analytics

3. **Expected URL Filter:**
   - API call should NOT include `employerId` or `userId`
   - Returns all promoters

---

## 🔧 How to Change User Roles for Testing

### **Option 1: Direct Database Update**

```sql
-- Make user an employee
UPDATE profiles 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{role}',
  '"promoter"'
)
WHERE email = 'test@example.com';

-- Make user an employer
UPDATE profiles 
SET user_metadata = jsonb_set(
  jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    '"employer"'
  ),
  '{employer_id}',
  '"your-employer-uuid-here"'
)
WHERE email = 'test@example.com';

-- Make user an admin
UPDATE profiles 
SET role = 'admin'
WHERE email = 'test@example.com';
```

### **Option 2: Via Supabase Dashboard**

1. Go to Supabase Dashboard
2. Navigate to Authentication > Users
3. Find the user
4. Edit `user_metadata`:
   ```json
   {
     "role": "employer",
     "employer_id": "uuid-here",
     "company_id": "uuid-here"
   }
   ```
   OR
   ```json
   {
     "role": "promoter"
   }
   ```

### **Option 3: Via Application UI (if implemented)**

- Use the user management interface
- Edit user profile
- Change role and metadata

---

## 📊 Role Detection Logic

The system detects roles in this order:

1. **Check if Admin:**
   ```typescript
   if (isAdmin()) → userRole = 'admin'
   ```

2. **Check if Manager:**
   ```typescript
   if (isManager()) → userRole = 'manager' (acts as employer)
   ```

3. **Check User Metadata:**
   ```typescript
   if (user_metadata.role === 'employer' || 
       user_metadata.employer_id || 
       user_metadata.company_id) 
   → userRole = 'employer'
   ```

4. **Check if Employee:**
   ```typescript
   if (user_metadata.role === 'promoter' || 
       user_metadata.role === 'employee' || 
       role === 'promoter' || 
       role === 'user') 
   → userRole = 'employee'
   ```

5. **Default:**
   ```typescript
   → userRole = 'viewer'
   ```

---

## 🎨 Visual Differences

### **Employee View:**
- Simple header: "My Profile"
- Single profile card
- Document status cards
- No navigation tabs
- No filters
- Minimal UI

### **Employer View:**
- Premium header with metrics
- Full filtering system
- Bulk actions toolbar
- Analytics tabs
- Table/grid view
- Export buttons
- Rich UI with charts

---

## 🔐 Permission Matrix Quick Reference

| Feature | Employee | Employer | Admin |
|---------|----------|----------|-------|
| View Own Profile | ✅ | ✅ | ✅ |
| View Assigned Promoters | ❌ | ✅ | ✅ |
| View All Promoters | ❌ | ❌ | ✅ |
| Create Promoters | ❌ | ✅ | ✅ |
| Edit Promoters | ❌* | ✅ | ✅ |
| Delete Promoters | ❌ | ❌ | ✅ |
| Export Data | ❌ | ✅ | ✅ |
| Bulk Actions | ❌ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| Filters | ❌ | ✅ | ✅ |
| Manage Assignments | ❌ | ✅ | ✅ |

*Employees can edit their own profile if `canEdit` permission is granted.

---

## 🐛 Troubleshooting

### **Issue: User sees wrong view**

**Check:**
1. User metadata in database
2. Session metadata
3. Role in profiles table
4. Browser cache (clear and refresh)

**Fix:**
```sql
-- Verify user metadata
SELECT id, email, role, user_metadata 
FROM profiles 
WHERE email = 'user@example.com';

-- Update if needed
UPDATE profiles 
SET user_metadata = '{"role": "employer", "employer_id": "uuid"}'::jsonb
WHERE email = 'user@example.com';
```

### **Issue: Employee sees all promoters**

**Check:**
- API filter is working: Look for `userId` parameter in network tab
- Role context is correctly detecting employee role

**Fix:**
- Verify `roleContext.isEmployee` is `true`
- Check API call includes `userId` filter

### **Issue: Employer sees all promoters**

**Check:**
- API filter is working: Look for `employerId` parameter
- `employer_id` is correctly set in user metadata

**Fix:**
- Verify `roleContext.employerId` is set
- Check API call includes `employerId` filter
- Ensure promoters have matching `employer_id`

---

## 📝 Testing Script

### **Quick Test Script:**

```javascript
// Run in browser console on Promoter Intelligence Hub page

// 1. Check current role
const checkRole = () => {
  // This will be available via React DevTools
  console.log('Check React DevTools > RoleContextProvider > value');
};

// 2. Check API calls
// Open Network tab and filter for "promoters"
// Look for query parameters:
// - For employees: ?userId=...
// - For employers: ?employerId=...
// - For admins: (no filter params)

// 3. Check UI elements
const checkUI = () => {
  const header = document.querySelector('header');
  const filters = document.querySelector('[aria-labelledby="filters-heading"]');
  const bulkActions = document.querySelector('[aria-labelledby="bulk-actions-heading"]');
  
  console.log('Header:', header?.textContent);
  console.log('Filters visible:', !!filters);
  console.log('Bulk Actions visible:', !!bulkActions);
};
```

---

## ✅ Verification Checklist

### **For Employees:**
- [ ] Header shows "My Profile"
- [ ] Only one profile visible
- [ ] No filters section
- [ ] No bulk actions
- [ ] Document status cards visible
- [ ] API call includes `userId` parameter
- [ ] Cannot access analytics
- [ ] Cannot create/edit other promoters

### **For Employers:**
- [ ] Full dashboard header visible
- [ ] Metrics show assigned promoters count
- [ ] Filters section visible
- [ ] Bulk actions toolbar visible
- [ ] Can see only assigned promoters
- [ ] API call includes `employerId` parameter
- [ ] Can create new promoters
- [ ] Can edit assigned promoters
- [ ] Can export data
- [ ] Analytics view accessible

### **For Admins:**
- [ ] Full dashboard visible
- [ ] Can see ALL promoters
- [ ] No filtering by employer
- [ ] All features enabled
- [ ] Can delete promoters
- [ ] System-wide analytics

---

## 🚀 Quick Start Testing

1. **Create Test Users:**
   ```sql
   -- Employee
   INSERT INTO profiles (id, email, role, user_metadata)
   VALUES (
     gen_random_uuid(),
     'employee@test.com',
     'user',
     '{"role": "promoter"}'::jsonb
   );

   -- Employer
   INSERT INTO profiles (id, email, role, user_metadata)
   VALUES (
     gen_random_uuid(),
     'employer@test.com',
     'manager',
     '{"role": "employer", "employer_id": "your-employer-uuid"}'::jsonb
   );
   ```

2. **Login as each user and verify:**
   - Employee sees only their profile
   - Employer sees only assigned promoters
   - Admin sees all promoters

3. **Check Network Tab:**
   - Verify API calls include correct filter parameters
   - Verify response data matches role permissions

---

## 📚 Additional Resources

- **Role Context Component:** `components/promoters/promoters-role-context.tsx`
- **Employee View:** `components/promoters/promoters-employee-view.tsx`
- **Employer Dashboard:** `components/promoters/promoters-employer-dashboard.tsx`
- **Main View:** `components/promoters/enhanced-promoters-view-refactored.tsx`

---

**Last Updated:** Current Date  
**Status:** Ready for Testing ✅

