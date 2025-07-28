# Manual Database Setup Guide

Since the automated setup script encountered some issues with SQL execution, here's how to manually set up the authentication system database.

## 🔧 **Step 1: Apply RLS Policies Manually**

Go to your **Supabase Dashboard > SQL Editor** and run these commands one by one:

### Enable RLS on Tables
```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on permissions table
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_activity_log table
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
```

### Users Table Policies
```sql
-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role and status)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        role = OLD.role AND
        status = OLD.status
    );

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can create users
CREATE POLICY "Admins can create users" ON users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update all users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Managers can view users in their department
CREATE POLICY "Managers can view department users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users manager
            WHERE manager.id = auth.uid() 
            AND manager.role = 'manager'
            AND manager.department = users.department
        )
    );
```

### Permissions Table Policies
```sql
-- Policy: All authenticated users can view permissions
CREATE POLICY "Authenticated users can view permissions" ON permissions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only admins can manage permissions
CREATE POLICY "Admins can manage permissions" ON permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### User Activity Log Policies
```sql
-- Policy: Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON user_activity_log
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: System can insert activity logs
CREATE POLICY "System can insert activity logs" ON user_activity_log
    FOR INSERT
    WITH CHECK (true);

-- Policy: Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON user_activity_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Grant Permissions
```sql
-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.user_activity_log TO authenticated;
GRANT INSERT ON public.user_activity_log TO authenticated;

-- Grant permissions to service role (for admin operations)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.user_activity_log TO service_role;
```

## 👤 **Step 2: Create Admin User**

### Option A: Via Supabase Dashboard

1. Go to **Supabase Dashboard > Authentication > Users**
2. Click **"Add User"**
3. Fill in the details:
   - **Email**: `admin@example.com`
   - **Password**: `admin123`
   - **Email Confirmed**: ✅ Check this
4. Click **"Create User"**

### Option B: Via SQL (if you have the user ID)

```sql
-- Insert admin user profile (replace USER_ID with actual auth.users ID)
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    permissions,
    created_at,
    updated_at
) VALUES (
    'USER_ID_FROM_AUTH_USERS',
    'admin@example.com',
    'System Administrator',
    'admin',
    'active',
    ARRAY[
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete',
        'dashboard.view', 'analytics.view', 'settings.view', 'settings.edit'
    ],
    NOW(),
    NOW()
);
```

## 🧪 **Step 3: Test the Setup**

### Test Login
1. Go to your application's login page
2. Try logging in with:
   - **Email**: `admin@example.com`
   - **Password**: `admin123`

### Test Profile Access
1. After login, navigate to `/auth/profile`
2. Verify you can see and edit your profile

### Test Debug Page
1. Navigate to `/debug-auth`
2. Verify all authentication state is displayed correctly

## 🔍 **Step 4: Verify RLS Policies**

### Test User Isolation
```sql
-- This should only return the current user's profile
SELECT * FROM users WHERE id = auth.uid();
```

### Test Admin Access
```sql
-- This should return all users if you're an admin
SELECT * FROM users;
```

## 🚨 **Troubleshooting**

### If Login Fails
1. Check if the user exists in **Authentication > Users**
2. Reset the password in the dashboard
3. Verify the user profile exists in the `users` table

### If RLS Policies Don't Work
1. Verify RLS is enabled: `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';`
2. Check policy existence: `SELECT * FROM pg_policies WHERE tablename = 'users';`
3. Test with service role to bypass RLS

### If Profile Access Fails
1. Check if the user profile exists in `public.users`
2. Verify the user ID matches between `auth.users` and `public.users`
3. Check RLS policies are correctly applied

## ✅ **Success Indicators**

You'll know the setup is complete when:

1. ✅ You can log in with `admin@example.com` / `admin123`
2. ✅ You can access `/auth/profile` and see your profile
3. ✅ You can access `/debug-auth` and see authentication state
4. ✅ RLS policies are working (users can only see their own data)
5. ✅ Admin users can see all user data

## 🔄 **Next Steps**

After manual setup is complete:

1. **Change the admin password** immediately
2. **Configure OAuth providers** in Supabase dashboard
3. **Test the authentication flows** manually
4. **Run the application** and verify everything works

---

**The manual setup should resolve the issues encountered with the automated script!** 🚀 