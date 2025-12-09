# 🚀 Vercel Environment Setup Guide

## ❌ Current Issue

Your Vercel build is failing because **environment variables are missing**. The diagnostic shows:

```
⚠️  NEXT_PUBLIC_SUPABASE_URL is not set (might be needed for production)
⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is not set (might be needed for production)
⚠️  SUPABASE_SERVICE_ROLE_KEY is not set (might be needed for production)
```

## ✅ Solution: Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your project: `Contract-Management-System`
3. Click on the project

### Step 2: Navigate to Settings

1. Click on **"Settings"** tab
2. Click on **"Environment Variables"** in the left sidebar

### Step 3: Add Required Environment Variables

Add these **3 critical environment variables**:

#### 1. `NEXT_PUBLIC_SUPABASE_URL`

- **Value**: Your Supabase project URL
- **Example**: `https://your-project-id.supabase.co`
- **Environment**: Production, Preview, Development
- **Description**: Public Supabase URL for client-side operations

#### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Value**: Your Supabase anon/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environment**: Production, Preview, Development
- **Description**: Public Supabase key for client-side authentication

#### 3. `SUPABASE_SERVICE_ROLE_KEY`

- **Value**: Your Supabase service role key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environment**: Production, Preview, Development
- **Description**: Service role key for server-side operations

### Step 4: Find Your Supabase Keys

If you don't have your Supabase keys:

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 5: Redeploy

After adding the environment variables:

1. Go back to your Vercel project
2. Click on **"Deployments"** tab
3. Click the **"..."** menu on the latest deployment
4. Click **"Redeploy"**

## 🔍 Alternative: Check Your Local Environment

If you have a `.env.local` file, you can copy the values from there:

```bash
# Check your local environment variables
cat .env.local
```

## 📋 Environment Variables Summary

| Variable                        | Required | Description          |
| ------------------------------- | -------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅ Yes   | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes   | Public Supabase key  |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅ Yes   | Service role key     |

## 🎯 Expected Result

After setting these environment variables and redeploying:

- ✅ Build should complete successfully
- ✅ No more "unexpected error" messages
- ✅ Application should work in production

## 🆘 If Still Failing

If the build still fails after setting environment variables:

1. Check the **Build Logs** in Vercel dashboard for specific error messages
2. Ensure all environment variables are set for **all environments** (Production, Preview, Development)
3. Verify the Supabase keys are correct and not expired
4. Contact Vercel support if the issue persists

---

**Note**: Your local build works perfectly, confirming the code is correct. The issue is purely environmental configuration.
