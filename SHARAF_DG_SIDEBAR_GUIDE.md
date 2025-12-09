# 📋 Sharaf DG in Sidebar - Verification Guide

## ✅ Good News!

**Sharaf DG is already configured in the sidebar!**

It's located in the **"Contract Management"** section with:

- **Label**: Sharaf DG Deployment
- **Arabic**: إلحاق شرف DG
- **Icon**: Building icon
- **Badge**: "PDF"
- **Route**: `/[locale]/contracts/sharaf-dg`

---

## 🔍 Why You Might Not See It

### 1. **Permission Required**

You need the **`contract:create`** permission to see this menu item.

**Check your permissions:**

1. Log in to your application
2. Go to your profile or dashboard
3. Check if you have "Contract Create" permission

### 2. **Sidebar Collapsed**

The sidebar might be collapsed (hidden).

**Solution:**

- Look for a hamburger menu icon (☰) or collapse button
- Click it to expand the sidebar

### 3. **Wrong Sidebar Component**

You might be using a different sidebar component.

**Which sidebar are you using?**

- `permission-aware-sidebar.tsx` ✅ Has Sharaf DG
- `simple-sidebar.tsx` ✅ Has Sharaf DG
- `sidebar.tsx` ❌ Might not have it

---

## 🎯 Where to Find It

### In the Sidebar Menu:

```
📊 Dashboard
   └─ Main Dashboard
   └─ Overview
   └─ Analytics

📄 Contract Management  👈 LOOK HERE
   ├─ eXtra Contracts
   ├─ General Contracts
   ├─ Sharaf DG Deployment  ⭐ HERE IT IS!
   ├─ View Contracts
   ├─ Pending Contracts
   └─ Approved Contracts

👥 Promoter Management
   └─ ...
```

---

## 🚀 Direct Access

**Even if you don't see it in the sidebar**, you can access it directly:

### URLs:

- **English**: `/en/contracts/sharaf-dg`
- **Arabic**: `/ar/contracts/sharaf-dg`

### Full URLs (example):

- Local: `http://localhost:3000/en/contracts/sharaf-dg`
- Production: `https://your-domain.com/en/contracts/sharaf-dg`

---

## 🔧 Fix: Grant Yourself Permission

If you're an admin and need to grant yourself the permission:

### Option 1: Via Database

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Grant contract:create permission
INSERT INTO user_permissions (user_id, permission_key, granted_by)
VALUES ('your-user-id', 'contract:create', 'system')
ON CONFLICT DO NOTHING;
```

### Option 2: Via Admin Panel

1. Go to `/en/dashboard/roles` (if you're admin)
2. Find your role
3. Enable "Contract Create" permission
4. Save changes

### Option 3: Update Your Role

```sql
-- Make yourself an admin (has all permissions)
UPDATE profiles
SET role = 'admin'
WHERE id = 'your-user-id';
```

---

## ✅ Verification Steps

1. **Clear browser cache**
   - Hard refresh: `Ctrl + Shift + R` (Windows)
   - Or: `Cmd + Shift + R` (Mac)

2. **Check permissions**
   - Open browser console (F12)
   - Type: `localStorage.getItem('userPermissions')`
   - Should include `"contract:create"`

3. **Try direct URL**
   - Go to: `/en/contracts/sharaf-dg`
   - Should load the form

4. **Check sidebar code**
   - File: `components/permission-aware-sidebar.tsx`
   - Lines: 168-175
   - Should show Sharaf DG config

---

## 🎨 What It Looks Like

When visible, the menu item shows:

```
📄 Contract Management
   ├─ eXtra Contracts
   ├─ General Contracts
   ├─ 🏢 Sharaf DG Deployment [PDF]  👈 This is it!
   ├─ View Contracts
```

The **[PDF]** badge indicates automated PDF generation.

---

## 🐛 Still Not Showing?

### Debug Steps:

1. **Check which sidebar is being used:**
   - Open DevTools (F12)
   - Go to Elements tab
   - Search for "permission-aware-sidebar"
   - If not found, search for "simple-sidebar"

2. **Check permissions in console:**

```javascript
// In browser console
console.log(localStorage.getItem('userRole'));
console.log(localStorage.getItem('userPermissions'));
```

3. **Force show by updating permission check:**
   - Temporarily remove permission requirement
   - Or grant yourself all permissions

4. **Check if locale is set:**

```javascript
// In browser console
console.log(window.location.pathname);
// Should include /en/ or /ar/
```

---

## 📝 Configuration Summary

### Current Config (Already Done ✅):

**File**: `components/permission-aware-sidebar.tsx`

```typescript
{
  href: `/${locale}/contracts/sharaf-dg`,
  label: 'Sharaf DG Deployment',
  labelAr: 'إلحاق شرف DG',
  icon: Building2,
  permission: 'contract:create',  👈 REQUIRES THIS PERMISSION
  badge: 'PDF',
  badgeVariant: 'secondary',
}
```

**File**: `app/[locale]/contracts/sharaf-dg/page.tsx`

```typescript
export default function SharafDGContractsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <SharafDGDeploymentForm />
    </div>
  );
}
```

✅ Both files exist and are properly configured!

---

## 🎯 Quick Fix

**If you just want to access it now:**

### Navigate directly to:

```
/en/contracts/sharaf-dg
```

Or add this to your browser favorites for quick access!

---

## 📞 Still Need Help?

If the sidebar still doesn't show it:

1. **Share screenshot** of your sidebar
2. **Check your role**: `SELECT role FROM profiles WHERE id = 'your-id'`
3. **Check permissions**: `SELECT * FROM user_permissions WHERE user_id = 'your-id'`
4. **Try incognito mode** (to rule out cache issues)

---

## ✅ Summary

- ✅ Sharaf DG **IS** in the sidebar code
- ✅ Page route **EXISTS**
- ✅ Component **EXISTS**
- ⚠️ Requires **`contract:create`** permission
- 🔗 Direct URL: `/en/contracts/sharaf-dg`

**Most likely solution**: Grant yourself the `contract:create` permission!

---

**Created**: October 26, 2025
**Status**: ✅ Already Configured
**Action Needed**: Grant permission or use direct URL
