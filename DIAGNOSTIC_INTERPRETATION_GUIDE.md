# 📊 Diagnostic Results Interpretation Guide

**How to Use This Guide:**
1. Run the diagnostic script
2. Compare your results to the examples below
3. Identify which issues apply to your system

---

## 🚀 How to Run Diagnostics

### Method 1: Supabase Dashboard (Recommended)

```bash
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to SQL Editor
4. Copy contents from scripts/diagnose-user-system.sql
5. Click RUN
6. Review results below
```

### Method 2: CLI

```bash
supabase db execute --file scripts/diagnose-user-system.sql > diagnostic-results.txt
```

---

## 📋 What to Look For (Section by Section)

### SECTION 1: Existing Tables

**What you're checking:** Which user-related tables exist

**Good Result ✅:**
```
table_name                  | column_count
----------------------------|-------------
profiles                    | 15
roles                      | 7
permissions                | 6
role_permissions           | 3
user_role_assignments      | 10
```

**Problem Result ❌:**
```
table_name                  | column_count
----------------------------|-------------
profiles                    | 10
users                      | 12          ← Duplicate!
user_roles                 | 5
rbac_roles                 | 4           ← Multiple RBAC systems!
rbac_user_role_assignments | 8
roles                      | 7           ← Conflicts with rbac_roles
```

**What it means:**
- ✅ Only `profiles` table exists (good)
- ❌ Both `users` AND `profiles` exist (needs consolidation)
- ❌ Multiple RBAC systems (`user_roles`, `rbac_*`, `roles`) (needs cleanup)

---

### SECTION 2: Profiles Table Structure

**What you're checking:** Correct column structure

**Good Result ✅:**
```
column_name     | data_type | is_nullable
----------------|-----------|------------
id              | uuid      | NO
email           | text      | NO
full_name       | text      | YES
first_name      | text      | YES
last_name       | text      | YES
avatar_url      | text      | YES
phone           | text      | YES
department      | text      | YES
position        | text      | YES
status          | text      | YES
created_at      | timestamp | YES
updated_at      | timestamp | YES
```

**Problem Result ❌:**
```
column_name     | data_type | is_nullable
----------------|-----------|------------
id              | uuid      | NO
user_id         | uuid      | NO          ← Problem: Should be PK=id only
email           | text      | NO
role            | text      | YES          ← Problem: Role in profiles table
```

**What it means:**
- ✅ `id` is primary key (references auth.users.id)
- ❌ Both `id` and `user_id` exist (wrong structure)
- ❌ `role` column in profiles (should use RBAC tables instead)

---

### SECTION 3: Users Table (Should NOT Exist)

**Good Result ✅:**
```
(No rows returned - table doesn't exist)
```

**Problem Result ❌:**
```
column_name     | data_type | is_nullable
----------------|-----------|------------
id              | uuid      | NO
email           | text      | NO
full_name       | text      | YES
role            | text      | NO
status          | text      | NO
```

**What it means:**
- ✅ `users` table doesn't exist (correct - we use `profiles`)
- ❌ `users` table exists (needs consolidation with `profiles`)

---

### SECTION 4: Foreign Key Constraints

**What you're checking:** Correct relationships

**Good Result ✅:**
```
table_name              | column_name | foreign_table | foreign_column
------------------------|-------------|---------------|---------------
profiles               | id          | auth.users    | id
user_role_assignments  | user_id     | profiles      | id
user_role_assignments  | role_id     | roles         | id
role_permissions       | role_id     | roles         | id
role_permissions       | permission_id| permissions  | id
```

**Problem Result ❌:**
```
table_name              | column_name | foreign_table | foreign_column
------------------------|-------------|---------------|---------------
profiles               | user_id     | auth.users    | id            ← Wrong!
user_roles             | user_id     | profiles      | user_id       ← Wrong!
rbac_user_role_assign  | user_id     | profiles      | id           ← Mixed
```

**What it means:**
- ✅ All FKs point to `profiles.id` (correct)
- ❌ Some FKs point to `profiles.user_id` (wrong structure)
- ❌ Inconsistent FK targets (some to id, some to user_id)

---

### SECTION 5: Role Storage Check

**What you're checking:** Where roles are stored

**Good Result ✅:**
```
NOTICE: No role column in profiles
(Roles stored in user_role_assignments table only)
```

**Problem Result ❌:**
```
NOTICE: profiles.role column exists
NOTICE: users.role column exists
```

**What it means:**
- ✅ Roles stored only in RBAC tables (correct)
- ❌ Roles stored in multiple places (data can be out of sync)

---

### SECTION 6: RBAC System Tables

**What you're checking:** Which RBAC tables exist

**Good Result ✅:**
```
table_name              | columns | size
------------------------|---------|------
roles                  | 7       | 48 kB
permissions            | 6       | 56 kB
role_permissions       | 3       | 16 kB
user_role_assignments  | 10      | 72 kB
```

**Problem Result ❌:**
```
table_name                    | columns | size
------------------------------|---------|------
rbac_roles                    | 5       | 24 kB
rbac_permissions              | 6       | 32 kB
rbac_role_permissions         | 3       | 8 kB
rbac_user_role_assignments    | 9       | 40 kB
roles                         | 4       | 16 kB    ← Duplicate!
user_roles                    | 4       | 24 kB    ← Another system!
```

**What it means:**
- ✅ Single RBAC system (clean)
- ❌ Multiple RBAC systems (`rbac_*` AND `roles` AND `user_roles`) (needs consolidation)

---

### SECTION 7: Record Counts

**What you're checking:** How much data exists

**Expected Output:**
```
NOTICE: profiles has 115 records
NOTICE: roles has 5 records
NOTICE: permissions has 25 records
NOTICE: user_role_assignments has 120 records
```

**What it means:**
- Compare counts across duplicated tables
- If `users` has 115 but `profiles` has 90, you have missing data
- If numbers match, consolidation will be easier

---

### SECTION 8: Sample Data Comparison

**What you're checking:** Auth.users vs Profiles sync

**Good Result ✅:**
```
email              | auth_full_name | profile_full_name | status
-------------------|----------------|-------------------|--------
user1@test.com    | John Doe       | John Doe          | ✅ OK
user2@test.com    | Jane Smith     | Jane Smith        | ✅ OK
```

**Problem Result ❌:**
```
email                        | auth_full_name | profile_full_name | status
-----------------------------|----------------|-------------------|------------------
operations@falconeyegroup.net| Waqas Ahmad    | Fahad alamri      | ❌ Name mismatch
user2@test.com              | John Doe       | NULL              | ⚠️ Name mismatch
user3@test.com              | NULL           | Jane Smith        | ⚠️ Name mismatch
```

**What it means:**
- ✅ All data is synced (great!)
- ❌ Names don't match (needs sync)
- ⚠️ NULL values (incomplete data, needs migration)

---

### SECTION 9: Orphaned Records

**What you're checking:** Data integrity

**Good Result ✅:**
```
check_type                    | count
------------------------------|------
Profiles without auth.users   | 0
auth.users without profiles   | 0
```

**Problem Result ❌:**
```
check_type                    | count
------------------------------|------
Profiles without auth.users   | 3      ← Orphaned profiles!
auth.users without profiles   | 12     ← Users without profiles!
```

**What it means:**
- ✅ No orphans (perfect data integrity)
- ❌ Orphaned profiles (will be cleaned during migration)
- ❌ Missing profiles (will be created during migration)

---

### SECTION 10: RLS Policies

**What you're checking:** Security coverage

**Good Result ✅:**
```
tablename             | policyname
----------------------|------------------------------------------
profiles             | Users can view own profile
profiles             | Users can update own profile
profiles             | Users can insert own profile
profiles             | Admins can view all profiles
profiles             | Admins can update all profiles
user_role_assignments| Users can view own role assignments
user_role_assignments| Admins can view all role assignments
roles                | Anyone can view roles
permissions          | Anyone can view permissions
```

**Problem Result ❌:**
```
tablename             | policyname
----------------------|------------------------------------------
profiles             | Users can view own profile
profiles             | Users can update own profile
(Missing admin policies!)
(No RLS on user_role_assignments!)
```

**What it means:**
- ✅ Complete RLS coverage (secure)
- ❌ Missing policies (security gaps)
- ❌ No RLS on critical tables (major security issue)

---

### SECTION 11: SECURITY DEFINER Functions

**What you're checking:** Functions needing fixes

**Good Result ✅:**
```
function_name                    | security_type
---------------------------------|------------------
get_user_role                   | SECURITY INVOKER
user_has_permission             | SECURITY INVOKER
refresh_user_permissions_cache  | SECURITY INVOKER
```

**Problem Result ❌:**
```
function_name                    | security_type
---------------------------------|----------------------
add_password_to_history         | ⚠️ SECURITY DEFINER
check_password_reused           | ⚠️ SECURITY DEFINER
get_user_with_role              | ⚠️ SECURITY DEFINER
validate_promoter_assignment    | ⚠️ SECURITY DEFINER
(... 22 more functions ...)
```

**What it means:**
- ✅ All functions using SECURITY INVOKER or have search_path set
- ❌ Functions with SECURITY DEFINER (will be fixed by migration)

---

## 📊 Decision Matrix

Based on your results, determine which migrations you need:

| Your Situation | What You Need |
|----------------|---------------|
| **✅ profiles table exists, no users table** | Good! Just apply function fixes |
| **❌ Both profiles AND users tables exist** | Apply consolidation migration |
| **❌ Multiple RBAC systems (rbac_* AND roles)** | Apply consolidation migration |
| **❌ Data sync mismatches** | Apply consolidation migration |
| **⚠️ 26 SECURITY DEFINER functions** | Apply function fixes migration |
| **❌ Orphaned records** | Apply consolidation migration |
| **❌ Missing RLS policies** | Apply consolidation migration |

---

## 🎯 Action Items Based on Results

### If You See: "Both users and profiles exist"

**Action:**
1. ✅ Apply: `20251026_consolidate_user_profile_system.sql`
2. This will merge them into single `profiles` table

### If You See: "Multiple RBAC systems"

**Action:**
1. ✅ Apply: `20251026_consolidate_user_profile_system.sql`
2. This will consolidate into single RBAC system

### If You See: "Data mismatches"

**Action:**
1. ✅ Apply: `20251026_consolidate_user_profile_system.sql`
2. This will sync all data and create auto-sync triggers

### If You See: "26 SECURITY DEFINER functions"

**Action:**
1. ✅ Apply: `20251026_fix_function_search_paths.sql`
2. This will fix all function warnings

### If You See: "Orphaned records"

**Action:**
1. ✅ Apply: `20251026_consolidate_user_profile_system.sql`
2. Migration handles cleanup automatically

---

## 📝 Example Full Diagnostic Output

Here's what a typical problematic system looks like:

```
=== EXISTING TABLES ===
profiles (12 columns)
users (14 columns)                    ← Problem!
rbac_roles (5 columns)               ← Problem!
roles (7 columns)                    ← Conflict!
user_roles (4 columns)               ← Another system!

=== ORPHANED RECORDS ===
Profiles without auth.users: 2       ← Needs cleanup
auth.users without profiles: 8       ← Needs migration

=== SAMPLE DATA COMPARISON ===
❌ Email mismatch: 5
⚠️ Name mismatch: 12                 ← Needs sync
⚠️ Role mismatch: 8

=== SECURITY DEFINER FUNCTIONS ===
⚠️ SECURITY DEFINER: 26 functions    ← Needs fixing
```

**Verdict:** Apply BOTH migrations!

---

## ✅ What to Do After Running Diagnostics

1. **Save the output**
   ```bash
   # Keep for reference
   cp diagnostic-results.txt before-fix-diagnostics.txt
   ```

2. **Identify your issues**
   - Use the decision matrix above
   - Note which migrations you need

3. **Proceed to fixes**
   - Follow `USER_SYSTEM_FIX_GUIDE.md`
   - Apply relevant migrations

4. **Re-run diagnostics after**
   - Verify all issues resolved
   - Compare before/after

---

## 🎯 Quick Checklist

After reviewing your diagnostic results, check:

- [ ] I know which tables exist (profiles, users, or both)
- [ ] I know if I have orphaned records
- [ ] I know if my data is synced
- [ ] I know which RBAC system(s) I have
- [ ] I know how many functions need fixing
- [ ] I know which migrations I need to apply

**If you checked all boxes:** You're ready to proceed with fixes!

**Next step:** Open `USER_SYSTEM_FIX_GUIDE.md` → Step 3: Apply Migrations

---

**Need Help Interpreting Your Results?**

Post your diagnostic output and I can help analyze it!

