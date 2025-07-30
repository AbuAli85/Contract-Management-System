# Database Setup Guide

## Quick Fix for Schema Error

If you're getting the error `column "category" of relation "permissions" does not exist`, follow these steps:

### Option 1: Manual SQL Execution (Recommended)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run these commands one by one:**

```sql
-- Step 1: Drop existing tables if they exist
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    avatar_url TEXT,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    permissions TEXT[],
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Step 3: Create permissions table
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert permissions
INSERT INTO permissions (id, name, description, category) VALUES
('users.view', 'View Users', 'Can view user list and details', 'User Management'),
('users.create', 'Create Users', 'Can create new users', 'User Management'),
('users.edit', 'Edit Users', 'Can edit user information', 'User Management'),
('users.delete', 'Delete Users', 'Can delete users', 'User Management'),
('users.bulk', 'Bulk Actions', 'Can perform bulk operations on users', 'User Management'),
('contracts.view', 'View Contracts', 'Can view contracts', 'Contract Management'),
('contracts.create', 'Create Contracts', 'Can create new contracts', 'Contract Management'),
('contracts.edit', 'Edit Contracts', 'Can edit contracts', 'Contract Management'),
('contracts.delete', 'Delete Contracts', 'Can delete contracts', 'Contract Management'),
('contracts.approve', 'Approve Contracts', 'Can approve contracts', 'Contract Management'),
('dashboard.view', 'View Dashboard', 'Can view dashboard', 'Dashboard'),
('analytics.view', 'View Analytics', 'Can view analytics and reports', 'Dashboard'),
('reports.generate', 'Generate Reports', 'Can generate reports', 'Dashboard'),
('settings.view', 'View Settings', 'Can view system settings', 'System'),
('settings.edit', 'Edit Settings', 'Can edit system settings', 'System'),
('logs.view', 'View Logs', 'Can view system logs', 'System'),
('backup.create', 'Create Backups', 'Can create system backups', 'System');

-- Step 5: Create activity log table
CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at);

-- Step 7: Create admin user
INSERT INTO users (
    email,
    full_name,
    role,
    status,
    permissions,
    email_verified,
    created_at
) VALUES (
    'admin@example.com',
    'System Administrator',
    'admin',
    'active',
    ARRAY[
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.bulk',
        'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete', 'contracts.approve',
        'dashboard.view', 'analytics.view', 'reports.generate',
        'settings.view', 'settings.edit', 'logs.view', 'backup.create'
    ],
    TRUE,
    NOW()
);

-- Step 8: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id OR
                     EXISTS (
                         SELECT 1 FROM users
                         WHERE id = auth.uid()
                         AND (role = 'admin' OR permissions @> ARRAY['users.view'])
                     ));

CREATE POLICY "Only admins and authorized users can create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (role = 'admin' OR permissions @> ARRAY['users.create'])
        )
    );

CREATE POLICY "Only admins and authorized users can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (role = 'admin' OR permissions @> ARRAY['users.edit'])
        )
    );

CREATE POLICY "Only admins and authorized users can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (role = 'admin' OR permissions @> ARRAY['users.delete'])
        )
    );

CREATE POLICY "Users can view own activity" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id OR
                     EXISTS (
                         SELECT 1 FROM users
                         WHERE id = auth.uid()
                         AND (role = 'admin' OR permissions @> ARRAY['logs.view'])
                     ));

CREATE POLICY "System can insert activity logs" ON user_activity_log
    FOR INSERT WITH CHECK (true);
```

### Option 2: Using the Setup Script

1. **Install dependencies:**

```bash
npm install dotenv
```

2. **Set up environment variables** in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. **Run the setup script:**

```bash
node scripts/setup-database.js
```

### Option 3: Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Verification

After setup, verify everything works:

1. **Check tables exist:**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'permissions', 'user_activity_log');
```

2. **Check admin user:**

```sql
SELECT email, role, permissions FROM users WHERE email = 'admin@example.com';
```

3. **Check permissions:**

```sql
SELECT COUNT(*) FROM permissions;
```

## Troubleshooting

### Common Issues:

1. **"relation does not exist"**
   - Make sure you're in the correct database
   - Check if tables were created successfully

2. **"permission denied"**
   - Use the service role key, not the anon key
   - Check RLS policies

3. **"duplicate key value"**
   - The admin user already exists
   - This is normal, you can ignore this error

### Reset Everything:

If you need to start fresh:

```sql
-- Drop everything
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run the setup commands again
```

## Next Steps

After successful database setup:

1. **Start your development server:**

```bash
pnpm run dev
```

2. **Navigate to the user management page:**

```
http://localhost:3000/en/dashboard/users
```

3. **Test the functionality:**
   - Try adding a new user
   - Test the permissions manager
   - Verify bulk operations work

## Support

If you're still having issues:

1. Check the Supabase logs in your dashboard
2. Verify your environment variables are correct
3. Make sure you're using the service role key for setup
4. Check the browser console for any frontend errors
