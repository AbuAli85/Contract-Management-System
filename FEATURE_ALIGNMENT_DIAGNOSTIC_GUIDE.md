# 🔍 Feature Alignment Diagnostic Guide

## Current Status

After running all scripts:
- ✅ **181** Promoters with employer_id
- ⚠️ **Only 4** Employer Employees with party_id (Expected: ~181)
- ⚠️ **Only 4** Employer Employees with promoter_id (Expected: ~181)

**Gap:** 177 promoters are not linked to employer_employee records.

---

## Why Only 4 Were Linked?

The linking requires **BOTH**:
1. ✅ Promoter has an email
2. ✅ Promoter has a matching profile (by email)
3. ✅ Employer party has a contact_email
4. ✅ Employer party has a matching profile (by email)

If any of these are missing, the promoter won't be linked.

---

## Diagnostic Script

Run this to see exactly why promoters aren't being linked:

```sql
-- File: scripts/diagnose-promoter-linking-issues.sql
```

**This will show:**
- How many promoters are missing emails
- How many promoters don't have profiles
- How many employers don't have contact_emails
- How many employers don't have profiles
- Sample data for each category

---

## Common Issues & Solutions

### Issue 1: Promoters Missing Email
**Problem:** Promoters don't have email addresses  
**Solution:** Add emails to promoters table

### Issue 2: Promoters Missing Profiles
**Problem:** Promoters have emails but no matching profiles  
**Solution:** Create auth.users entries, then profiles will auto-create

### Issue 3: Employers Missing Contact Email
**Problem:** Employer parties don't have contact_email  
**Solution:** Add contact_email to parties table

### Issue 4: Employers Missing Profiles
**Problem:** Employers have contact_email but no matching profiles  
**Solution:** Create auth.users entries for employers

---

## Quick Fixes

### Fix 1: Add Missing Emails to Promoters
```sql
-- Update promoters with missing emails (if you have the data)
UPDATE promoters 
SET email = 'promoter-' || id::text || '@example.com'  -- Replace with actual emails
WHERE email IS NULL 
  AND employer_id IS NOT NULL;
```

### Fix 2: Add Missing Contact Emails to Employers
```sql
-- Update parties with missing contact_email
UPDATE parties 
SET contact_email = 'employer-' || id::text || '@example.com'  -- Replace with actual emails
WHERE type = 'Employer'
  AND contact_email IS NULL;
```

### Fix 3: Create Profiles for Existing Users
If you have auth.users entries but no profiles:
```sql
-- This should auto-create profiles, but if not:
INSERT INTO profiles (id, email, full_name, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'active'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);
```

---

## Expected Results After Fixes

After addressing the issues:
- Promoters with employer_employee records: Should increase from 4
- The exact number depends on how many have:
  - ✅ Email addresses
  - ✅ Matching profiles
  - ✅ Employers with contact_email
  - ✅ Employers with matching profiles

---

## Next Steps

1. ✅ **Run diagnostic script** to identify specific issues
2. ✅ **Fix missing emails** (promoters and employers)
3. ✅ **Create auth.users** for users that need profiles
4. ✅ **Re-run sync script** to link remaining promoters

---

**Status:** ⚠️ **Diagnostic Needed** - Run diagnostic script to identify specific issues

