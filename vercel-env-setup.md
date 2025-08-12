# Vercel Environment Variables Setup

## 🚨 Critical: Set These Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Open your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**

### Step 2: Add These Variables

**For All Environments (Production, Preview, Development):**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://reootcngcptfogfozlmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDQzODIsImV4cCI6MjA2OTAyMDM4Mn0.WQwDpYX2M4pyPaliUqTinwy1xWWFKm4OntN2HUfP6n0
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE

# Development Configuration
NODE_ENV = production
```

### Step 3: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger a new deployment

## 🔧 Alternative: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
vercel --prod
```

## ✅ After Setup

Once environment variables are set, the deployment should succeed and your application will be live with:

- ✅ Working Supabase connection
- ✅ Functional authentication
- ✅ Working contract forms
- ✅ Universal navigation
