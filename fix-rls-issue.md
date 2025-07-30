# Fix RLS (Row Level Security) Issue for User Management

## Problem

You're getting this error when trying to add users:

```
new row violates row-level security policy for table "app_users"
```

## Solution

### Option 1: Disable RLS Temporarily (Quick Fix)

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run this SQL command:

```sql
-- Disable RLS on app_users table
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON app_users TO authenticated;
GRANT USAGE ON SEQUENCE app_users_id_seq TO authenticated;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'app_users';
```

### Option 2: Fix RLS Policies (Recommended)

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run this SQL command:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

-- Create new permissive policies for development
CREATE POLICY "Enable select for authenticated users" ON app_users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON app_users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON app_users
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON app_users
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON app_users TO authenticated;
GRANT USAGE ON SEQUENCE app_users_id_seq TO authenticated;
```

### Option 3: Use API Routes (Already Implemented)

The User Management System now uses API routes that bypass RLS policies. The system will:

1. Try the API route first (`/api/users`)
2. If that fails, fall back to direct Supabase calls
3. Show helpful error messages if permissions are denied

## Testing

After applying the fix:

1. Go to your dashboard: `/en/dashboard` or `/ar/dashboard`
2. Click the **Users** icon in the sidebar
3. Try adding a new user
4. The system should work without RLS errors

## Security Note

- **Option 1** disables security completely (use only for development)
- **Option 2** allows all authenticated users to manage users (use for testing)
- **Option 3** uses server-side API routes with proper authentication checks (recommended for production)

## Production Setup

For production, you should:

1. Re-enable RLS: `ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;`
2. Create proper role-based policies
3. Use the API routes for all user management operations
4. Implement proper admin role checking

## Current Status

✅ **User Management System is implemented**
✅ **API routes are created**
✅ **Fallback error handling is in place**
✅ **UI is fully functional**

The only issue is the RLS policies need to be configured in your Supabase database.
