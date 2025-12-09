# ⚡ Quick Import Steps

## 🎯 Two Ways to Import Your Data

### Method 1: From Promoters Page (NEW!)

1. Go to **Promoters page** in your system
2. Click the **"Import"** button (next to "Add Promoter")
3. You'll be redirected to the import page

### Method 2: Direct Access

1. Navigate to: `http://localhost:3000/en/csv-import`
2. Click on **"Promoters"** tab

---

## 📝 Prepare Your Excel File

### Fix Your Current Data First:

1. **Mobile Number Column**
   - ❌ Current: `9.67E+11` (scientific notation)
   - ✅ Fix: `966xxxxxxxxx` (full number)
   - Click the cell → widen column → see full number
2. **ID Expiry Date Column**
   - ❌ Current: `########` (overflow)
   - ✅ Fix: Widen column to see date
   - Format: `25-06-2027` or `25/06/2027`

3. **Headers**
   - Change your column headers to match these exactly:

   ```
   name_en | name_ar | id_card_number | passport_number | mobile_number | email | nationality | id_card_expiry_date | passport_expiry_date | status | employer_id | notes
   ```

---

## 💾 Save As CSV

1. In Excel: **File → Save As**
2. Choose: **CSV UTF-8 (Comma delimited) (\*.csv)**
3. Save the file

---

## 📤 Upload & Import

1. Click **"Choose File"** or drag and drop your CSV
2. Review the data preview
3. Click **"Import"**
4. Wait for confirmation

---

## ✅ What Happens

- ✅ New promoters will be added
- ⚠️ Duplicates (same ID card number) will be skipped
- ❌ Invalid data will show error messages
- 📊 You'll see a summary: "Successfully processed X promoters"

---

## 🆘 Need Help?

See the full guide: `IMPORT_GUIDE.md`
Use the template: `promoters_import_template.csv`
