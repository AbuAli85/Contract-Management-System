# Authentication System Setup Guide

This guide will walk you through setting up the complete authentication system for your Contract Management System.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Node.js and npm installed
- ✅ Supabase project created
- ✅ Environment variables configured
- ✅ Database access (Supabase dashboard or CLI)

## 🚀 Quick Setup

### 1. Environment Variables

Ensure your `.env.local` file contains the required Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Setup

Run the automated setup script:

```bash
node scripts/setup-auth-system.js
```

This script will:
- ✅ Create database tables (if they don't exist)
- ✅ Apply RLS policies
- ✅ Create initial admin user
- ✅ Test the authentication system

### 3. Manual Database Setup (Alternative)

If you prefer to set up the database manually:

#### Step 1: Run Database Schema
In your Supabase SQL editor, run:
```sql
-- Copy and paste the contents of database/schema.sql
```

#### Step 2: Apply RLS Policies
Run the RLS policies:
```sql
-- Copy and paste the contents of auth/sql/rls-policies.sql
```

#### Step 3: Create Admin User
```sql
-- Create admin user manually
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "System Administrator", "role": "admin", "status": "active"}'
);
```

## 🔧 Configuration

### OAuth Providers Setup

1. **GitHub OAuth**:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create new OAuth App
   - Set Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - Add Client ID and Secret to Supabase dashboard

2. **Google OAuth**:
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Set Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Add Client ID and Secret to Supabase dashboard

### Supabase Dashboard Configuration

1. **Authentication Settings**:
   - Go to Authentication > Settings
   - Configure site URL and redirect URLs
   - Enable email confirmations (optional)

2. **OAuth Providers**:
   - Go to Authentication > Providers
   - Enable and configure GitHub and Google
   - Add your OAuth credentials

## 🧪 Testing

### Run Authentication Tests

```bash
# Run all authentication tests
npm test auth/tests/auth.test.tsx

# Or use the test runner script
node scripts/test-auth.js
```

### Manual Testing

1. **Test Login Flow**:
   - Navigate to `/auth/login`
   - Try logging in with admin credentials
   - Verify redirect to dashboard

2. **Test Signup Flow**:
   - Navigate to `/auth/signup`
   - Create a new user account
   - Verify email confirmation (if enabled)

3. **Test Profile Management**:
   - Navigate to `/auth/profile`
   - Update profile information
   - Verify changes are saved

4. **Test Role-Based Access**:
   - Try accessing admin-only pages
   - Verify proper access control

### Debug Page

Access the debug page at `/debug-auth` to:
- Inspect authentication state
- Test role and permission functions
- View session information
- Manually refresh roles and sessions

## 🔒 Security Checklist

### Database Security
- ✅ RLS policies applied
- ✅ User isolation enforced
- ✅ Role-based access implemented
- ✅ Audit logging enabled

### Application Security
- ✅ Environment variables secured
- ✅ HTTPS enforced
- ✅ Session management implemented
- ✅ Input validation in place

### OAuth Security
- ✅ OAuth providers configured
- ✅ Redirect URLs secured
- ✅ Client secrets protected

## 🚨 Troubleshooting

### Common Issues

1. **"Table doesn't exist" errors**:
   ```bash
   # Run the database schema
   node scripts/setup-auth-system.js
   ```

2. **RLS policy errors**:
   ```bash
   # Check if RLS is enabled
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```

3. **Authentication not working**:
   - Check environment variables
   - Verify Supabase URL and keys
   - Check browser console for errors

4. **OAuth not working**:
   - Verify OAuth provider configuration
   - Check redirect URLs
   - Ensure client secrets are correct

### Debug Commands

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.auth.getSession().then(console.log);
"

# Run setup with verbose logging
DEBUG=* node scripts/setup-auth-system.js
```

## 📚 API Reference

### AuthProvider Context

```typescript
const {
  user,           // Current user object
  profile,        // User profile data
  roles,          // User roles array
  loading,        // Loading state
  signIn,         // Login function
  signUp,         // Registration function
  signOut,        // Logout function
  hasRole,        // Role checking function
  hasPermission   // Permission checking function
} = useAuth()
```

### Protected Routes

```typescript
// Basic protection
<AuthenticatedLayout>
  <ProtectedComponent />
</AuthenticatedLayout>

// Role-based protection
<AuthenticatedLayout requiredRoles={['admin', 'manager']}>
  <AdminComponent />
</AuthenticatedLayout>

// Permission-based protection
<AuthenticatedLayout requiredPermissions={['users.edit']}>
  <UserEditComponent />
</AuthenticatedLayout>
```

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Logs**:
   - Check user activity logs
   - Monitor authentication failures
   - Review OAuth usage

2. **Update Dependencies**:
   ```bash
   npm update @supabase/supabase-js
   npm update @supabase/ssr
   ```

3. **Backup Database**:
   - Regular database backups
   - Export user data
   - Backup RLS policies

### Security Updates

1. **Password Policies**:
   - Update minimum password requirements
   - Implement password expiration
   - Add MFA requirements

2. **Session Management**:
   - Review session timeout settings
   - Implement session invalidation
   - Add device tracking

## 📞 Support

If you encounter issues:

1. Check the debug page: `/debug-auth`
2. Review the test logs
3. Check Supabase dashboard logs
4. Verify environment variables
5. Test with the setup script

## 🎉 Success!

Once setup is complete, you should have:

- ✅ Working authentication system
- ✅ Role-based access control
- ✅ User profile management
- ✅ OAuth integration
- ✅ Secure session handling
- ✅ Comprehensive testing

Your authentication system is now ready for production use! 