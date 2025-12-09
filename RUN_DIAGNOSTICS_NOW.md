# 🔍 Run Diagnostics Now - Quick Guide

**Time Required:** 5 minutes

---

## Step 1: Run the Diagnostic Script (2 minutes)

### Via Supabase Dashboard (Easiest)

1. Open https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Create new query
5. Copy everything from `scripts/diagnose-user-system.sql`
6. Click **RUN**
7. Wait for results

### Via CLI

```bash
supabase db execute --file scripts/diagnose-user-system.sql > results.txt
cat results.txt
```

---

## Step 2: Check These 6 Key Things (3 minutes)

### ✅ Checklist

#### 1. **Which tables exist?**

Look for section: `=== EXISTING TABLES ===`

- [ ] ✅ `profiles` exists
- [ ] ❌ `users` exists (problem if yes)
- [ ] Check: How many RBAC tables? (should be 4: roles, permissions, role_permissions, user_role_assignments)

**If you have BOTH `profiles` AND `users`:** ⚠️ You need consolidation migration

#### 2. **Foreign key structure**

Look for section: `=== FOREIGN KEY CONSTRAINTS ===`

- [ ] Check: Do FKs point to `profiles.id` or `profiles.user_id`?
- [ ] ✅ Should all point to `profiles.id`
- [ ] ❌ If mixed, you need fixes

**If FKs are inconsistent:** ⚠️ You need consolidation migration

#### 3. **Data synchronization**

Look for section: `=== SAMPLE AUTH.USERS vs PROFILES ===`

Count how many show:

- ✅ OK: **\_**
- ❌ Email mismatch: **\_**
- ⚠️ Name mismatch: **\_**
- ⚠️ Role mismatch: **\_**

**If more than 10% mismatches:** ⚠️ You need consolidation migration

#### 4. **Orphaned records**

Look for section: `=== ORPHANED RECORDS CHECK ===`

- Profiles without auth.users: **\_** (should be 0)
- auth.users without profiles: **\_** (should be 0)

**If any orphans exist:** ⚠️ You need consolidation migration

#### 5. **RLS policy coverage**

Look for section: `=== RLS POLICIES ===`

Count policies:

- `profiles`: **\_** (should be 5+)
- `user_role_assignments`: **\_** (should be 3+)
- `roles`: **\_** (should be 2+)

**If missing policies:** ⚠️ You need consolidation migration

#### 6. **Functions needing fixes**

Look for section: `=== SECURITY DEFINER FUNCTIONS ===`

Count functions with `⚠️ SECURITY DEFINER`: **\_**

**If count is 26:** ⚠️ You need function fixes migration

---

## Step 3: Determine What You Need (10 seconds)

### Decision Tree

```
Do you have ANY of these issues?
├─ Both profiles AND users tables → YES: Apply consolidation migration
├─ Data sync mismatches → YES: Apply consolidation migration
├─ Orphaned records → YES: Apply consolidation migration
├─ Multiple RBAC systems → YES: Apply consolidation migration
├─ Missing RLS policies → YES: Apply consolidation migration
└─ 26 SECURITY DEFINER functions → YES: Apply function fixes migration
```

### Quick Answer

**Most Common Scenarios:**

| Scenario                                 | Migrations Needed                             |
| ---------------------------------------- | --------------------------------------------- |
| **Clean system, just function warnings** | Just `20251026_fix_function_search_paths.sql` |
| **Messy system with conflicts**          | BOTH migrations                               |
| **Already consolidated, just warnings**  | Just `20251026_fix_function_search_paths.sql` |

---

## Step 4: Record Your Results

### Fill This Out:

```
Date: _____________
Database: _____________

DIAGNOSTIC RESULTS:

1. Tables Found:
   □ profiles (_____ columns)
   □ users (_____ columns) - should NOT exist
   □ roles (_____ columns)
   □ Other RBAC: ________________

2. Data Sync Issues:
   - Mismatches: _____ %
   - Orphaned profiles: _____
   - Missing profiles: _____

3. Foreign Keys:
   □ All consistent
   □ Mixed (needs fixing)

4. RLS Policies:
   - profiles: _____ policies
   - user_role_assignments: _____ policies

5. Security Warnings:
   - SECURITY DEFINER functions: _____

DECISION:
□ Apply consolidation migration
□ Apply function fixes migration
□ Apply BOTH
□ System is clean (no action needed)

NEXT STEP: ___________________
```

---

## Step 5: What To Do Next

### If you need consolidation migration:

```bash
# Next: Open USER_SYSTEM_FIX_GUIDE.md
# Go to: Step 3 - Apply Migrations
# Run: 20251026_consolidate_user_profile_system.sql
```

### If you need function fixes only:

```bash
# Next: Apply migration
supabase db push
# Or manually apply 20251026_fix_function_search_paths.sql
```

### If you need BOTH (most common):

```bash
# Next: Open USER_SYSTEM_FIX_GUIDE.md
# Follow: Complete Step 3
# Both migrations will apply in correct order
```

---

## 📊 Example Results Analysis

### Example 1: Clean System

```
EXISTING TABLES:
- profiles (15 columns) ✅
- roles (7 columns) ✅
- permissions (6 columns) ✅
- user_role_assignments (10 columns) ✅

ORPHANED RECORDS:
- Profiles without auth.users: 0 ✅
- auth.users without profiles: 0 ✅

DATA SYNC:
- All showing ✅ OK

SECURITY DEFINER:
- 26 functions ⚠️

VERDICT: Apply function fixes migration only
```

### Example 2: Messy System (Common)

```
EXISTING TABLES:
- profiles (10 columns)
- users (14 columns) ❌ Problem!
- rbac_roles (5 columns) ❌
- roles (7 columns) ❌ Conflict!
- user_roles (4 columns) ❌

ORPHANED RECORDS:
- Profiles without auth.users: 3 ❌
- auth.users without profiles: 12 ❌

DATA SYNC:
- 15 mismatches ❌

SECURITY DEFINER:
- 26 functions ⚠️

VERDICT: Apply BOTH migrations!
```

---

## ⚡ Quick Commands

### Run diagnostics:

```bash
# Dashboard: Copy scripts/diagnose-user-system.sql and run
# OR
supabase db execute --file scripts/diagnose-user-system.sql
```

### Save results:

```bash
supabase db execute --file scripts/diagnose-user-system.sql > diagnostic-results.txt
```

### Apply fixes:

```bash
# This will apply both migrations automatically
supabase db push
```

### Verify:

```bash
supabase db lint
# Should show 0 errors
```

---

## 🎯 Success Criteria

After running diagnostics, you should be able to answer:

- [ ] I know which tables exist
- [ ] I know if I have orphaned data
- [ ] I know my data sync status
- [ ] I know which migrations I need
- [ ] I'm ready to proceed

**If all checked:** Proceed to apply migrations!

---

## 📞 Need Help?

Can't interpret results? Share them and I'll help analyze!

Include:

1. Section 1 output (tables)
2. Section 8 output (data sync)
3. Section 9 output (orphaned records)
4. Section 11 output (security definer count)

---

**Next Step:** Run the diagnostic now, then review with `DIAGNOSTIC_INTERPRETATION_GUIDE.md`!

**Time:** 5 minutes  
**Risk:** Zero (read-only queries)  
**Benefit:** Know exactly what needs fixing

🚀 **Go run it now!**
