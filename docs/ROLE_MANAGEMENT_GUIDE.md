# Role Management Guide

## Overview

The Contract Management System uses a comprehensive Role-Based Access Control (RBAC) system to manage user permissions across all features. This guide explains how roles work, how to troubleshoot role issues, and how to ensure consistent role management.

## 🔐 Role System Architecture

### Role Hierarchy

1. **Admin** - Full system access with all permissions
2. **Manager** - Limited administrative access (can create/update, but not delete)
3. **User** - Basic contract operations (read/create own contracts)
4. **Viewer** - Read-only access

### Role Sources

The system checks for user roles in the following order:

1. **users** table (primary source)
2. **profiles** table (fallback)
3. **app_users** table (fallback)
4. **Default** - Falls back to 'admin' for testing

### Permission Matrix

| Feature                   | Admin | Manager | User | Viewer |
| ------------------------- | ----- | ------- | ---- | ------ |
| **Contract Management**   |
| Create Contract           | ✅    | ✅      | ✅   | ❌     |
| View Contracts            | ✅    | ✅      | ✅   | ✅     |
| Edit Contract             | ✅    | ✅      | ❌   | ❌     |
| Delete Contract           | ✅    | ❌      | ❌   | ❌     |
| Generate Contract         | ✅    | ✅      | ❌   | ❌     |
| Export Contracts          | ✅    | ✅      | ❌   | ❌     |
| **Promoter Management**   |
| Create Promoter           | ✅    | ✅      | ❌   | ❌     |
| View Promoters            | ✅    | ✅      | ✅   | ❌     |
| Edit Promoter             | ✅    | ✅      | ❌   | ❌     |
| Delete Promoter           | ✅    | ❌      | ❌   | ❌     |
| **Party Management**      |
| Create Party              | ✅    | ✅      | ❌   | ❌     |
| View Parties              | ✅    | ✅      | ✅   | ❌     |
| Edit Party                | ✅    | ✅      | ❌   | ❌     |
| Delete Party              | ✅    | ❌      | ❌   | ❌     |
| **User Management**       |
| Create User               | ✅    | ❌      | ❌   | ❌     |
| View Users                | ✅    | ✅      | ❌   | ❌     |
| Edit User                 | ✅    | ❌      | ❌   | ❌     |
| Delete User               | ✅    | ❌      | ❌   | ❌     |
| **System Administration** |
| Access Settings           | ✅    | ❌      | ❌   | ❌     |
| View Analytics            | ✅    | ✅      | ❌   | ❌     |
| Audit Logs                | ✅    | ✅      | ❌   | ❌     |
| Notifications             | ✅    | ✅      | ❌   | ❌     |

## 🚨 Common Role Issues

### Issue 1: Role Changes from Admin to User

**Symptoms:**

- User logs in as admin but role shows as "user"
- Permissions are restricted unexpectedly
- Navigation items disappear

**Causes:**

1. RBACProvider not properly initialized
2. Role cache conflicts
3. Database role not properly set
4. Multiple role sources conflicting

**Solutions:**

#### Solution 1: Refresh Role

```typescript
// Use the role refresh button in the UI
// Or call the API directly
const response = await fetch('/api/refresh-user-role', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
```

#### Solution 2: Force Admin Role

```typescript
// Call the force admin API
const response = await fetch('/api/force-admin-role', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
```

#### Solution 3: Clear Browser Cache

1. Clear localStorage: `localStorage.clear()`
2. Clear sessionStorage: `sessionStorage.clear()`
3. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Issue 2: Inconsistent Role Across Pages

**Symptoms:**

- Role shows correctly on dashboard but changes on contract pages
- Different permissions on different pages
- Navigation shows different role than expected

**Causes:**

1. RBACProvider not wrapping all pages
2. Role loading timing issues
3. Component re-rendering causing role reset

**Solutions:**

#### Solution 1: Ensure RBACProvider is Active

Check that `app/providers.tsx` includes:

```typescript
<RBACProvider user={user}>
  {children}
</RBACProvider>
```

#### Solution 2: Add Role Refresh to Problem Pages

```typescript
import { RoleRefreshButton } from '@/components/role-refresh-button'

// Add to page header
<RoleRefreshButton variant="ghost" size="sm" />
```

#### Solution 3: Use Role Debug Panel

```typescript
// RoleDebugPanel component has been removed for optimization
// Use browser console debugging instead
```

### Issue 3: Role Not Loading

**Symptoms:**

- Role shows as "user" or "undefined"
- Permissions not working
- Loading state stuck

**Causes:**

1. Database connection issues
2. RLS policies blocking access
3. User record not created in database

**Solutions:**

#### Solution 1: Check Database Tables

```sql
-- Check if user exists in users table
SELECT * FROM users WHERE id = 'user-uuid';

-- Check if user exists in profiles table
SELECT * FROM profiles WHERE id = 'user-uuid';

-- Check if user exists in app_users table
SELECT * FROM app_users WHERE id = 'user-uuid';
```

#### Solution 2: Create User Record

```sql
-- Insert user into users table
INSERT INTO users (id, email, role, created_at)
VALUES ('user-uuid', 'user@example.com', 'admin', NOW())
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

#### Solution 3: Check RLS Policies

```sql
-- Disable RLS temporarily for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS after testing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## 🛠️ Debugging Tools

### 1. Role Debug Panel

The role debug panel shows detailed information about:

- Current user and role
- Role sources
- All permissions
- Debug information

**Usage:**

```typescript
// RoleDebugPanel component has been removed for optimization
// Use browser console debugging instead
```

### 2. Role Refresh Button

Quick way to refresh user role:

```typescript
// RoleRefreshButton component has been removed for optimization
// Use page refresh instead
```

### 3. Browser Console Debugging

```javascript
// Check current role in localStorage
localStorage.getItem('user_role_user-uuid');

// Check permanent role
localStorage.getItem('permanent_role_user-uuid');

// Clear all role cache
localStorage.clear();
```

### 4. API Endpoints for Debugging

#### Get Current Role

```bash
GET /api/get-user-role
```

#### Refresh Role

```bash
POST /api/refresh-user-role
```

#### Force Admin Role

```bash
POST /api/force-admin-role
```

#### Immediate Role Refresh

```bash
POST /api/immediate-role-refresh
```

## 🔧 Implementation Best Practices

### 1. Always Use Permission Checks

```typescript
import { usePermissions } from '@/hooks/use-permissions';

const permissions = usePermissions();

// Check specific permission
if (permissions.can('contract:create')) {
  // Show create button
}

// Check multiple permissions
if (permissions.canAny(['contract:create', 'contract:edit'])) {
  // Show action
}
```

### 2. Add Permission Guards to Components

```typescript
import { PermissionGuard } from '@/components/permission-guard'

<PermissionGuard action="contract:delete">
  <Button onClick={handleDelete}>Delete</Button>
</PermissionGuard>
```

### 3. Handle Role Loading States

```typescript
const permissions = usePermissions()

if (permissions.isLoading) {
  return <div>Loading permissions...</div>
}

if (!permissions.role) {
  return <div>No role assigned</div>
}
```

### 4. Cache Role Information

```typescript
// Role is automatically cached in localStorage
// But you can also cache in sessionStorage for session persistence
sessionStorage.setItem('current_role', permissions.role);
```

## 🚀 Production Deployment

### 1. Environment Variables

```env
# Ensure these are set in production
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Setup

```sql
-- Ensure RLS policies are correct
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create proper policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3. Monitoring

- Monitor role loading times
- Track role refresh frequency
- Alert on role inconsistencies
- Log role changes for audit

## 📋 Troubleshooting Checklist

When a user reports role issues:

1. **Check Current Role**
   - Use role debug panel
   - Check browser console
   - Verify database record

2. **Refresh Role**
   - Use role refresh button
   - Call refresh API
   - Clear browser cache

3. **Verify Database**
   - Check user exists in tables
   - Verify role field is set
   - Check RLS policies

4. **Test Permissions**
   - Use permission debug panel
   - Test specific actions
   - Verify UI reflects permissions

5. **Check Environment**
   - Verify environment variables
   - Check Supabase connection
   - Test API endpoints

6. **Escalate if Needed**
   - Force admin role
   - Recreate user record
   - Check system logs

## 🎯 Quick Fixes

### For Role Changing from Admin to User:

1. Click "Refresh Role" button
2. If that doesn't work, clear browser cache
3. If still not working, call `/api/force-admin-role`

### For Inconsistent Permissions:

1. Add role debug panel to the page
2. Check if RBACProvider is active
3. Verify permission checks are implemented

### For Role Not Loading:

1. Check database connection
2. Verify user record exists
3. Check RLS policies
4. Try force admin role API

This guide should help resolve most role management issues. If problems persist, check the system logs and consider escalating to system administration.
