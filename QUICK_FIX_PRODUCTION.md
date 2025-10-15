# 🚀 Quick Fix for Production - Correct Steps

## ⚠️ Important: Use the Correct RBAC Schema

The error you got is because there are **two versions** of the RBAC schema:
- ❌ `20250211_rbac_schema_fixed.sql` - Uses `rbac_` prefixed tables (incompatible with seed)
- ✅ `20250120_rbac_schema.sql` - Uses standard table names (compatible with seed)

---

## ✅ Correct Fix Steps

### **Step 1: Apply Correct RBAC Schema** ⭐

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **SQL Editor** → **New Query**
4. Open **`supabase/migrations/20250120_rbac_schema.sql`** ⭐ (NOT the _fixed version)
5. Copy the **entire content**
6. Paste into SQL Editor
7. Click **Run**
8. ✅ Should complete without errors

---

### **Step 2: Seed RBAC Data**

1. Create **New Query** in SQL Editor
2. Open **`scripts/seed_rbac.sql`**
3. Copy the **entire content**
4. Paste into SQL Editor
5. Click **Run**
6. ✅ Should insert roles and permissions

**Verify it worked:**
```sql
-- Should return several roles (admin, client, provider, etc.)
SELECT * FROM roles;

-- Should return many permissions
SELECT COUNT(*) FROM permissions;
```

---

### **Step 3: Assign Admin Role to Your User**

Run this in SQL Editor (replace with your user ID):

```sql
-- Your user ID: 3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170

INSERT INTO user_role_assignments (user_id, role_id, is_active)
SELECT 
    '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170'::uuid,
    id,
    true
FROM roles 
WHERE name = 'admin'
ON CONFLICT DO NOTHING;
```

**Verify:**
```sql
SELECT 
    ura.user_id,
    r.name as role_name
FROM user_role_assignments ura
JOIN roles r ON ura.role_id = r.id
WHERE ura.user_id = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170';
```

Should return: `admin`

---

### **Step 4: Import Promoters Data**

You have promoters data from earlier. Run this INSERT statement in SQL Editor:

```sql
-- Your INSERT statement with all promoters
INSERT INTO "public"."promoters" (...) VALUES (...);
```

Or use one of these methods:
- **CSV Import:** Table Editor → promoters → Insert → Import from CSV
- **Copy from local:** Export and import via Supabase

**Verify:**
```sql
SELECT COUNT(*) FROM promoters;
-- Should return 50+

SELECT id, name_en, email, status FROM promoters LIMIT 5;
-- Should show sample data
```

---

## 🧪 Test Everything

After completing all steps, run in browser console:

```javascript
// Test 1: Check permissions
fetch('/api/debug/user-permissions')
  .then(r => r.json())
  .then(d => {
    console.log('✅ User:', d.user?.email);
    console.log('✅ Roles:', d.roles?.assigned);
    console.log('✅ Permissions:', d.rolePermissions?.viaRoles?.length);
  });

// Test 2: Check promoters
fetch('/api/promoters?page=1&limit=5')
  .then(r => r.json())
  .then(d => {
    console.log('✅ Total promoters:', d.total);
    console.log('✅ Fetched:', d.count);
  });
```

**Expected Results:**
```
✅ User: luxsess2001@gmail.com
✅ Roles: ["admin"]
✅ Permissions: 50+
✅ Total promoters: 50+
✅ Fetched: 5
```

---

## 🎯 Final Check

1. **Refresh promoters page:** https://portal.thesmartpro.io/en/promoters
2. **Should see:** List of promoters with data ✅
3. **No errors** in console ✅

---

## 🚨 If Issues Persist

**Check what tables exist:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('roles', 'permissions', 'role_permissions', 
                   'user_role_assignments', 'rbac_roles', 
                   'rbac_permissions', 'promoters');
```

**Expected tables:**
- ✅ `roles`
- ✅ `permissions`
- ✅ `role_permissions`
- ✅ `user_role_assignments`
- ✅ `promoters`

**If you see `rbac_*` tables instead:**
You ran the wrong schema. Drop them and run the correct one:
```sql
DROP TABLE IF EXISTS rbac_audit_logs CASCADE;
DROP TABLE IF EXISTS rbac_user_role_assignments CASCADE;
DROP TABLE IF EXISTS rbac_role_permissions CASCADE;
DROP TABLE IF EXISTS rbac_permissions CASCADE;
DROP TABLE IF EXISTS rbac_roles CASCADE;
DROP MATERIALIZED VIEW IF EXISTS rbac_user_permissions_mv CASCADE;
```

Then run **`20250120_rbac_schema.sql`** again.

---

## ✅ Success Checklist

- [ ] Ran `20250120_rbac_schema.sql` (NOT the _fixed version)
- [ ] Ran `seed_rbac.sql`
- [ ] Admin role assigned to your user
- [ ] Promoters data imported
- [ ] API returns promoters data
- [ ] Promoters page shows data
- [ ] No permission errors

---

**TL;DR:**
1. Use `20250120_rbac_schema.sql` ⭐
2. Seed with `seed_rbac.sql`
3. Assign admin role to your user
4. Import promoters data
5. Refresh page ✅

