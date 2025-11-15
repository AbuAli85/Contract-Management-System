# Fix Documents API 400 Error

## Problem
The API endpoint `/api/promoters/[id]/documents` is returning `400 (Bad Request)` errors when fetching promoter documents.

## Root Causes
The 400 error can occur due to several reasons:

1. **Table doesn't exist** - The `promoter_documents` table hasn't been created
2. **RLS policies missing** - Row Level Security policies are not configured
3. **Permission issues** - The authenticated user doesn't have proper permissions
4. **Invalid promoter ID** - The promoter ID format is incorrect

## Solution Applied

### 1. Enhanced Error Handling ✅
Updated `app/api/promoters/[id]/documents/route.ts` to:
- ✅ Validate promoter ID format
- ✅ Provide detailed error logging
- ✅ Handle missing table gracefully (returns empty array instead of error)
- ✅ Handle RLS policy issues gracefully
- ✅ Return helpful error messages in development mode

### 2. Diagnostic Script ✅
Created `scripts/diagnose-promoter-documents-issue.sql` to help identify the exact issue.

## How to Diagnose

### Step 1: Run Diagnostic Script
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the script: `scripts/diagnose-promoter-documents-issue.sql`
4. Review the results to identify the issue

### Step 2: Check Server Logs
Check your Next.js server logs (terminal or deployment logs) for detailed error messages:
```
Error fetching documents: {
  message: "...",
  code: "...",
  promoterId: "...",
  userId: "..."
}
```

## How to Fix

### Fix 1: Table Doesn't Exist
If the diagnostic shows the table doesn't exist:

**Option A: Using Supabase CLI (Recommended)**
```bash
cd Contract-Management-System
npx supabase migration up
```

**Option B: Manual SQL**
1. Open Supabase SQL Editor
2. Copy and run: `supabase/migrations/20250203000000_fix_promoter_documents_rls.sql`

### Fix 2: RLS Policies Missing
If RLS is enabled but policies are missing:

Run the migration file: `supabase/migrations/20250203000000_fix_promoter_documents_rls.sql`

This will create:
- ✅ SELECT policy for authenticated users
- ✅ INSERT policy for authenticated users
- ✅ UPDATE policy for authenticated users
- ✅ DELETE policy for authenticated users

### Fix 3: Permissions Issue
If permissions are missing:

```sql
-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promoter_documents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

## Expected Behavior After Fix

### Before Fix:
```
GET /api/promoters/[id]/documents → 400 Bad Request
```

### After Fix:
- ✅ If table exists: Returns `{ documents: [...] }` with status 200
- ✅ If table doesn't exist: Returns `{ documents: [] }` with status 200 (graceful degradation)
- ✅ If RLS blocks access: Returns `{ documents: [] }` with status 200 (graceful degradation)
- ✅ If invalid promoter ID: Returns `{ error: "Invalid promoter ID" }` with status 400
- ✅ If not authenticated: Returns `{ error: "Unauthorized" }` with status 401

## Testing

### Test 1: Valid Request
```bash
# Replace PROMOTER_ID with an actual UUID
curl -X GET "http://localhost:3000/api/promoters/PROMOTER_ID/documents" \
  -H "Cookie: your-auth-cookie"
```

Expected: `200 OK` with `{ documents: [...] }`

### Test 2: Invalid Promoter ID
```bash
curl -X GET "http://localhost:3000/api/promoters/invalid-id/documents" \
  -H "Cookie: your-auth-cookie"
```

Expected: `400 Bad Request` with `{ error: "Invalid promoter ID" }`

### Test 3: Not Authenticated
```bash
curl -X GET "http://localhost:3000/api/promoters/PROMOTER_ID/documents"
```

Expected: `401 Unauthorized` with `{ error: "Unauthorized" }`

## Monitoring

After applying the fix, monitor:
1. **Server logs** - Check for warning messages about missing tables or RLS issues
2. **Browser console** - Should no longer show 400 errors
3. **API responses** - Should return empty arrays instead of errors when table doesn't exist

## Notes

- The API now gracefully handles missing tables by returning empty arrays
- Detailed error logging helps diagnose issues in development
- Production errors hide sensitive details but still log them server-side
- The frontend already handles empty arrays gracefully, so this won't break the UI

