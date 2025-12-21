# 🔐 How to Access Company Permissions Page

**Date:** December 21, 2025

---

## 🎯 **Access Methods**

### **Method 1: From Cross-Company Dashboard** ✅ (Recommended)

1. Navigate to **Cross-Company Dashboard**
   - URL: `/en/dashboard/companies`
   - Or click "Companies" in the navigation menu

2. Find the company you want to manage permissions for

3. Click the **three dots menu** (⋮) on the company card

4. Click **"Manage Permissions"** from the dropdown menu

5. You'll be taken to: `/en/dashboard/companies/permissions?company_id={id}`

---

### **Method 2: Direct URL Access**

Navigate directly to:
```
/en/dashboard/companies/permissions?company_id={company-id}
```

**Example:**
```
/en/dashboard/companies/permissions?company_id=123e4567-e89b-12d3-a456-426614174000
```

---

### **Method 3: From Company Settings**

1. Navigate to **Company Settings**
   - URL: `/en/settings/company`
   - Or from the company dropdown menu

2. Look for **"Permissions"** or **"Manage Permissions"** button/link

3. Click to access permissions page

---

## 🔑 **Who Can Access?**

### **Permission Requirements:**

- ✅ **Company Owners** - Full access
- ✅ **Company Admins** - Full access
- ❌ **Managers** - No access (cannot manage permissions)
- ❌ **Members** - No access (cannot manage permissions)

---

## 📋 **What You Can Do on Permissions Page**

1. **View All Users**
   - See all users with access to the company
   - View their current permissions

2. **Grant Permissions**
   - Select a user
   - Choose a permission to grant
   - Optionally set expiration date
   - Click "Grant Permission"

3. **Revoke Permissions**
   - Click the **X** button on any permission badge
   - Confirm revocation

4. **View Permission Details**
   - See when permission was granted
   - See who granted the permission
   - See expiration date (if set)

---

## 🎨 **Page Features**

### **Company Selector**
- If you have access to multiple companies, you can switch between them
- Dropdown shows all your companies
- URL updates automatically when switching

### **User List**
- Shows all users with access to the selected company
- Displays user avatar, name, and email
- Shows all granted permissions as badges

### **Grant Permission Dialog**
- Select user from dropdown
- Select permission type
- Set expiration date (optional)
- Grant permission with one click

---

## 🔗 **Quick Links**

### **From Dashboard:**
```
Dashboard → Companies → [Company Card] → ⋮ Menu → Manage Permissions
```

### **Direct Navigation:**
```typescript
router.push(`/en/dashboard/companies/permissions?company_id=${companyId}`);
```

### **From Code:**
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push(`/en/dashboard/companies/permissions?company_id=${companyId}`);
```

---

## 📱 **Navigation Structure**

```
Dashboard
  └── Companies (/en/dashboard/companies)
       └── [Company Card]
            └── ⋮ Menu
                 ├── Edit Company
                 ├── Company Settings
                 ├── Manage Permissions ← NEW!
                 └── Delete Company (if owner)
```

---

## ✅ **Quick Access Checklist**

- [ ] Navigate to `/en/dashboard/companies`
- [ ] Find your company card
- [ ] Click three dots (⋮) menu
- [ ] Click "Manage Permissions"
- [ ] Select user and grant/revoke permissions

---

## 🎯 **Summary**

**Access URL:** `/en/dashboard/companies/permissions?company_id={id}`

**Quick Access:**
1. Go to Cross-Company Dashboard
2. Click ⋮ menu on company card
3. Click "Manage Permissions"

**That's it!** 🎉

---

**Last Updated:** December 21, 2025

