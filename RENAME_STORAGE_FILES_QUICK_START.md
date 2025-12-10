# 🚀 Quick Start: Rename Storage Files

## ⚡ **Fastest Method: Use JavaScript Version**

Since `ts-node` is not installed, use the JavaScript version instead:

### **Step 1: Set Environment Variables**

**PowerShell:**
```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Command Prompt:**
```cmd
set NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **Step 2: Run the Script**

```bash
node scripts/rename-storage-files.js
```

---

## 📋 **Alternative: Manual Rename**

If you prefer manual control or the script doesn't work:

### **Via Supabase Dashboard:**

1. Go to **Supabase Dashboard** → **Storage** → **promoter-documents**
2. Find each file with `NO_PASSPORT` in the name
3. Click **"..."** → **"Rename"**
4. Enter the new filename

**See:** `RENAME_STORAGE_FILES_COMPLETE_LIST.md` for the full list of 30 files

---

## 🔧 **Troubleshooting**

### **If script fails:**

1. **Check environment variables:**
   ```powershell
   echo $env:NEXT_PUBLIC_SUPABASE_URL
   echo $env:SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Verify Supabase client:**
   - Ensure `@supabase/supabase-js` is installed
   - Check service role key has storage admin permissions

3. **Manual fallback:**
   - Use Supabase Dashboard to rename files manually
   - See complete list in `RENAME_STORAGE_FILES_COMPLETE_LIST.md`

---

## ✅ **After Running**

Once files are renamed:
- ✅ Database URLs will match storage files
- ✅ Document access will work
- ✅ All 30 files will be accessible

---

**Script Location:** `scripts/rename-storage-files.js`  
**Status:** Ready to run

