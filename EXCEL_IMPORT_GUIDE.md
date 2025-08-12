# Excel/CSV Data Import Guide

## 🚨 RESTORING YOUR PROMOTERS FROM EXCEL FILES

Great news! You have Excel/CSV files with your promoters data. Let's import them to your new Supabase project.

## 📋 Available Data Files

I found these files in your project:

- ✅ `test-import.csv` - Promoters data
- ✅ `test-import-with-companies.csv` - Companies data
- ✅ `test-import.xlsx` - Excel file

## 🔧 Step-by-Step Import Process

### Step 1: Install Required Package

First, install the CSV parser:

```bash
npm install csv-parser
```

### Step 2: Get New Project API Key

1. **Go to**: https://supabase.com/dashboard/project/reootcngcptfogfozlmz
2. **Click "Settings"** → **"API"**
3. **Copy the "anon public" key**

### Step 3: Update Import Script

**Edit `import-excel-data.js`** and replace:

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

### Step 5: Import Your Data

**Run this command to import all your data:**

```bash
node import-excel-data.js
```

This will import:

- ✅ All promoters from `test-import.csv`
- ✅ All companies from `test-import-with-companies.csv`
- ✅ Map all fields correctly to database columns

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

## 📊 Data Mapping

The import script maps these CSV columns to database fields:

**Promoters:**

- `Name (English)` → `name_en`
- `Name (Arabic)` → `name_ar`
- `ID Card Number` → `id_card_number`
- `Mobile` → `mobile_number`
- `Passport Number` → `passport_number`
- `Nationality` → `nationality`
- `ID Expiry Date` → `id_card_expiry_date`
- `Passport Expiry` → `passport_expiry_date`

**Companies:**

- `Company Name` → `name`
- `Email` → `email`
- `Phone` → `phone`
- `Address` → `address`

## 🔍 Verification Steps

After import, verify:

1. **Check new project tables** - Should show imported data
2. **Count promoters** - Should match your CSV file
3. **Test frontend** - Should display all imported promoters
4. **Test backend** - API should work with new project

## 🎯 Expected Result

After completing import:

- ✅ **All promoters** from CSV in new project
- ✅ **All companies** from CSV in new project
- ✅ **Frontend working** with new project
- ✅ **Backend working** with new project
- ✅ **All data preserved** from your Excel files

## 🚨 Important Notes

- **Backup your CSV files** before running import
- **Check data mapping** if fields don't match exactly
- **Test everything** after import
- **Update Make.com** webhook URLs to new project

## 📞 If Import Fails

If import fails:

1. Check that new project API key is correct
2. Verify database schema is restored
3. Check CSV file format and column names
4. Look for error messages in console
5. Make sure csv-parser is installed

## 🎉 Success!

Once completed, your new project will have all your promoters and companies data restored from your Excel files!
