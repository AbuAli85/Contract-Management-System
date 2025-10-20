# Environment Variables Setup Guide

## 🚨 Current Issue

Your diagnostic shows that environment variables need to be verified. The 400 login errors are likely caused by missing or incorrect environment variables.

## 🔧 Required Environment Variables

### **Create/Update `.env.local` file:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# RBAC Configuration
RBAC_ENFORCEMENT=enforce

# Optional: For debugging
NODE_ENV=production
```

## 🎯 How to Get Your Supabase Keys

### **Step 1: Access Supabase Dashboard**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**

### **Step 2: Copy the Values**

1. **Project URL**: Copy from "Project URL" section

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   ```

2. **Anon Key**: Copy from "Project API keys" → "anon public"

   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Service Role Key**: Copy from "Project API keys" → "service_role secret"
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 📁 File Location

Create the file in your project root:

```
Contract-Management-System/
├── .env.local          ← Create this file
├── .env.example
├── package.json
└── ...
```

## ✅ Verification Steps

### **Step 1: Check File Exists**

```bash
# In your project root
ls -la .env.local
```

### **Step 2: Verify Format**

Your `.env.local` should look like:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example_signature
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE5NTAxNDM4OTB9.example_service_signature
RBAC_ENFORCEMENT=enforce
```

### **Step 3: Restart Development Server**

```bash
# Stop your dev server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
```

### **Step 4: Test Connection**

Run the diagnostic scripts:

```sql
-- In Supabase SQL Editor
-- scripts/check_environment_variables.sql
-- scripts/verify_supabase_connection.sql
```

## 🔍 Common Issues & Solutions

### **Issue 1: "Missing Supabase environment variables"**

**Solution**: Check that `.env.local` exists and has correct values

### **Issue 2: "Invalid Supabase URL"**

**Solution**: Ensure URL format is `https://project-id.supabase.co`

### **Issue 3: "Invalid API key"**

**Solution**:

- Copy keys exactly from Supabase Dashboard
- Don't add extra spaces or quotes
- Use `anon` key for client-side, `service_role` for server-side

### **Issue 4: "Environment variables not loading"**

**Solution**:

- Restart your development server
- Check file is named `.env.local` (not `.env`)
- Ensure file is in project root directory

## 🚀 Quick Test

### **Test 1: Environment Check**

```bash
# In your project root
node -e "console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')"
```

### **Test 2: Login Debug Tool**

1. Go to `https://portal.thesmartpro.io/debug-login`
2. Try logging in with valid credentials
3. Check if 400 errors persist

### **Test 3: Supabase Connection**

```sql
-- Run in Supabase SQL Editor
SELECT 'Environment test successful' as result, NOW() as timestamp;
```

## 🔒 Security Notes

- ✅ `.env.local` is automatically ignored by Git
- ✅ Never commit environment variables to version control
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically for security

## 🆘 Emergency Bypass

If you need immediate access while fixing environment issues:

### **Option 1: Disable RBAC Temporarily**

```bash
RBAC_ENFORCEMENT=dry-run
```

### **Option 2: Use Supabase Dashboard**

- Go to Supabase Dashboard → Authentication → Users
- Create or reset user passwords directly
- Bypass application login temporarily

## 📞 Still Having Issues?

If environment variables are correct but still getting 400 errors:

1. **Check Supabase Dashboard**:
   - Authentication → Settings → Bot Protection (disable CAPTCHA)
   - Authentication → Users (verify user exists and is confirmed)

2. **Check Network Tab**:
   - Open Developer Tools → Network
   - Try login and check the request/response

3. **Use Debug Tool**:
   - Go to `/debug-login`
   - Check detailed error messages

4. **Verify Database**:
   - Run diagnostic scripts
   - Check user status in database

---

**Need the actual values?** Check your Supabase Dashboard → Settings → API for your project's keys!
