# 📊 Promoters Data Import Guide

## Quick Start

### Method 1: CSV Import Page (Recommended)

1. **Access the import page:**

   ```
   http://localhost:3000/en/csv-import
   ```

2. **Click on the "Promoters" tab**

3. **Download the CSV template** (or use the one provided: `promoters_import_template.csv`)

4. **Prepare your data** following the format below

5. **Upload the CSV file** and click "Import"

---

## 📋 Required Column Headers

Your Excel/CSV file **must** have these exact column headers (case-sensitive):

### **Required Fields:**

- `name_en` - Full name in English (e.g., "John Doe")
- `id_card_number` - National ID number (e.g., "123456789")

### **Optional Fields:**

- `name_ar` - Full name in Arabic (e.g., "جون دو")
- `passport_number` - Passport number (e.g., "AB1234567")
- `mobile_number` - Mobile phone number (e.g., "966501234567")
- `email` - Email address (must be valid format)
- `nationality` - Nationality (e.g., "Saudi", "Pakistani", "Indian")
- `id_card_expiry_date` - ID expiry date (formats: DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD)
- `passport_expiry_date` - Passport expiry date (same formats as above)
- `status` - Status (options: "active", "inactive", "pending") - defaults to "active"
- `employer_id` - Company UUID (only if you know the company ID)
- `notes` - Additional notes

---

## 📝 Preparing Your Excel File

### Step 1: Map Your Current Data

Based on your spreadsheet, here's how to map the columns:

| Your Column    | Maps To                | Example                              |
| -------------- | ---------------------- | ------------------------------------ |
| Name (EN)      | `name_en`              | asad shakeel                         |
| Name (AR)      | `name_ar`              | اسد شکیل                             |
| ID Card Number | `id_card_number`       | 105749346                            |
| Passport N     | `passport_number`      | bs5165582                            |
| Mobile Nu      | `mobile_number`        | 966xxxxxxxxx                         |
| Nationalit     | `nationality`          | Saudi                                |
| ID Expiry      | `id_card_expiry_date`  | 25-06-2027                           |
| Passport E     | `passport_expiry_date` | 20/03/2027                           |
| Status         | `status`               | active                               |
| Notes          | `notes`                | Sample practice                      |
| Company ID     | `employer_id`          | ce25ee6c-9cc5-4da0-b31e-3b1ef7131dcf |

### Step 2: Fix Data Issues

**Important fixes needed in your data:**

1. **Mobile Number Column:**
   - Fix the scientific notation (9.67E+11)
   - It appears some passport numbers are in the mobile column
   - Ensure format: `966xxxxxxxxx` (with country code)

2. **ID Expiry Column:**
   - Fix the `########` entry (Excel overflow error)
   - Widen the column to see the actual date
   - Use format: DD-MM-YYYY or DD/MM/YYYY

3. **Email Column:**
   - Add email addresses if available
   - If not available, leave blank or remove the column

### Step 3: Create the Import File

1. Open a **new Excel file**
2. Add the column headers in the **first row** (see template above)
3. Copy your data below the headers
4. Make sure all required fields (name_en, id_card_number) are filled
5. **Save as CSV** (File → Save As → CSV UTF-8)

---

## 🚀 Import Process

### Using the Web Interface:

1. Go to: `http://localhost:3000/en/csv-import`
2. Click the **"Promoters"** tab
3. Click **"Choose File"** or drag and drop your CSV
4. Review the preview of your data
5. Click **"Import"**
6. Wait for the import to complete

### Expected Results:

- ✅ **Success message:** Shows number of imported records
- ⚠️ **Duplicates:** Existing promoters (based on ID card number) will be skipped
- ❌ **Errors:** Invalid data will be reported with details

---

## 🔧 Troubleshooting

### Common Issues:

**1. "Invalid request data" error:**

- Check that column headers match exactly
- Ensure required fields are not empty

**2. "Duplicate promoter" messages:**

- Promoters with the same `id_card_number` already exist
- The system will skip them to prevent duplicates

**3. Date format errors:**

- Use: DD-MM-YYYY (e.g., 25-06-2027)
- Or: DD/MM/YYYY (e.g., 25/06/2027)
- Or: YYYY-MM-DD (e.g., 2027-06-25)

**4. Email validation errors:**

- Ensure emails are in valid format: user@example.com
- Remove invalid emails or leave blank

**5. Mobile number format:**

- Remove spaces and special characters
- Use country code format: 966501234567

---

## 📥 Sample CSV Template

Download and use: `promoters_import_template.csv`

Or copy this format:

```csv
name_en,name_ar,id_card_number,passport_number,mobile_number,email,nationality,id_card_expiry_date,passport_expiry_date,status,employer_id,notes
asad shakeel,اسد شکیل,105749346,bs5165582,966xxxxxxxxx,asad@example.com,Saudi,25-06-2027,20/03/2027,active,ce25ee6c-9cc5-4da0-b31e-3b1ef7131dcf,Sample practice
sagar aranakkal,سجر ارناكال,132891974,y2769195,966xxxxxxxxx,sagar@example.com,Indian,21-07-2027,15/05/2028,active,ce25ee6c-9cc5-4da0-b31e-3b1ef7131dcf,
```

---

## 💡 Tips for Success

1. **Start with a small test:**
   - Import 2-3 records first to verify the format works
2. **Clean your data first:**
   - Remove any ###### errors in Excel
   - Fix mobile numbers that show as scientific notation
   - Ensure dates are properly formatted

3. **Backup before importing:**
   - The system checks for duplicates
   - But it's good practice to export existing data first

4. **Use UTF-8 encoding:**
   - This ensures Arabic text imports correctly
   - Save as "CSV UTF-8" in Excel
   - If Arabic text shows as `???`, the file was not saved with proper UTF-8 encoding

5. **Check the company ID:**
   - The `employer_id` field should be a valid UUID
   - You can find this in your companies/parties table
   - If you don't know it, leave it blank

---

## 📞 Need Help?

If you encounter issues:

1. Check the browser console (F12) for detailed error messages
2. Verify your CSV format matches the template exactly
3. Ensure all required fields have valid data

---

## Next Steps After Import

After successfully importing:

1. Go to **Promoters page** to view imported records
2. Verify the data is correct
3. Update any missing information individually if needed
4. Set up notifications for expiring documents
