# Complete Data Migration Guide

## 🚨 MIGRATING 156 PROMOTERS + 16 COMPANIES TO NEW PROJECT

Your old project has valuable data that needs to be preserved:

- **156 promoters**
- **16 companies (parties)**
- **All contracts, users, and audit logs**

## 📋 Step-by-Step Data Migration

### Step 1: Export Data from Old Project

**Run this command to export all your data:**

```bash
node export-old-project-data.js
```

This will create:

- `parties-export.json` (16 companies)
- `promoters-export.json` (156 promoters)
- `contracts-export.json` (all contracts)
- `users-export.json` (all users)
- `audit-logs-export.json` (all audit logs)

### Step 2: Get New Project API Key

1. **Go to**: https://supabase.com/dashboard/project/reootcngcptfogfozlmz
2. **Click "Settings"** → **"API"**
3. **Copy the "anon public" key**

### Step 3: Update Import Script

**Edit `import-to-new-project.js`** and replace:

```javascript
const NEW_PROJECT_KEY = 'YOUR_NEW_ANON_KEY_HERE';
```

**With your actual new project API key:**

```javascript
const NEW_PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Step 4: Restore Database Schema

**In your new Supabase project:**

1. **Go to SQL Editor**
2. **Run `restore-database-schema.sql`** (creates tables)
3. **Run `setup-storage-bucket.sql`** (creates storage)

### Step 5: Import All Data

**Run this command to import all your data:**

```bash
node import-to-new-project.js
```

This will import:

- ✅ 16 companies to `parties` table
- ✅ 156 promoters to `promoters` table
- ✅ All contracts to `contracts` table
- ✅ All users to `users` table
- ✅ All audit logs to `audit_logs` table

### Step 6: Update Environment Variables

**Edit your `.env` file** and change:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ekdjxzhujettocosgzql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=old_key_here
```

**To:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=new_key_here
```

### Step 7: Restart Application

```bash
npm run dev
```

## 🔍 Verification Steps

After migration, verify:

1. **Check new project tables** - Should show all data
2. **Test frontend** - Should display 156 promoters
3. **Test backend** - API should work with new project
4. **Test Make.com** - Update webhook URLs to new project

## 🎯 Expected Result

After completing migration:

- ✅ **156 promoters** in new project
- ✅ **16 companies** in new project
- ✅ **All contracts** preserved
- ✅ **All users** preserved
- ✅ **All audit logs** preserved
- ✅ **Frontend working** with new project
- ✅ **Backend working** with new project
- ✅ **Make.com working** with new project

## 🚨 Important Notes

- **Don't delete old project** until migration is complete
- **Keep backup files** (JSON exports) for safety
- **Test everything** before switching completely
- **Update Make.com** webhook URLs to new project

## 📞 If You Need Help

If migration fails:

1. Check that new project API key is correct
2. Verify database schema is restored
3. Check that JSON export files exist
4. Look for error messages in console
