# Database Restoration Guide

## 🚨 CRITICAL ISSUE: Missing Database Tables

Your Supabase project shows **"No tables or views"** in the Table Editor. This means your entire database schema has been lost or reset.

## 🔧 Solution: Restore Database Schema

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/reootcngcptfogfozlmz
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Restore Complete Database Schema

Copy and paste the entire content from `restore-database-schema.sql` into the SQL Editor and run it.

This will create:

- ✅ `parties` table (companies, individuals, government entities)
- ✅ `promoters` table (with all fields including new ones)
- ✅ `contracts` table
- ✅ `users` table
- ✅ `audit_logs` table
- ✅ All necessary indexes and relationships
- ✅ Row Level Security (RLS) policies
- ✅ Sample data for testing

### Step 3: Setup Storage Bucket

After the schema is restored, run the storage bucket setup:

1. Create another new query in SQL Editor
2. Copy and paste the content from `setup-storage-bucket.sql`
3. Run the query

This will create:

- ✅ `promoter-documents` storage bucket
- ✅ RLS policies for document security
- ✅ Automatic cleanup of orphaned files

### Step 4: Verify Restoration

After running both scripts, check:

1. **Table Editor** - You should see all tables listed
2. **Storage** - You should see the `promoter-documents` bucket
3. **Your web application** - Should now work properly

## 📋 What This Restores

### Core Tables:

- **`promoters`** - All promoter information with 50+ fields
- **`parties`** - Companies, individuals, government entities
- **`contracts`** - Contract management
- **`users`** - Application users
- **`audit_logs`** - Change tracking

### Features Restored:

- ✅ All promoter fields (personal, contact, professional, financial)
- ✅ Document upload functionality
- ✅ Contract management
- ✅ User management
- ✅ Audit logging
- ✅ Security policies

## 🚀 After Restoration

1. **Restart your development server** (if not already running):

   ```bash
   npm run dev
   ```

2. **Test the application**:
   - Navigate to promoter management
   - Try adding a new promoter
   - Test document upload functionality

## 🔍 Troubleshooting

### If tables still don't appear:

1. Check if you're in the correct project (`reootcngcptfogfozlmz`)
2. Make sure you're in the `public` schema
3. Refresh the Table Editor page

### If you get permission errors:

1. Make sure you're logged in as the project owner
2. Check that your user has admin privileges

### If the web app still shows "no data":

1. Restart your development server
2. Clear browser cache
3. Check browser console for errors

## 📞 Need Help?

If you encounter any issues during restoration:

1. Check the Supabase logs for error messages
2. Verify your environment variables are correct
3. Make sure you're running the scripts in the correct order

## 🎯 Expected Result

After completing these steps:

- ✅ All tables will be visible in Supabase Table Editor
- ✅ Your web application will connect properly
- ✅ All promoter management features will work
- ✅ Document upload functionality will be available
- ✅ No more "all data from supabase gone" errors
