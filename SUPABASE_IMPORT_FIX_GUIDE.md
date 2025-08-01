# 🔧 Supabase Import Fix Guide

## 🚨 Problem Identified

You're getting a **"Data incompatible" warning** when trying to import your CSV file (`promoters-export-2025-08-01.csv`) directly into Supabase. This happens because:

1. **Column name mismatch**: CSV has `sport Expiry` instead of `Passport Expiry`
2. **Date format issues**: Dates are in DD-MM-YY format instead of YYYY-MM-DD
3. **Schema mismatch**: CSV columns don't exactly match database field names
4. **Missing required fields**: Some database fields are missing from CSV

## ✅ Solutions Available

### **Option 1: Use Fixed Import Script (Recommended)**

The safest and most reliable method:

```bash
node import-promoters-fixed.js
```

**Features:**
- ✅ Handles all date format conversions
- ✅ Creates missing companies automatically
- ✅ Links promoters to companies
- ✅ Updates existing records (prevents duplicates)
- ✅ Detailed error reporting
- ✅ Progress tracking

### **Option 2: Fix CSV for Direct Supabase Import**

If you prefer to use Supabase's direct CSV import:

```bash
node fix-csv-for-supabase.js
```

This will create a new file `promoters-supabase-ready.csv` that you can import directly into Supabase.

## 🔧 How to Fix the Issues

### **Issue 1: Column Name Mismatch**

**Problem**: CSV has `sport Expiry` instead of `Passport Expiry`

**Solution**: The import scripts automatically map the correct column names.

### **Issue 2: Date Format Problems**

**Problem**: Dates like `27-12-28` (DD-MM-YY) need to be `2028-12-27` (YYYY-MM-DD)

**Solution**: The scripts include date parsing logic to handle multiple formats.

### **Issue 3: Schema Mismatch**

**Problem**: CSV columns don't match database field names exactly

**Solution**: The scripts map CSV columns to the correct database fields.

## 📋 Step-by-Step Fix

### **Step 1: Choose Your Method**

**For the most reliable import:**
```bash
node import-promoters-fixed.js
```

**For Supabase direct import:**
```bash
node fix-csv-for-supabase.js
```

### **Step 2: Run the Script**

The script will:
1. Find your CSV file automatically
2. Convert date formats
3. Map column names correctly
4. Handle company relationships
5. Import all 156 promoters

### **Step 3: Verify Import**

After import, check:
- [ ] Promoter Management page shows all promoters
- [ ] Company relationships are correct
- [ ] Document status calculations work
- [ ] Search and filters function properly

## 🎯 Expected Results

After running the fix:

- **✅ 156 promoters imported** (or updated if duplicates exist)
- **✅ Companies created automatically** (if missing)
- **✅ All relationships linked** correctly
- **✅ Date formats corrected** to YYYY-MM-DD
- **✅ No "Data incompatible" errors**

## 🚨 Important Notes

### **Data Safety**
- The scripts check for existing records by ID card number
- Existing promoters are **updated**, not duplicated
- All data is validated before import

### **Company Handling**
- Missing companies are created as "company" type
- Company names are matched case-insensitively
- Promoters are linked to companies automatically

### **Error Handling**
- Invalid data is skipped with error reporting
- Network issues are handled gracefully
- Progress is shown for large imports

## 🔄 Alternative: Manual Fix

If you prefer to fix the CSV manually:

1. **Open your CSV file** in Excel or Google Sheets
2. **Fix column names**:
   - `sport Expiry` → `Passport Expiry`
   - Ensure all column names match database fields exactly
3. **Fix date formats**:
   - Convert `27-12-28` to `2028-12-27`
   - Use YYYY-MM-DD format for all dates
4. **Save and re-import** to Supabase

## 📊 Database Schema Reference

Your promoters table has these fields:
- `name_en` (text)
- `name_ar` (text)
- `id_card_number` (text, unique)
- `passport_number` (text)
- `mobile_number` (text)
- `phone` (text)
- `email` (text)
- `nationality` (text)
- `date_of_birth` (date)
- `gender` (text)
- `address` (text)
- `emergency_contact` (text)
- `emergency_phone` (text)
- `job_title` (text)
- `work_location` (text)
- `status` (text)
- `notes` (text)
- `id_card_expiry_date` (date)
- `passport_expiry_date` (date)
- `employer_id` (uuid, foreign key to parties)

## 🎉 Success Checklist

After running the fix, verify:
- [ ] All 156 promoters appear in the management page
- [ ] Company relationships are displayed correctly
- [ ] Document status badges show proper colors
- [ ] Search functionality works
- [ ] Filter options work properly
- [ ] No duplicate records exist
- [ ] Date formats are correct
- [ ] Export functionality works

---

**Need help?** The scripts provide detailed console output showing exactly what's happening during the import process. 