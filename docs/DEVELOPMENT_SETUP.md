# Development Setup Guide

## Issue: Blank Page Problem

The application was showing a blank page because the required environment variables were missing or set to placeholder values.

## Solution

### 1. Environment Variables Setup

The application requires Supabase credentials to function properly. You have two options:

#### Option A: Use Real Supabase Credentials (Recommended)

1. Create a Supabase project at https://supabase.com/dashboard
2. Get your project URL and anon key from the project settings
3. Update `.env.local` with real values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

#### Option B: Development Mode (No Supabase)

The application has been modified to work in "safe mode" when Supabase credentials are missing or are placeholder values. This allows you to see the UI and test the application structure.

### 2. Recent Fixes Applied

#### Providers Fix (`app/providers.tsx`)

- Added detection for placeholder environment variables
- Improved error handling for missing credentials
- Added timeout to prevent infinite loading

#### Login Page Fix (`app/[locale]/auth/login/page.tsx`)

- Added proper loading state display
- Separated mounting, loading, and session checks
- Shows loading message instead of blank page

### 3. How to Test

1. **With Real Supabase Credentials:**

   ```bash
   # Update .env.local with real values
   npm run dev
   # Visit http://localhost:3000/en/auth/login
   ```

2. **In Development Mode (No Supabase):**
   ```bash
   # Keep placeholder values in .env.local
   npm run dev
   # Visit http://localhost:3000/en/auth/login
   # Should show login form with "safe mode" indicators
   ```

### 4. Environment Variables Reference

```bash
# Required for full functionality
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional for webhook functionality
MAKE_SERVICE_CREATION_WEBHOOK=https://hook.eu1.make.com/your-webhook
MAKE_BOOKING_CREATED_WEBHOOK=https://hook.eu1.make.com/your-webhook
MAKE_TRACKING_UPDATED_WEBHOOK=https://hook.eu1.make.com/your-webhook
MAKE_PAYMENT_SUCCEEDED_WEBHOOK=https://hook.eu1.make.com/your-webhook
WEBHOOK_SECRET=your-webhook-secret-here

# Development settings
NODE_ENV=development
ENABLE_REQUEST_LOGGING=true
```

### 5. Troubleshooting

#### Still seeing blank page?

1. Check browser console for errors
2. Verify `.env.local` exists and has correct format
3. Restart development server: `npm run dev`

#### Authentication not working?

1. Ensure Supabase credentials are correct
2. Check Supabase project is active
3. Verify RLS policies are configured

#### Webhook errors?

1. Webhook URLs are optional for development
2. Set `WEBHOOK_SECRET` for signature verification
3. Check Make.com webhook configuration

### 6. Development Workflow

1. **Start development server:**

   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Homepage: http://localhost:3000/en
   - Login: http://localhost:3000/en/auth/login
   - Dashboard: http://localhost:3000/en/dashboard

3. **Monitor console logs:**
   - Look for "🔐" prefixed messages for auth status
   - Check for any error messages

### 7. Safe Mode Features

When running without real Supabase credentials:

- ✅ UI renders properly
- ✅ Navigation works
- ✅ Forms display (but won't submit to database)
- ✅ Component structure is visible
- ⚠️ Authentication won't work
- ⚠️ Database operations won't work
- ⚠️ Webhooks won't function

This allows you to develop and test the UI/UX without needing a full Supabase setup.
