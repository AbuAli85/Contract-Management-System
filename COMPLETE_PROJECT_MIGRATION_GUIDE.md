# Complete Project Migration Guide

## 🚨 CRITICAL: Migrating to New Supabase Project

You're experiencing issues because your application is still pointing to the old Supabase project. This guide will help you migrate everything to the new project.

## 📋 Step-by-Step Migration

### Step 1: Get New Project Credentials

1. **Go to your new Supabase project**: https://supabase.com/dashboard/project/reootcngcptfogfozlmz
2. **Click "Settings"** → **"API"**
3. **Copy these values:**
   - **Project URL**: `https://reootcngcptfogfozlmz.supabase.co`
   - **anon public key**: (the long string starting with `eyJ...`)

### Step 2: Update Environment Variables

**Edit your `.env` file** and replace:

```env
# OLD VALUES (REMOVE THESE)
NEXT_PUBLIC_SUPABASE_URL=https://ekdjxzhujettocosgzql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4dEssMk6wd_UQ5yNT1CfV6BAicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTkxMDYsImV4cCI6MjA2NDg5NTEwNn0.6VGbocKFVLNX_MCIOwFtdEssMk6wd_UQ5yNT1CfV6BA

# NEW VALUES (ADD THESE)
NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key_here
```

### Step 3: Restore Database Schema

1. **Go to SQL Editor** in your new Supabase project
2. **Create new query** and paste the content from `restore-database-schema.sql`
3. **Run the query**
4. **Create another query** and paste the content from `setup-storage-bucket.sql`
5. **Run the query**

### Step 4: Update Make.com Configuration

**In your Make.com scenario:**

1. **Update Supabase connection** with new project URL and API key
2. **Update webhook URLs** if they reference the old project
3. **Test all webhook connections**

### Step 5: Restart Application

```bash
# Stop current server
Ctrl+C

# Start with new environment variables
npm run dev
```

### Step 6: Test Everything

1. **Frontend**: Check if data loads properly
2. **Backend**: Test API endpoints
3. **Make.com**: Test webhook connections
4. **Document upload**: Test file uploads

## 🔍 Troubleshooting

### If you get "Invalid API key":
- Make sure you copied the correct anon key from the new project
- Check that the key starts with `eyJ` and is very long

### If tables don't appear:
- Make sure you ran both SQL scripts
- Check that you're in the correct project

### If Make.com webhooks fail:
- Update the webhook URLs to use the new project
- Test the webhook connections in Make.com

### If frontend shows no data:
- Restart your development server after updating .env
- Clear browser cache
- Check browser console for errors

## ✅ Verification Checklist

- [ ] New project URL in .env file
- [ ] New API key in .env file
- [ ] Database schema restored
- [ ] Storage bucket created
- [ ] Development server restarted
- [ ] Frontend loads data
- [ ] Make.com webhooks working
- [ ] Document upload working

## 🎯 Expected Result

After completing these steps:
- ✅ All systems connected to new project
- ✅ Database schema restored
- ✅ Frontend working properly
- ✅ Backend API working
- ✅ Make.com integrations working
- ✅ Document uploads working
- ✅ No more "all damages" issues 