# 🚀 Quick Start: Company Permissions

## Step 1: Run Database Migration

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20251221_company_permissions.sql
```

## Step 2: Grant Permission via API

```typescript
// Grant edit permission to a user
const response = await fetch('/api/company/permissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company_id: 'company-uuid',
    user_id: 'user-uuid',
    permission: 'company:edit',
  }),
});
```

## Step 3: Use in Component

```typescript
import { useCompanyActions } from '@/hooks/use-company-permissions';

function CompanyCard({ companyId, userRole }) {
  const { canEdit, canDelete } = useCompanyActions(companyId, userRole);

  return (
    <div>
      {canEdit() && <button>Edit</button>}
      {canDelete() && <button>Delete</button>}
    </div>
  );
}
```

## Step 4: Manage Permissions UI

```typescript
import { CompanyPermissionsManager } from '@/components/company-permissions-manager';

<CompanyPermissionsManager
  companyId={companyId}
  companyName="My Company"
/>
```

That's it! 🎉

