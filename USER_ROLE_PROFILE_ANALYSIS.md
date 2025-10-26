# 🔍 User, Role & Profile System Analysis

**Date:** October 26, 2025  
**Status:** ❌ **Critical Issues Found**

---

## 📊 Executive Summary

Your user/role/profile system has **MAJOR architectural problems** that need immediate attention:

- ❌ **Multiple conflicting table structures**
- ❌ **Inconsistent data storage** (same data in 3+ places)
- ❌ **Broken foreign key references**
- ❌ **Role/permission system chaos** (4 different implementations)
- ❌ **Data synchronization issues**
- ❌ **Security vulnerabilities** (26 SECURITY DEFINER functions)

---

## 🔴 Critical Issues

### 1. Table Structure Conflicts

#### Problem: Multiple `profiles` Tables
Multiple migrations try to create `profiles` with different structures:

| Migration | Primary Key | Foreign Key | Columns |
|-----------|-------------|-------------|---------|
| `00_init.sql` | `id` (UUID, independent) | `user_id` → `auth.users(id)` | id, user_id, email, full_name, avatar_url, phone, address, preferences |
| `20240101_fix_auth_schema.sql` | `id` (UUID) | **REFERENCES** `auth.users(id)` | id, email, first_name, last_name, role, status, avatar_url, bio, phone, company |

**Issue:** These are **incompatible**! 
- One uses separate `id` + `user_id`
- Other uses `id` = `auth.users.id` directly

#### Problem: `users` Table vs `profiles` Table

Some code expects a `users` table (separate from `auth.users`), others expect `profiles`:

```sql
-- From 20250729090000_enforce_profiles_rls.sql
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );
```

**Issue:** References `users.role` but `users` table structure is unknown/inconsistent!

### 2. Role Storage Chaos

Roles are stored in **FIVE DIFFERENT PLACES**:

| Location | Format | Example |
|----------|--------|---------|
| `auth.users.raw_user_meta_data->>'role'` | JSONB string | `"admin"` |
| `profiles.role` | TEXT with CHECK constraint | `"user"`, `"admin"`, `"manager"`, `"promoter"` |
| `users.role` | TEXT with CHECK constraint | `"admin"`, `"manager"`, `"user"`, `"viewer"` |
| `user_roles` table | Enum + JSONB permissions | From `00_init.sql` |
| `rbac_user_role_assignments` | UUID foreign keys | Full RBAC system |

**Issue:** Which is the source of truth? They can easily get out of sync!

### 3. Foreign Key Reference Confusion

Different migrations reference different columns:

```sql
-- From 00_init.sql
CREATE TABLE user_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL
);

-- From 20251021_fix_permission_cache.sql  
CREATE VIEW rbac_user_role_assignments AS
SELECT 
  ur.user_id,  -- This comes from user_roles
  r.id as role_id
FROM user_roles ur
JOIN roles r ON ur.role = r.name;  -- TEXT join, not UUID!
```

**Issue:** Mixing UUID references with TEXT-based role matching!

### 4. Data Synchronization Problems

**Current User Update Flow:**

```
User updates name → auth.users.raw_user_meta_data
                  ↓
            profiles.full_name?
                  ↓
            users.full_name?
                  ↓
          Where is it stored???
```

**Issue:** No automatic sync! Data gets stale immediately.

### 5. Multiple RBAC Implementations

| System | Tables | Status |
|--------|--------|--------|
| **Simple Role** | `profiles.role` (TEXT) | ✅ Active but limited |
| **User Roles** | `user_roles`, `roles` | ⚠️ Partially implemented |
| **RBAC Fixed** | `rbac_roles`, `rbac_permissions`, `rbac_role_permissions`, `rbac_user_role_assignments` | ❓ Unknown if active |
| **Permissions** | `permissions` table | ⚠️ Orphaned? |

**Issue:** Four different permission systems! Which one is actually used?

### 6. RLS Policy Conflicts

Policies reference tables that may not exist:

```sql
-- From 20250729_add_profiles_rls.sql
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users  -- ❌ Does 'users' table exist?
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
```

**Issue:** Circular dependencies and missing table references!

---

## 🏗️ Current Architecture (Messy)

```
┌─────────────────────────────────────────┐
│         auth.users (Supabase)           │
│  ┌────────────────────────────────┐     │
│  │ id                             │     │
│  │ email                          │     │
│  │ raw_user_meta_data:            │     │
│  │   - role: "admin"              │     │
│  │   - full_name: "Waqas Ahmad"   │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
           ↓                    ↓
    ┌──────────┐         ┌─────────┐
    │ profiles │         │  users  │  ← Which one???
    │  .role   │         │  .role  │
    └──────────┘         └─────────┘
           ↓                    ↓
    ┌──────────────────────────────┐
    │       user_roles             │
    │  .role (enum)                │
    │  .permissions (JSONB)        │
    └──────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │  rbac_user_role_assignments  │
    │  .role_id → rbac_roles       │
    └──────────────────────────────┘
```

---

## ✅ Recommended Architecture

### Single Source of Truth Model

```
┌─────────────────────────────────────────┐
│         auth.users (Supabase)           │
│  ┌────────────────────────────────┐     │
│  │ id (PRIMARY)                   │     │
│  │ email                          │     │
│  │ raw_user_meta_data (minimal)   │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
           ↓ (1:1 automatic sync)
    ┌──────────────────────────────┐
    │        profiles              │
    │  id = auth.users.id (PK,FK)  │
    │  email (synced)              │
    │  full_name                   │
    │  avatar_url                  │
    │  phone                       │
    │  department                  │
    │  position                    │
    │  preferences (JSONB)         │
    │  created_at, updated_at      │
    └──────────────────────────────┘
           ↓ (1:many)
    ┌──────────────────────────────┐
    │    user_role_assignments     │
    │  user_id → profiles(id)      │
    │  role_id → roles(id)         │
    │  is_active                   │
    │  valid_from, valid_until     │
    └──────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │          roles               │
    │  id (UUID)                   │
    │  name (admin, manager, etc)  │
    │  category                    │
    │  description                 │
    └──────────────────────────────┘
           ↓ (many:many)
    ┌──────────────────────────────┐
    │     role_permissions         │
    │  role_id → roles(id)         │
    │  permission_id → permissions │
    └──────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │       permissions            │
    │  id (UUID)                   │
    │  resource                    │
    │  action                      │
    │  scope                       │
    │  name                        │
    └──────────────────────────────┘
```

---

## 🛠️ Proposed Solution

### Phase 1: Consolidation (Priority: CRITICAL)

1. **Drop conflicting tables**
   - Remove duplicate `users` table
   - Keep only `profiles` (Supabase standard)
   - Consolidate RBAC tables (use `rbac_*` prefix)

2. **Standardize profiles table**
   ```sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT UNIQUE NOT NULL,
     full_name TEXT,
     avatar_url TEXT,
     phone TEXT,
     department TEXT,
     position TEXT,
     bio TEXT,
     preferences JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Use rbac_* tables for permissions**
   - `rbac_roles`
   - `rbac_permissions`
   - `rbac_role_permissions`
   - `rbac_user_role_assignments`

### Phase 2: Synchronization (Priority: HIGH)

1. **Auto-sync trigger**
   ```sql
   CREATE OR REPLACE FUNCTION sync_auth_to_profile()
   RETURNS TRIGGER AS $$
   BEGIN
     UPDATE profiles SET
       email = NEW.email,
       full_name = NEW.raw_user_meta_data->>'full_name',
       updated_at = NOW()
     WHERE id = NEW.id;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY INVOKER;
   ```

2. **Bidirectional sync**
   - Profile updates → auth.users metadata
   - Auth updates → profile table

### Phase 3: Security Fixes (Priority: HIGH)

1. **Fix SECURITY DEFINER functions**
   - Add `SET search_path = public, pg_catalog`
   - Or convert to `SECURITY INVOKER`

2. **Proper RLS policies**
   - Remove circular dependencies
   - Use materialized view for permission checks

### Phase 4: Migration Strategy (Priority: HIGH)

1. **Data migration**
   - Audit existing data
   - Identify primary source
   - Migrate to consolidated structure
   - Validate integrity

2. **Backward compatibility**
   - Create views for old table names
   - Deprecation warnings
   - Gradual migration path

---

## 📋 Immediate Action Items

### 🔥 Critical (Do Now)

1. ✅ **Audit current database**
   ```sql
   -- Run this to see what actually exists
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND (table_name LIKE '%user%' OR table_name LIKE '%profile%' OR table_name LIKE '%role%')
   ORDER BY table_name;
   ```

2. ✅ **Identify data conflicts**
   ```sql
   -- Check for data mismatches
   SELECT 
     au.id,
     au.email,
     au.raw_user_meta_data->>'full_name' as auth_name,
     p.full_name as profile_name,
     au.raw_user_meta_data->>'role' as auth_role,
     p.role as profile_role
   FROM auth.users au
   LEFT JOIN profiles p ON au.id = p.id
   WHERE 
     au.raw_user_meta_data->>'full_name' != p.full_name
     OR au.raw_user_meta_data->>'role' != p.role;
   ```

3. ✅ **Create consolidation migration**
   - Fix table structures
   - Migrate data
   - Update foreign keys
   - Fix RLS policies

### ⚠️ High Priority (This Week)

4. **Fix SECURITY DEFINER functions** (26 functions)
5. **Implement sync triggers**
6. **Update application code** to use single source
7. **Create unified user management API**

### 📅 Medium Priority (This Month)

8. **Deprecate old tables** (with warnings)
9. **Update documentation**
10. **Create admin dashboard** for user management
11. **Performance optimization**

---

## 🎯 Success Criteria

After fixes, the system should have:

✅ **Single profiles table** (no `users` table duplication)  
✅ **Consistent role storage** (RBAC system only)  
✅ **Auto-sync between auth.users and profiles**  
✅ **No conflicting foreign keys**  
✅ **Proper RLS policies** (no circular dependencies)  
✅ **All functions use SECURITY INVOKER** or have fixed search_path  
✅ **Clean permission system** (one RBAC implementation)  
✅ **Comprehensive documentation**  

---

## 📚 Files to Review

1. `supabase/migrations/00_init.sql` - Initial schema
2. `supabase/migrations/20240101000000_fix_auth_schema.sql` - Profile fix attempt
3. `supabase/migrations/20250211_rbac_schema_fixed.sql` - RBAC system
4. `supabase/migrations/20250729090000_enforce_profiles_rls.sql` - RLS policies
5. `supabase/migrations/20251021_fix_permission_cache.sql` - Permission cache

---

## ⚠️ Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | 🔴 HIGH | Full backup + rollback plan |
| Application downtime | 🟡 MEDIUM | Staged migration with views |
| Permission conflicts | 🟡 MEDIUM | Audit before + test thoroughly |
| Foreign key violations | 🟡 MEDIUM | Data validation + cleanup scripts |

---

## 💡 Recommendations

### DO:
✅ Create comprehensive backup before any changes  
✅ Test migration on copy of production data  
✅ Use transactions for all data migrations  
✅ Create deprecation path for old structures  
✅ Update all application code simultaneously  
✅ Monitor for errors after deployment  

### DON'T:
❌ Drop tables without data migration  
❌ Change both structure and data in one migration  
❌ Skip testing on production-like data  
❌ Ignore foreign key constraints  
❌ Deploy during peak hours  

---

**Next Step:** Review this analysis, then I'll create the consolidation migration.

Would you like me to proceed with creating the fix migration?

