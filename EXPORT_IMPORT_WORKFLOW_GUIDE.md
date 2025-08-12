# 📊 Complete Export/Import Workflow Guide

## 🎯 Overview

This guide explains how to export promoter data from your application and import it back into Supabase, including handling company relationships and data updates.

## 📋 Prerequisites

- Node.js installed
- `csv-parser` package installed: `npm install csv-parser`
- Access to your Supabase project
- Valid environment variables in `.env` file

## 🔄 Complete Workflow

### Step 1: Export Data from Application

1. **Navigate to Promoter Management**
   - Go to `/manage-promoters` in your application
   - Apply any filters you want (search, status, company, etc.)

2. **Export to CSV**
   - Click the **"Export CSV"** button
   - File will download as `promoters-export-YYYY-MM-DD.csv`
   - Save this file in your project root directory

3. **Verify Export**
   - Check that the CSV file contains all expected data
   - Ensure company names are included in the export

### Step 2: Import Data Back to Supabase

#### Option A: Basic Import (Simple)

```bash
node import-promoters-from-csv.js
```

**Features:**

- ✅ Imports all promoter data
- ✅ Handles basic field mapping
- ✅ Shows progress and results
- ❌ Doesn't handle company relationships
- ❌ Doesn't update existing records

#### Option B: Advanced Import (Recommended)

```bash
node import-promoters-with-companies.js
```

**Features:**

- ✅ Imports all promoter data
- ✅ Creates missing companies automatically
- ✅ Links promoters to companies
- ✅ Updates existing records (by ID card number)
- ✅ Handles relationships and foreign keys
- ✅ Shows detailed progress and results

### Step 3: Verify Import

1. **Check Promoter Management Page**
   - Navigate to `/manage-promoters`
   - Verify all promoters are displayed
   - Check that company relationships are correct

2. **Check Companies Page**
   - Navigate to `/manage-parties`
   - Verify new companies were created (if any)
   - Check company details

3. **Verify Data Integrity**
   - Check that all fields imported correctly
   - Verify document status calculations
   - Test search and filter functionality

## 📁 File Structure

```
your-project/
├── app/[locale]/manage-promoters/page.tsx  # Export functionality
├── import-promoters-from-csv.js           # Basic import script
├── import-promoters-with-companies.js     # Advanced import script
├── promoters-export-2024-01-15.csv        # Exported data
└── .env                                   # Environment variables
```

## 🔧 Script Details

### Basic Import Script (`import-promoters-from-csv.js`)

- **Purpose**: Simple import of promoter data
- **Use Case**: When you just need to import data without company relationships
- **Limitations**: Doesn't handle existing records or company links

### Advanced Import Script (`import-promoters-with-companies.js`)

- **Purpose**: Full-featured import with company relationships
- **Use Case**: Production data migration or backup restoration
- **Features**:
  - Creates missing companies automatically
  - Links promoters to existing companies
  - Updates existing promoters (prevents duplicates)
  - Handles all data relationships
  - Provides detailed progress reporting

## 📊 Data Mapping

### Export Fields → Import Fields

| Export Column     | Import Field           | Notes                                  |
| ----------------- | ---------------------- | -------------------------------------- |
| Name (EN)         | name_en                | Required                               |
| Name (AR)         | name_ar                | Required                               |
| ID Card Number    | id_card_number         | Required, used for duplicate detection |
| Passport Number   | passport_number        | Optional                               |
| Mobile            | mobile_number          | Phone number                           |
| Phone             | phone                  | Alternative phone                      |
| Email             | email                  | Email address                          |
| Nationality       | nationality            | Country of origin                      |
| Date of Birth     | date_of_birth          | Formatted date                         |
| Gender            | gender                 | male/female/other                      |
| Address           | address                | Full address                           |
| Emergency Contact | emergency_contact      | Contact person                         |
| Emergency Phone   | emergency_phone        | Emergency phone                        |
| ID Card Status    | id_card_status         | Calculated field                       |
| ID Card Expiry    | id_card_expiry_date    | Formatted date                         |
| Passport Status   | passport_status        | Calculated field                       |
| Passport Expiry   | passport_expiry_date   | Formatted date                         |
| Company           | employer_id            | Linked to parties table                |
| Job Title         | job_title              | Position                               |
| Work Location     | work_location          | Work address                           |
| Status            | status                 | active/inactive/etc                    |
| Overall Status    | overall_status         | Calculated field                       |
| Active Contracts  | active_contracts_count | Number of contracts                    |
| Notes             | notes                  | Additional information                 |
| Created At        | created_at             | Timestamp                              |

## 🚨 Important Notes

### Data Validation

- **Required Fields**: name_en, name_ar, id_card_number
- **Duplicate Detection**: Based on ID card number
- **Company Linking**: Automatic based on company name matching

### Error Handling

- **Missing Companies**: Automatically created as "Employer" type
- **Duplicate Promoters**: Updated instead of creating duplicates
- **Invalid Data**: Skipped with error reporting
- **Network Issues**: Retry mechanism for failed imports

### Performance

- **Large Datasets**: Processed one record at a time for error handling
- **Progress Reporting**: Real-time feedback on import progress
- **Memory Usage**: Efficient streaming for large CSV files

## 🔄 Use Cases

### 1. Data Backup

```bash
# Export current data
# (Use Export CSV button in UI)

# Import to backup database
node import-promoters-with-companies.js
```

### 2. Data Migration

```bash
# Export from old system
# Import to new Supabase project
node import-promoters-with-companies.js
```

### 3. Data Update

```bash
# Export current data
# Edit in Excel/Google Sheets
# Import updated data (updates existing records)
node import-promoters-with-companies.js
```

### 4. Bulk Data Import

```bash
# Prepare CSV with new promoters
# Import with company relationships
node import-promoters-with-companies.js
```

## 🛠️ Troubleshooting

### Common Issues

1. **"CSV file not found"**
   - Make sure you exported the CSV first
   - Check file is in the project root directory
   - Verify filename is `promoters-export.csv`

2. **"Environment variables not found"**
   - Check your `.env` file exists
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Restart your terminal after updating `.env`

3. **"csv-parser not installed"**

   ```bash
   npm install csv-parser
   ```

4. **"Permission denied" errors**
   - Check Supabase RLS policies
   - Verify your API key has write permissions
   - Check table structure matches expected schema

5. **"Duplicate key" errors**
   - The script handles this automatically
   - Existing records are updated, not duplicated
   - Check ID card numbers for uniqueness

### Debug Mode

Add this to see detailed error information:

```javascript
// Add to script for debugging
console.log('Debug data:', promoter);
```

## 📈 Best Practices

1. **Always backup before import**
2. **Test with small datasets first**
3. **Verify data integrity after import**
4. **Use the advanced script for production**
5. **Keep CSV files for audit trails**
6. **Document any custom field mappings**

## 🎉 Success Checklist

After running the import, verify:

- [ ] All promoters appear in the management page
- [ ] Company relationships are correct
- [ ] Search and filters work properly
- [ ] Document status calculations are accurate
- [ ] No duplicate records exist
- [ ] All required fields are populated
- [ ] Date formats are correct
- [ ] Status badges display properly

---

**Need help?** Check the console output for detailed error messages and progress information.
