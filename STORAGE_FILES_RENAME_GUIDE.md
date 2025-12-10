# 🔧 Complete Guide: Rename Storage Files

## 📊 **Situation**

- ✅ **Database URLs:** Updated correctly (39 records fixed)
- ❌ **Storage Files:** Still have old `NO_PASSPORT` names (30 files need renaming)
- **Result:** Database URLs point to files that don't exist

---

## 🎯 **Solution Options**

### **Option 1: Manual Rename via Supabase Dashboard** ⭐ Recommended

**Best for:** Small batches, visual verification

**Steps:**
1. Go to **Supabase Dashboard** → **Storage** → **promoter-documents**
2. Find each file with `NO_PASSPORT` in name
3. Click **"..."** → **"Rename"**
4. Enter new filename with passport number
5. Save

**See:** `RENAME_STORAGE_FILES_COMPLETE_LIST.md` for full list

---

### **Option 2: Automated Script** 🚀 Fastest

**Best for:** Bulk renaming all files at once

**Prerequisites:**
- Node.js installed
- Supabase Service Role Key configured
- TypeScript support

**Steps:**
1. Set environment variables:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. Run the script:
   ```bash
   npx tsx scripts/rename-storage-files.ts
   ```

**Script Location:** `scripts/rename-storage-files.ts`

**What it does:**
- Downloads each old file
- Uploads with new name
- Deletes old file
- Provides progress and summary

---

## 📋 **Files to Rename: 30 Total**

### **Quick Reference List:**

1. `adeel_aziz_NO_PASSPORT.png` → `adeel_aziz_ce1811183.png`
2. `ahmad_yar_NO_PASSPORT.png` → `ahmad_yar_bd6991962.png`
3. `ayub_ansari_NO_PASSPORT.png` → `ayub_ansari_p4949022.png`
4. `azhar_habib_NO_PASSPORT.png` → `azhar_habib_ca6033242.png`
5. `haseeb_arslan_NO_PASSPORT.png` → `haseeb_arslan_jb1916471.png`
6. `johirul_islam_NO_PASSPORT.png` → `johirul_islam_eh0211875.png`
7. `karam_din_NO_PASSPORT.png` → `karam_din_fw7792021.png`
8. `kashif_ali_NO_PASSPORT.png` → `kashif_ali_vf1822691.png`
9. ... and 22 more (see complete list)

**Full list:** See `RENAME_STORAGE_FILES_COMPLETE_LIST.md`

---

## ✅ **Verification After Renaming**

### **Check 1: File Accessibility**

Test a few URLs:
```bash
# Should return 200 OK
curl -I https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/adeel_aziz_ce1811183.png
```

### **Check 2: Database Match**

```sql
-- Verify URLs match storage files
SELECT 
  name_en,
  passport_number,
  passport_url,
  SUBSTRING(passport_url FROM 'promoter-documents/(.*)$') as filename
FROM promoters
WHERE passport_url NOT LIKE '%NO_PASSPORT%'
ORDER BY name_en;
```

### **Check 3: No Orphaned Files**

```sql
-- Check for remaining NO_PASSPORT files in storage
SELECT name
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
  AND name LIKE '%_NO_PASSPORT%';
```

---

## ⚠️ **Important Notes**

1. **Backup First:** Consider backing up files before renaming
2. **Test First:** Rename 1-2 files manually to verify process
3. **Check Permissions:** Ensure you have storage admin access
4. **Rate Limits:** If using script, it includes delays to avoid rate limiting

---

## 🎯 **Recommended Approach**

1. **Start Small:** Rename 2-3 files manually to verify
2. **Use Script:** If manual works, use automated script for bulk
3. **Verify:** Test URLs after renaming
4. **Cleanup:** Remove any orphaned `NO_PASSPORT` files

---

## 📁 **Files Created**

1. **RENAME_STORAGE_FILES_COMPLETE_LIST.md** - Full list with all details
2. **scripts/rename-storage-files.ts** - Automated rename script
3. **STORAGE_FILES_RENAME_GUIDE.md** - This guide

---

## 🚀 **Quick Start**

**For Manual:**
1. Open `RENAME_STORAGE_FILES_COMPLETE_LIST.md`
2. Go to Supabase Dashboard
3. Rename files one by one

**For Automated:**
1. Configure environment variables
2. Run: `npx tsx scripts/rename-storage-files.ts`
3. Wait for completion
4. Verify results

---

**Status:** Ready to execute  
**Priority:** High - Required for document access

