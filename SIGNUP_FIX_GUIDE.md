# 🔧 User Signup Issues - Fix Guide

## Problem
Users are getting "Database error saving new user" when trying to create accounts.

## Root Causes Identified

### 1. **Environment Configuration Issue** ❌
- Duplicate `NEXT_PUBLIC_SUPABASE_URL` entries in `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` is set to the same value as the anon key (incorrect)

### 2. **Missing/Broken Database Trigger** ❌
- The `handle_new_user()` trigger function may not exist or be working properly
- This function should automatically create user records when someone signs up

### 3. **Database Schema Issues** ❌
- Missing or incorrectly configured `users` and `profiles` tables
- Missing RLS policies that allow user creation

## Fixes Applied

### ✅ Fix 1: Environment Configuration
**File:** `.env.local`
- Fixed duplicate URL entries
- Added comment indicating the service role key needs to be replaced

**Action Required:**
1. Go to your Supabase Dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (NOT the anon key)
4. Replace `REPLACE_WITH_ACTUAL_SERVICE_ROLE_KEY` in `.env.local`
5. Restart your development server

### ✅ Fix 2: Database Schema & Trigger Function
**Files Created:**
- `fix-signup-database.sql` - Complete database setup script
- `fix-signup-issues.js` - Automated fix script

**What it does:**
- Creates/updates `users` and `profiles` tables with correct structure
- Creates the `handle_new_user()` trigger function
- Sets up proper RLS policies
- Creates necessary indexes
- Grants required permissions

### ✅ Fix 3: Enhanced Error Handling
**File:** `auth/forms/signup-form.tsx`
- Added more detailed logging
- Improved error messages for users
- Better form validation and user feedback

## How to Apply the Fixes

### Option 1: Automated Fix (Recommended)
```bash
# Step 1: Update your .env.local with the correct service role key
# Step 2: Run the automated fix script
node fix-signup-issues.js
```

### Option 2: Manual Fix
1. **Update Environment Variables:**
   - Get your service role key from Supabase Dashboard > Settings > API
   - Update `.env.local` with the correct key
   - Restart development server

2. **Run Database Setup:**
   - Go to Supabase Dashboard > SQL Editor
   - Copy and paste the contents of `fix-signup-database.sql`
   - Execute the script

3. **Test Signup:**
   - Try creating a new user account
   - Check browser console for detailed logs
   - Verify user appears in the database

## Testing the Fix

1. **Environment Test:**
   ```bash
   # Check if environment variables are properly set
   node -e "require('dotenv').config(); console.log('URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL); console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);"
   ```

2. **Database Test:**
   ```bash
   # Run the fix script to test everything
   node fix-signup-issues.js
   ```

3. **Frontend Test:**
   - Navigate to `/en/auth/signup`
   - Fill out the form with test data
   - Check browser console for detailed logs
   - Verify success/error messages

## Expected Behavior After Fix

### ✅ Successful Signup Flow:
1. User fills out signup form
2. Form validates input
3. Supabase Auth creates auth user
4. Trigger function automatically creates records in `users` and `profiles` tables
5. User receives email confirmation
6. Success message displayed
7. User redirected to login page

### ✅ Error Handling:
- Clear, user-friendly error messages
- Detailed console logs for debugging
- Proper form validation
- Network error handling

## Verification Checklist

After applying fixes, verify:

- [ ] Environment variables are correct in `.env.local`
- [ ] Development server restarts without errors
- [ ] Database connection works
- [ ] `users` and `profiles` tables exist
- [ ] `handle_new_user()` trigger function exists
- [ ] RLS policies are properly configured
- [ ] Signup form works without "Database error"
- [ ] New users appear in Supabase dashboard
- [ ] Email confirmation is sent

## Troubleshooting

### If you still get "Database error saving new user":

1. **Check Service Role Key:**
   - Ensure it's the actual service role key, not anon key
   - Key should be much longer and different from anon key

2. **Check Database Logs:**
   - Go to Supabase Dashboard > Logs
   - Look for errors during signup attempts

3. **Check Trigger Function:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT EXISTS(
     SELECT 1 FROM pg_proc p
     JOIN pg_namespace n ON p.pronamespace = n.oid
     WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
   );
   ```

4. **Check Tables:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'profiles');
   ```

5. **Manual User Creation Test:**
   ```sql
   -- Test if you can manually insert a user
   INSERT INTO public.users (email, full_name, role, status)
   VALUES ('test@example.com', 'Test User', 'user', 'pending');
   ```

## Support

If issues persist after applying these fixes:

1. Check the browser console for detailed error logs
2. Check Supabase Dashboard > Logs for database errors
3. Verify your Supabase project permissions and settings
4. Ensure your domain is added to allowed origins in Supabase Auth settings

---

**This fix addresses the "Database error saving new user" issue comprehensively and should resolve the signup problems.** 🚀
