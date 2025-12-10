# 🚀 Rename Storage Files - Instructions

## ✅ **Solution: Use JavaScript Version**

Since `ts-node` is not installed, use the **JavaScript version** which requires no additional dependencies.

---

## 📋 **Quick Start**

### **Step 1: Set Environment Variables**

**PowerShell:**
```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Command Prompt (CMD):**
```cmd
set NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Bash/Linux/Mac:**
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### **Step 2: Run the Script**

```bash
node scripts/rename-storage-files.js
```

---

## 🔄 **Alternative: Use TypeScript with tsx**

If you prefer TypeScript, use `tsx` (already installed):

```bash
npx tsx scripts/rename-storage-files.ts
```

---

## 📊 **What the Script Does**

1. **Downloads** each old file (`NO_PASSPORT.png`)
2. **Uploads** with new name (with passport number)
3. **Deletes** the old file
4. **Shows progress** for each file
5. **Provides summary** at the end

---

## ⚠️ **Prerequisites**

1. **Supabase Service Role Key:**
   - Get from: Supabase Dashboard → Settings → API
   - Copy "service_role" key (not "anon" key)
   - This key has admin permissions needed for storage operations

2. **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)

---

## 📝 **Example Run**

```powershell
# Set variables
$env:NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Run script
node scripts/rename-storage-files.js

# Expected output:
# 🚀 Starting storage file rename process...
# 📋 Total files to rename: 27
# 
# 🔄 Renaming: adeel_aziz_NO_PASSPORT.png → adeel_aziz_ce1811183.png
# ✅ Successfully renamed: adeel_aziz_NO_PASSPORT.png → adeel_aziz_ce1811183.png
# ...
# ==================================================
# 📊 Rename Summary:
#    ✅ Successful: 27
#    ❌ Failed: 0
#    📁 Total: 27
# ==================================================
# 
# 🎉 All files renamed successfully!
```

---

## 🔧 **Troubleshooting**

### **Error: Missing Supabase configuration**
- **Solution:** Set both environment variables before running

### **Error: Permission denied**
- **Solution:** Ensure you're using the **service_role** key, not the anon key

### **Error: File not found**
- **Solution:** Some files may have already been renamed. The script will skip them.

### **Error: Upload failed**
- **Solution:** Check storage bucket permissions and service role key

---

## 📋 **Files to Rename: 27 Total**

The script will rename these files:
- `adeel_aziz_NO_PASSPORT.png` → `adeel_aziz_ce1811183.png`
- `ahmad_yar_NO_PASSPORT.png` → `ahmad_yar_bd6991962.png`
- ... and 25 more

**See:** `RENAME_STORAGE_FILES_COMPLETE_LIST.md` for full list

---

## ✅ **After Running**

Once complete:
- ✅ All 27 files will be renamed
- ✅ Database URLs will match storage files
- ✅ Document access will work correctly
- ✅ System will be fully functional

---

## 🎯 **Quick Command Reference**

**PowerShell:**
```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scripts/rename-storage-files.js
```

**Bash:**
```bash
NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co" SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/rename-storage-files.js
```

---

**Script Location:** `scripts/rename-storage-files.js`  
**Status:** ✅ Ready to run (no additional dependencies needed)

