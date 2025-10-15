# 🔧 Production Issues - Complete Fix Guide

## 📋 Issues Identified

### ❌ Issue 1: Empty Promoters Table
```json
"total": 0
"hasPromoters": false
```
**The production database has NO promoter records.**

### ❌ Issue 2: Missing RBAC Tables
```json
"permissionsError": "relation \"public.user_permissions\" does not exist"
"rolePermissionsError": "column role_permissions.permission does not exist"
```
**The RBAC permission system tables haven't been created.**

---

## ✅ Solution: 3-Step Fix

### **Step 1: Apply RBAC Schema** 🗄️

**Method A: Via Supabase Dashboard (Easiest)**

1. Visit: https://supabase.com/dashboard
2. Select your project
3. Go to: **SQL Editor** → **New Query**
4. Open `supabase/migrations/20250211_rbac_schema_fixed.sql`
5. Copy entire content
6. Paste into SQL Editor
7. Click **Run**
8. Wait for success message

**Method B: Via Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

---

### **Step 2: Seed RBAC Data** 👥

1. In **SQL Editor**, create **New Query**
2. Open `scripts/seed_rbac.sql`
3. Copy entire content
4. Paste into SQL Editor
5. Click **Run**
6. Verify roles created:
   ```sql
   SELECT * FROM roles;
   SELECT * FROM permissions;
   ```

---

### **Step 3: Import Promoters Data** 📊

**You have 3 options:**

#### **Option A: Manual Insert (If you have the data)**

You previously shared INSERT statements with 50+ promoters. To import:

1. In **SQL Editor**, create **New Query**
2. Paste your INSERT statement (the one starting with `INSERT INTO "public"."promoters" ...`)
3. Click **Run**
4. Verify:
   ```sql
   SELECT COUNT(*) FROM promoters;
   ```

#### **Option B: CSV Import**

1. Export promoters from local database to CSV
2. Go to **Table Editor** → **promoters**
3. Click **Insert** → **Import from CSV**
4. Upload file
5. Map columns
6. Click **Import**

#### **Option C: Database Copy (If you have local Supabase)**

```bash
# Export from local
supabase db dump -f promoters.sql --data-only --schema public --table promoters

# Import to production
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" -f promoters.sql
```

---

## 🧪 Verification Steps

After completing all 3 steps, run these tests:

### **Test 1: Check RBAC Tables**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles', 'user_permissions');

-- Check roles
SELECT * FROM roles;

-- Check your user's role
SELECT * FROM user_roles WHERE user_id = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170';
```

### **Test 2: Check Promoters Data**
```sql
-- Count promoters
SELECT COUNT(*) FROM promoters;

-- Sample data
SELECT id, name_en, email, status FROM promoters LIMIT 5;
```

### **Test 3: Test API**

Run in browser console on https://portal.thesmartpro.io/en/promoters:

```javascript
fetch('/api/promoters?page=1&limit=5')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Success:', data.success);
    console.log('📊 Total:', data.total);
    console.log('📋 Count:', data.count);
  });
```

**Expected Result:**
```json
{
  "success": true,
  "total": 50+,
  "count": 5,
  "promoters": [...]
}
```

---

## 🎯 Quick Fix Commands

If you have **Supabase CLI** and **database access**, run these in order:

```bash
# 1. Apply RBAC schema
supabase db push

# 2. Seed RBAC data
supabase db execute scripts/seed_rbac.sql

# 3. Import promoters (if you have a dump file)
supabase db execute promoters_data.sql
```

---

## 🚨 Troubleshooting

### **If RBAC migration fails:**
- Check if tables already exist: `\dt` in psql
- Drop and recreate: See `20250211_rbac_schema_fixed.sql`

### **If promoters import fails:**
- Check constraints: `\d+ promoters`
- Verify employer_id exists in employers table
- Check for duplicate IDs

### **If API still returns empty:**
- Clear browser cache (Ctrl+Shift+Delete)
- Redeploy Vercel: `vercel --prod`
- Check RLS policies:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'promoters';
  ```

---

## 📞 Need Help?

If issues persist after following this guide:

1. **Check Supabase logs:**
   - Dashboard → Logs → Database
   
2. **Check Vercel logs:**
   - Dashboard → Deployments → Latest → Logs

3. **Run diagnostic:**
   - Visit: https://portal.thesmartpro.io/test-api.html
   - Share the full output

---

## ✅ Success Checklist

- [ ] RBAC tables created (roles, permissions, etc.)
- [ ] RBAC data seeded (admin role, permissions)
- [ ] Your user has admin role assigned
- [ ] Promoters table has data (COUNT > 0)
- [ ] API returns promoters data
- [ ] Promoters page displays data correctly
- [ ] No errors in browser console
- [ ] No errors in Vercel logs

---

## 🎉 Expected Final State

After completing all steps:

1. **Database:**
   - ✅ All RBAC tables exist
   - ✅ Admin role assigned to your user
   - ✅ 50+ promoters in database

2. **API:**
   - ✅ `/api/promoters` returns data
   - ✅ `/api/promoters/health` shows all green
   - ✅ No permission errors

3. **Frontend:**
   - ✅ Promoters page shows list of promoters
   - ✅ Pagination works
   - ✅ No "No Promoters Found" message

---

**Last Updated:** October 15, 2025  
**Status:** Ready to apply

