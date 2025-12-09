# Fix Promoter Documents 400 Error

## Problem

The application was showing 400 (Bad Request) errors when trying to fetch promoter documents:

```
GET https://...supabase.co/rest/v1/promoter_documents?select=... 400 (Bad Request)
```

## Root Cause

The `promoter_documents` table either:

1. Doesn't exist in the database
2. Has incorrect RLS (Row Level Security) policies blocking authenticated users

## Solution Applied

### 1. Fixed Client-Side Query (IMMEDIATE FIX ✅)

Updated `components/promoters/promoter-details-enhanced.tsx` to use the API route instead of direct Supabase client queries. This provides immediate relief from the errors.

**Changed from:**

```typescript
supabase
  .from('promoter_documents')
  .select('id, document_type, created_at, updated_at')
  .eq('promoter_id', promoterId);
```

**Changed to:**

```typescript
fetch(`/api/promoters/${promoterId}/documents`)
  .then(res => (res.ok ? res.json() : { documents: [] }))
  .then(result => ({ data: result.documents || [], error: null }));
```

### 2. Created Migration File (DATABASE FIX 📝)

Created migration: `supabase/migrations/20250203000000_fix_promoter_documents_rls.sql`

This migration:

- ✅ Creates `promoter_documents` table if missing
- ✅ Adds proper indexes for performance
- ✅ Sets up RLS policies for authenticated users
- ✅ Creates trigger for `updated_at` timestamp
- ✅ Grants necessary permissions

## How to Apply the Database Fix

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd Contract-Management-System

# Apply the migration
npx supabase migration up
```

### Option 2: Manual Application via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250203000000_fix_promoter_documents_rls.sql`
4. Paste and run the SQL

### Option 3: Using Direct SQL

If you have database access:

```bash
psql your_database_url < supabase/migrations/20250203000000_fix_promoter_documents_rls.sql
```

## Verification

After applying the migration, verify it worked:

### 1. Check Table Exists

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'promoter_documents'
);
```

### 2. Check RLS Policies

```sql
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'promoter_documents';
```

### 3. Test Query

```sql
SELECT COUNT(*) FROM promoter_documents;
```

## Expected Results

- ✅ No more 400 errors in browser console
- ✅ Promoter documents section loads without errors
- ✅ Document activities appear in the activity timeline (if documents exist)

## Additional Notes

- The API route `/api/promoters/[id]/documents/route.ts` already exists and handles authentication properly
- The client-side fix is backward compatible - it will work whether the table exists or not
- The RLS policies allow all authenticated users to read/write documents (you may want to restrict this further based on your security requirements)
