# 🔐 Company Permissions System Guide

**Date:** December 21, 2025

---

## 📋 **Overview**

The Company Permissions System allows you to grant specific permissions to users for company actions (create, edit, delete, view, settings, manage members, invite users). This provides fine-grained access control beyond just role-based permissions.

---

## 🎯 **Features**

1. **Granular Permissions** - Assign specific permissions to users per company
2. **Role-Based Fallback** - Works alongside existing role-based permissions
3. **Expiration Support** - Set expiration dates for temporary permissions
4. **Easy Management** - Simple UI to grant/revoke permissions
5. **Secure** - Only company owners/admins can manage permissions

---

## 📊 **Available Permissions**

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `company:create` | Create new companies | Owner, Admin |
| `company:edit` | Edit company details | Owner, Admin, Manager |
| `company:delete` | Delete company | Owner only |
| `company:view` | View company information | All roles |
| `company:settings` | Manage company settings | Owner, Admin |
| `company:manage_members` | Add/remove company members | Owner, Admin |
| `company:invite_users` | Invite users to company | Owner, Admin |

---

## 🗄️ **Database Schema**

### **Table: `company_permissions`**

```sql
CREATE TABLE company_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  permission VARCHAR(100) NOT NULL,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, company_id, permission)
);
```

---

## 🔌 **API Endpoints**

### **1. Get Permissions**

**GET** `/api/company/permissions?company_id={id}&user_id={id}`

**Response:**
```json
{
  "success": true,
  "permissions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "company_id": "uuid",
      "permission": "company:edit",
      "granted": true,
      "granted_by": "uuid",
      "granted_at": "2025-12-21T10:00:00Z",
      "expires_at": null,
      "is_active": true
    }
  ]
}
```

### **2. Grant Permission**

**POST** `/api/company/permissions`

**Body:**
```json
{
  "company_id": "uuid",
  "user_id": "uuid",
  "permission": "company:edit",
  "expires_at": "2025-12-31T23:59:59Z" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "permission": { ... },
  "message": "Permission granted successfully"
}
```

### **3. Revoke Permission**

**DELETE** `/api/company/permissions?company_id={id}&user_id={id}&permission={permission}`

**Response:**
```json
{
  "success": true,
  "message": "Permission revoked successfully"
}
```

---

## 💻 **Usage Examples**

### **1. Check Permission in Code**

```typescript
import { hasCompanyPermission } from '@/lib/company-permissions';

// Check if user can edit a company
const canEdit = await hasCompanyPermission(
  userId,
  companyId,
  'company:edit'
);

if (canEdit) {
  // Allow editing
}
```

### **2. Get All User Permissions**

```typescript
import { getUserCompanyPermissions } from '@/lib/company-permissions';

// Get all permissions for a user in a company
const permissions = await getUserCompanyPermissions(userId, companyId);

// permissions = ['company:view', 'company:edit', 'company:settings']
```

### **3. Use in React Component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { hasCompanyPermission } from '@/lib/company-permissions';

export function CompanyCard({ companyId, userId }) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      const hasPermission = await hasCompanyPermission(
        userId,
        companyId,
        'company:edit'
      );
      setCanEdit(hasPermission);
    }
    checkPermission();
  }, [userId, companyId]);

  return (
    <div>
      {canEdit && (
        <button>Edit Company</button>
      )}
    </div>
  );
}
```

---

## 🎨 **UI Component**

### **CompanyPermissionsManager Component**

```typescript
import { CompanyPermissionsManager } from '@/components/company-permissions-manager';

<CompanyPermissionsManager
  companyId={companyId}
  companyName="My Company"
  onClose={() => setIsOpen(false)}
/>
```

**Features:**
- View all users and their permissions
- Grant new permissions
- Revoke existing permissions
- Set expiration dates
- Visual badges for permissions

---

## 🔄 **How It Works**

### **Permission Check Flow**

```
1. User attempts action (e.g., edit company)
   ↓
2. System checks role-based permissions first
   - Owner → All permissions
   - Admin → Most permissions (except delete)
   - Manager → View and edit
   ↓
3. If role doesn't grant permission, check explicit permissions
   - Query company_permissions table
   - Check if permission is granted and active
   - Check if permission hasn't expired
   ↓
4. Grant or deny access based on result
```

### **Granting Permissions**

```
1. Company owner/admin opens permissions manager
   ↓
2. Selects user and permission
   ↓
3. Optionally sets expiration date
   ↓
4. Clicks "Grant Permission"
   ↓
5. System creates/updates company_permissions record
   ↓
6. Permission is immediately active
```

---

## 🔒 **Security**

1. **Access Control**
   - Only company owners and admins can grant/revoke permissions
   - Users can view their own permissions
   - RLS policies enforce access control

2. **Validation**
   - Permission values are validated against allowed list
   - Expiration dates are checked on every permission check
   - Soft delete (is_active = false) instead of hard delete

3. **Audit Trail**
   - `granted_by` tracks who granted the permission
   - `granted_at` tracks when permission was granted
   - `updated_at` tracks last modification

---

## 📝 **Migration**

To set up the permissions system:

1. **Run Migration:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/migrations/20251221_company_permissions.sql
   ```

2. **Verify Tables:**
   ```sql
   SELECT * FROM company_permissions LIMIT 1;
   ```

3. **Test Functions:**
   ```sql
   SELECT has_company_permission(
     'user-uuid',
     'company-uuid',
     'company:edit'
   );
   ```

---

## 🧪 **Testing**

### **Test Scenarios:**

1. **Grant Permission:**
   - [ ] Owner grants edit permission to member
   - [ ] Member can now edit company
   - [ ] Permission appears in permissions list

2. **Revoke Permission:**
   - [ ] Owner revokes permission
   - [ ] Member can no longer perform action
   - [ ] Permission removed from list

3. **Expiration:**
   - [ ] Grant permission with expiration date
   - [ ] Permission works before expiration
   - [ ] Permission stops working after expiration

4. **Role Fallback:**
   - [ ] User without explicit permission but with role
   - [ ] Role-based permission still works
   - [ ] Explicit permission overrides role if needed

---

## 🎯 **Best Practices**

1. **Use Explicit Permissions Sparingly**
   - Prefer role-based permissions when possible
   - Use explicit permissions for special cases

2. **Set Expiration Dates**
   - For temporary access, always set expiration
   - Review expired permissions regularly

3. **Document Permissions**
   - Keep track of why permissions were granted
   - Use comments or notes field if available

4. **Regular Audits**
   - Review permissions periodically
   - Remove unused or expired permissions
   - Verify users still need their permissions

---

## 📚 **Related Files**

- `supabase/migrations/20251221_company_permissions.sql` - Database schema
- `app/api/company/permissions/route.ts` - API endpoints
- `lib/company-permissions.ts` - Utility functions
- `components/company-permissions-manager.tsx` - UI component
- `app/[locale]/dashboard/companies/page.tsx` - Dashboard integration

---

## 🎉 **Summary**

The Company Permissions System provides:
- ✅ Fine-grained access control
- ✅ Easy permission management
- ✅ Expiration support
- ✅ Secure and auditable
- ✅ Works with existing role system

**You can now grant specific permissions to any user for company actions!**

---

**Last Updated:** December 21, 2025

