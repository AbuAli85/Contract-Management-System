# 📋 Promoter Registration Guide

## 🎯 **Current Status**

✅ **23 promoters** have profiles and employer_employee records - **FULLY WORKING**  
⚠️ **102 promoters** need registration (no profiles/auth.users)

---

## 🚀 **Registration Options**

### **Option 1: Bulk Registration via API (Recommended)**

Use the `/api/users` endpoint to create users in bulk.

#### **Step 1: Get Promoter Data**

Run this query to get promoters needing registration:

```sql
\i scripts/prepare-promoters-for-bulk-registration.sql
```

#### **Step 2: Create Users via API**

Use the JSON output from the query to create users:

```typescript
// Example: Bulk create users
const promoters = [/* JSON from query */];

for (const promoter of promoters) {
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: promoter.email,
      full_name: promoter.full_name,
      phone: promoter.phone,
      role: 'promoter',
      status: 'approved',
      // ... other fields
    })
  });
}
```

---

### **Option 2: Manual Registration via UI**

1. Go to Users/Team Management page
2. Click "Add User" or "Add Team Member"
3. Enter promoter details:
   - Email (from promoters table)
   - Full Name
   - Phone
   - Role: `promoter`
   - Status: `approved`
4. Save

---

### **Option 3: Admin Script (Supabase Admin)**

If you have Supabase admin access, you can create auth.users directly:

```sql
-- This requires service_role access
-- Use Supabase Admin API or service_role client

-- Example using Supabase Admin API
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  p.email,
  crypt('temp_password_123', gen_salt('bf')),  -- User will reset
  NOW(),
  jsonb_build_object(
    'full_name', COALESCE(p.name_en, p.name_ar, 'Employee'),
    'role', 'promoter',
    'status', 'approved',
    'promoter_id', p.id::text
  ),
  NOW(),
  NOW()
FROM promoters p
WHERE p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.email = p.email
  );
```

**⚠️ Warning:** This requires service_role access and should be done carefully.

---

## ✅ **After Registration**

Once promoters are registered:

1. **Profiles are created automatically** (via trigger)
2. **Run the fix script** to create employer_employee records:

```sql
\i scripts/create-missing-employer-employees-for-existing-profiles.sql
```

3. **Verify** with:

```sql
\i scripts/diagnose-missing-employer-employees.sql
```

---

## 📊 **Registration Priority**

Based on your data, prioritize by employer:

1. **AL AMRI INVESTMENT AND SERVICES LLC** - 13 promoters
2. **Blue Oasis Quality Services SPC** - 17 promoters
3. **Falcon Eye Business and Promotion** - 3 more (14 total, 11 need registration)
4. **Falcon Eye Management and Business** - 15 promoters
5. And so on...

---

## 🔍 **Verification**

After registration, check:

```sql
-- Count promoters with profiles
SELECT COUNT(DISTINCT p.id) as promoters_with_profiles
FROM promoters p
JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.status = 'active';

-- Count employer_employee records
SELECT COUNT(*) as employer_employee_records
FROM employer_employees ee
JOIN promoters p ON p.id = ee.promoter_id
WHERE p.status = 'active';
```

---

## 🎉 **Expected Result**

After registering all 102 promoters:
- ✅ All promoters have profiles
- ✅ All promoters have employer_employee records
- ✅ All can access attendance, tasks, targets
- ✅ Unified system working for everyone

