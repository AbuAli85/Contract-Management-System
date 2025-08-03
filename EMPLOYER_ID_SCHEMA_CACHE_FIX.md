# Employer ID Schema Cache Fix Guide

## 🚨 **Issue Description**

The application is showing the error:
```
Could not find the 'employer_id' column of 'promoters' in the schema cache
```

This indicates a **schema cache synchronization issue** between the application's ORM and the actual database schema.

## 🔍 **Root Cause Analysis**

### **What Happened:**
1. **Migration 003** (`scripts/003_alter_promoters_refactor.sql`) **removed** the `employer_id` column from the `promoters` table
2. **Migration 024** (`scripts/024_add_employer_id_to_promoters.sql`) was supposed to **add it back**, but may not have been executed
3. **Application code** still references `employer_id` in multiple places
4. **Supabase schema cache** is out of sync with the actual database

### **Affected Components:**
- Promoter forms and management
- Excel import functionality
- Contract creation and management
- Data analysis tools
- API endpoints

## ✅ **Diagnostic Results**

Based on the diagnostic results, the **database schema is actually correct**:

```json
[
  {
    "table_exists": true
  }
]

[
  {
    "constraint_name": "fk_promoters_employer_id",
    "column_name": "employer_id",
    "foreign_table_name": "parties",
    "foreign_column_name": "id"
  },
  {
    "constraint_name": "fk_promoters_outsourced_to_id",
    "column_name": "outsourced_to_id",
    "foreign_table_name": "parties",
    "foreign_column_name": "id"
  }
]
```

**This means the issue is with the Supabase client's schema cache, not the database itself.**

## 🛠️ **Solution Steps**

### **Step 1: Run the Client Cache Refresh Script**

Run the client cache refresh script in Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor
\i scripts/026_refresh_supabase_client_cache.sql
```

This script will:
- ✅ Force refresh of the schema cache
- ✅ Test all columns including `employer_id`
- ✅ Verify foreign key relationships
- ✅ Provide detailed status report

### **Step 2: Use the Client-Side Schema Cache Refresh**

The application now includes automatic schema cache refresh functionality:

#### **Automatic Detection**
The `SchemaCacheRefreshBanner` component will automatically:
- ✅ Detect schema cache issues
- ✅ Show a user-friendly error message
- ✅ Provide one-click fix button
- ✅ Auto-hide when resolved

#### **Manual Refresh**
You can also manually refresh the schema cache:

```typescript
import { refreshSupabaseSchemaCache } from '@/lib/supabase/refresh-schema-cache'

// Refresh the schema cache
const result = await refreshSupabaseSchemaCache()
if (result.success) {
  console.log('Schema cache refreshed successfully')
}
```

### **Step 3: Add the Banner Component to Your Pages**

Add the schema cache refresh banner to your pages:

```tsx
import { SchemaCacheRefreshBanner } from '@/components/schema-cache-refresh-banner'

export default function YourPage() {
  return (
    <div>
      <SchemaCacheRefreshBanner 
        onRefresh={() => {
          // Reload the page or refresh data
          window.location.reload()
        }}
      />
      {/* Your page content */}
    </div>
  )
}
```

### **Step 4: Verify the Fix**

After applying the fix, test these application features:

- ✅ **Promoter Management**: Create/edit promoters
- ✅ **Excel Import**: Import promoters with company assignments
- ✅ **Contract Creation**: Create contracts with employer relationships
- ✅ **Data Analysis**: Run promoter analysis tools
- ✅ **API Endpoints**: Test all promoter-related APIs

## 🔧 **Manual Fix (If Scripts Don't Work)**

If the automated solutions don't resolve the issue, manually run these commands:

### **1. Force Schema Cache Refresh**

```sql
-- Force a schema refresh by querying the table
SELECT * FROM promoters LIMIT 1;

-- Check column information
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'promoters' 
ORDER BY ordinal_position;

-- Test specific columns
SELECT id, name_en, employer_id, outsourced_to_id 
FROM promoters 
LIMIT 1;
```

### **2. Client-Side Manual Refresh**

```typescript
// In browser console or application code
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Force refresh by querying the table
const { data, error } = await supabase
  .from('promoters')
  .select('employer_id, outsourced_to_id, job_title, work_location')
  .limit(1)

console.log('Schema cache test result:', { data, error })
```

## 🧪 **Testing the Fix**

### **1. Test Database Queries**

```sql
-- Test that employer_id column is accessible
SELECT id, name_en, employer_id FROM promoters LIMIT 5;

-- Test foreign key relationship
SELECT p.id, p.name_en, p.employer_id, pt.name as employer_name
FROM promoters p
LEFT JOIN parties pt ON p.employer_id = pt.id
LIMIT 5;
```

### **2. Test Application Features**

After applying the fix, test these application features:

- ✅ **Promoter Management**: Create/edit promoters
- ✅ **Excel Import**: Import promoters with company assignments
- ✅ **Contract Creation**: Create contracts with employer relationships
- ✅ **Data Analysis**: Run promoter analysis tools
- ✅ **API Endpoints**: Test all promoter-related APIs

### **3. Verify No More Errors**

Check that the error message no longer appears:
- ✅ No "Could not find the 'employer_id' column" errors
- ✅ All promoter forms load correctly
- ✅ All data operations work as expected

## 🔄 **Prevention Measures**

### **1. Migration Best Practices**

- ✅ Always test migrations in development first
- ✅ Use `IF EXISTS` and `IF NOT EXISTS` clauses
- ✅ Never drop columns without proper data migration
- ✅ Document all schema changes

### **2. Schema Cache Management**

- ✅ Regularly refresh schema cache after migrations
- ✅ Monitor for schema cache issues
- ✅ Use proper migration sequencing

### **3. Code Consistency**

- ✅ Keep TypeScript types in sync with database schema
- ✅ Update validation schemas when schema changes
- ✅ Test all affected components after schema changes

## 📋 **Files Modified**

### **New Files Created:**
1. `scripts/check_promoters_schema.sql` - Diagnostic script
2. `scripts/025_fix_employer_id_schema_cache.sql` - Comprehensive fix
3. `scripts/refresh_supabase_schema_cache.sql` - Cache refresh
4. `scripts/026_refresh_supabase_client_cache.sql` - Client cache refresh
5. `lib/supabase/refresh-schema-cache.ts` - Client-side cache refresh utilities
6. `hooks/use-schema-cache-refresh.ts` - React hook for cache management
7. `components/schema-cache-refresh-banner.tsx` - UI component for cache issues
8. `EMPLOYER_ID_SCHEMA_CACHE_FIX.md` - This guide

### **Existing Files That Reference employer_id:**
- `components/promoter-form-professional.tsx`
- `components/excel-import-modal.tsx`
- `components/enhanced-contract-form.tsx`
- `app/[locale]/manage-promoters/page.tsx`
- `lib/types.ts`
- `lib/schemas/promoter-validation.ts`
- And many more...

## 🎯 **Expected Outcome**

After applying this fix:

1. ✅ **Schema Cache Synchronized**: Application recognizes all columns
2. ✅ **No More Errors**: "employer_id column not found" error resolved
3. ✅ **Full Functionality**: All promoter features work correctly
4. ✅ **Data Integrity**: Foreign key relationships maintained
5. ✅ **Performance**: Proper indexes in place
6. ✅ **Automatic Detection**: Future schema cache issues will be automatically detected and fixed

## 🆘 **Troubleshooting**

### **If the fix doesn't work:**

1. **Check Supabase Dashboard**: Verify migrations ran successfully
2. **Restart Application**: Sometimes needed after schema changes
3. **Clear Browser Cache**: Clear any cached schema information
4. **Check Migration Logs**: Look for any failed migrations
5. **Use Manual Refresh**: Try the manual refresh commands
6. **Contact Support**: If issues persist

### **Common Issues:**

- **Migration Failed**: Check Supabase logs for error details
- **Permission Issues**: Ensure proper database permissions
- **Cache Persistence**: May need to restart the application
- **Type Mismatches**: Verify TypeScript types match database schema
- **Client Cache Stale**: Use the client-side refresh utilities

## 🚀 **Quick Fix**

For immediate resolution, add this to your main layout or problematic pages:

```tsx
import { SchemaCacheRefreshBanner } from '@/components/schema-cache-refresh-banner'

// Add this component to your layout
<SchemaCacheRefreshBanner 
  onRefresh={() => window.location.reload()}
  showSuccess={true}
  autoHide={true}
/>
```

This will automatically detect and fix schema cache issues with a single click!

This comprehensive fix should resolve the schema cache issue and restore full functionality to the promoter management system. 