# 🚀 Run Rename Script - Quick Guide

## ⚡ **Quick Start**

### **Step 1: Get Your Supabase Service Role Key**

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find **"service_role"** key (under "Project API keys")
5. **Copy the key** (starts with `eyJ...`)

⚠️ **Important:** Use the **service_role** key, NOT the anon key!

---

### **Step 2: Set Environment Variables**

**PowerShell (Recommended):**
```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Or create `.env.local` file:**
```bash
# Create .env.local in project root
NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

### **Step 3: Run the Script**

```bash
node scripts/rename-storage-files.js
```

---

## 📋 **Complete PowerShell Command**

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scripts/rename-storage-files.js
```

Replace `your-key` with your actual service role key.

---

## ✅ **Expected Output**

```
🚀 Starting storage file rename process...
📋 Total files to rename: 27

🔄 Renaming: adeel_aziz_NO_PASSPORT.png → adeel_aziz_ce1811183.png
✅ Successfully renamed: adeel_aziz_NO_PASSPORT.png → adeel_aziz_ce1811183.png

🔄 Renaming: ahmad_yar_NO_PASSPORT.png → ahmad_yar_bd6991962.png
✅ Successfully renamed: ahmad_yar_NO_PASSPORT.png → ahmad_yar_bd6991962.png

...

==================================================
📊 Rename Summary:
   ✅ Successful: 27
   ❌ Failed: 0
   📁 Total: 27
==================================================

🎉 All files renamed successfully!
```

---

## 🔧 **Troubleshooting**

### **Error: Missing Supabase configuration**
- **Solution:** Set both environment variables (see Step 2)

### **Error: Permission denied**
- **Solution:** Ensure you're using the **service_role** key, not anon key

### **Error: File not found**
- **Solution:** Some files may already be renamed. Script will skip them.

---

**Ready to run!** Just set the environment variables and execute the script.

