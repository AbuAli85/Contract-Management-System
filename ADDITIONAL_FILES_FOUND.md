# 📋 Additional NO_PASSPORT Files Found

## 🔍 **Files Discovered**

The following files were found that still have `NO_PASSPORT` in their names:

1. **syed_roshaan_e_haider_abbas_jafri_NO_PASSPORT.png**
   - URL: https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/syed_roshaan_e_haider_abbas_jafri_NO_PASSPORT.png
   - Status: ⚠️ Needs passport number lookup

2. **MAHMOUD_ELMASRY_ABDELKARIM_ZAHRAN_NO_PASSPORT.jpeg**
   - URL: https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/MAHMOUD_ELMASRY_ABDELKARIM_ZAHRAN_NO_PASSPORT.jpeg
   - Status: ✅ Database already fixed (a40744362)
   - Expected: `mahmoud_elmasry_abdelkarim_zahran_a40744362.jpeg`

3. **husnain_sohail_butt_NO_PASSPORT.jpeg**
   - URL: https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/husnain_sohail_butt_NO_PASSPORT.jpeg
   - Status: ✅ Database already fixed (ew3490852)
   - Expected: `husnain_sohail_butt_ew3490852.jpeg`

4. **haider_ali_gulam_abbas_merchant_NO_PASSPORT.jpeg**
   - URL: https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/haider_ali_gulam_abbas_merchant_NO_PASSPORT.jpeg
   - Status: ✅ Database already fixed (y5935625)
   - Expected: `haider_ali_gulam_abbas_merchant_y5935625.jpeg`

---

## 🔧 **Solution**

The rename script has been updated to:
1. ✅ **Dynamically fetch** all files from storage
2. ✅ **Match with database** promoters
3. ✅ **Handle case variations** (uppercase/lowercase)
4. ✅ **Handle file extensions** (.png, .jpeg, .jpg)
5. ✅ **Automatically rename** all matching files

---

## 🚀 **How to Fix**

### **Option 1: Run the Updated Script** ⭐ Recommended

```bash
# Set service role key
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script (it will find and rename all files automatically)
node scripts/rename-storage-files.js
```

The script will:
- Find all `NO_PASSPORT` files in storage
- Match them with promoters in the database
- Rename them with correct passport numbers
- Handle all file extensions and case variations

### **Option 2: Manual Rename in Supabase Dashboard**

1. Go to **Supabase Dashboard** → **Storage** → **promoter-documents**
2. Find each file
3. Rename manually to the expected filename

---

## ✅ **Verification**

After running the script, verify with:

```bash
node scripts/verify-storage-files-fixed.js
```

---

## 📊 **Summary**

| File | Status | Action |
|------|--------|--------|
| syed_roshaan_e_haider_abbas_jafri_NO_PASSPORT.png | ⚠️ Need passport lookup | Script will handle |
| MAHMOUD_ELMASRY_ABDELKARIM_ZAHRAN_NO_PASSPORT.jpeg | ✅ Ready | Script will rename |
| husnain_sohail_butt_NO_PASSPORT.jpeg | ✅ Ready | Script will rename |
| haider_ali_gulam_abbas_merchant_NO_PASSPORT.jpeg | ✅ Ready | Script will rename |

**Total Additional Files:** 4

---

**The updated script will automatically find and fix all of these!** 🎉

