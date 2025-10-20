# 🔍 Promoters Page - No Data Diagnostic

## 🐛 Problem

The promoters page shows 0 records even though data may exist in the database.

## 🔎 Root Causes Identified

### 1. **RLS Policies Check `profiles` Table**

The RLS policies are looking for user roles in the `profiles` table:

```sql
CREATE POLICY "Users can view all promoters" ON promoters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );
```

### 2. **API Route Checks `users` Table**

The API route queries the `users` table for role information:

```typescript
const { data: userProfile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();
```

### 3. **Table Mismatch**

**If your roles are stored in `profiles` instead of `users`, the RLS policies will fail silently!**

## ✅ Solution

Run this diagnostic SQL query in Supabase SQL Editor to identify the issue:

```sql
-- Check if tables exist and have data
SELECT
    'promoters table' as check_name,
    COUNT(*) as record_count
FROM promoters
UNION ALL
SELECT
    'users table',
    COUNT(*)
FROM users
UNION ALL
SELECT
    'profiles table',
    COUNT(*) as record_count
FROM profiles;

-- Check current user's role in both tables
SELECT
    'Current user in users table' as source,
    id,
    email,
    role,
    created_at
FROM users
WHERE id = auth.uid()
UNION ALL
SELECT
    'Current user in profiles table' as source,
    id,
    email,
    role,
    created_at
FROM profiles
WHERE id = auth.uid();

-- Check if RLS policies are blocking access
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'promoters'
ORDER BY policyname;

-- Test if user can actually see promoters
SELECT
    COUNT(*) as visible_promoter_count
FROM promoters;

-- Check if user has a role in profiles table
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        ) THEN 'User HAS valid role in profiles table'
        ELSE 'User DOES NOT have valid role in profiles table'
    END as rls_check_result;
```

## 🔧 Fixes

### Option 1: Sync User Role to Profiles Table (Recommended)

```sql
-- Create or update profile for current user
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT
    id,
    email,
    role,
    created_at,
    NOW()
FROM users
WHERE id = auth.uid()
ON CONFLICT (id)
DO UPDATE SET
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Verify the sync worked
SELECT
    'After sync - profiles table' as source,
    id,
    email,
    role
FROM profiles
WHERE id = auth.uid();
```

### Option 2: Update RLS Policies to Check `users` Table

```sql
-- Drop and recreate RLS policies to check users table instead
DROP POLICY IF EXISTS "Users can view all promoters" ON promoters;

CREATE POLICY "Users can view all promoters" ON promoters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

DROP POLICY IF EXISTS "Users can create promoters" ON promoters;

CREATE POLICY "Users can create promoters" ON promoters
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "Users can update promoters" ON promoters;

CREATE POLICY "Users can update promoters" ON promoters
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "Users can delete promoters" ON promoters;

CREATE POLICY "Users can delete promoters" ON promoters
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Option 3: Simplify RLS for Testing

```sql
-- Temporarily allow all authenticated users to see promoters
DROP POLICY IF EXISTS "Users can view all promoters" ON promoters;

CREATE POLICY "Allow read access to all authenticated users on promoters"
ON public.promoters
FOR SELECT
USING (auth.role() = 'authenticated');

-- This will let you see if data exists and if RLS was the blocker
```

## 🧪 Testing Steps

1. **Run the diagnostic SQL** to identify which table has your role
2. **Check browser console logs** - look for:
   - `✅ Successfully fetched X promoters`
   - `⚠️ No promoters found in database`
   - Any RLS or permission errors
3. **Use the Debug Component** on the promoters page:
   - Click "Test Direct API"
   - Check the response for errors
   - Look at the count returned
4. **Apply the appropriate fix** based on diagnostic results
5. **Refresh the page** and verify data appears

## 📋 Quick Checklist

- [ ] Run diagnostic SQL query
- [ ] Check if user has role in `profiles` table
- [ ] Check if user has role in `users` table
- [ ] Verify promoters table has data
- [ ] Check RLS policies are not blocking access
- [ ] Review browser console logs
- [ ] Use debug component to test API
- [ ] Apply appropriate fix
- [ ] Verify data shows on page

## 🚨 Common Causes

| Symptom                       | Cause                 | Fix                            |
| ----------------------------- | --------------------- | ------------------------------ |
| API returns `count: 0`        | RLS blocking access   | Sync role to profiles table    |
| API returns 403               | RBAC blocking API     | Set `RBAC_ENFORCEMENT=dry-run` |
| API returns error             | Missing env variables | Check `.env.local`             |
| Page shows "No promoters yet" | No data in DB         | Add test data                  |
| Debug shows wrong user        | Auth issue            | Re-login                       |

## 💡 Expected Behavior

**After fixes:**

- API should return `success: true`
- `count` should match number of promoters in database
- Frontend should display promoter cards/table
- Debug component should show green success status

---

**Created:** December 2024  
**Last Updated:** Now  
**Status:** Diagnostic guide ready
