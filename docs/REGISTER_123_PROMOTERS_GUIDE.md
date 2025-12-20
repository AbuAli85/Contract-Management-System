# 🚀 Register 123 Promoters Guide

**Step-by-step guide to register 123 promoters who need profiles.**

---

## 📊 **Current Status**

Based on your analysis results:
- ✅ **0** employer parties need profiles (all have profiles)
- ✅ **0** employer parties need companies (all have companies)
- ⚠️ **123** promoters need registration (no profiles)
- ✅ **0** missing `employer_employee` records (for promoters with profiles)

---

## 🎯 **Step 1: Check for Duplicate Emails**

Before registration, check if there are duplicate emails blocking registration:

```sql
-- Run this script to check for duplicates
\i scripts/check-and-prepare-promoter-registration.sql
```

**If duplicates are found:**
- Run `scripts/fix-duplicate-emails-and-register.sql` to fix them
- This will generate unique emails for promoters with duplicates
- Original emails are backed up in `original_email` column

**If no duplicates:**
- Proceed to Step 2

---

## 🚀 **Step 2: Choose Registration Method**

You have **3 options** for registering the 123 promoters:

### **Option 1: Bulk Registration via API (Recommended)**

Use the `/api/employer/team/invite` endpoint to register promoters in batches.

#### **Step 2.1: Get Promoter Data**

Run this query to get promoters ready for registration:

```sql
\i scripts/prepare-promoters-for-bulk-registration.sql
```

#### **Step 2.2: Create Registration Script**

Create a script to call the API for each promoter:

```typescript
// scripts/bulk-register-promoters.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
);

// Get promoters from database
const { data: promoters } = await supabase
  .from('promoters')
  .select(`
    id,
    email,
    name_en,
    mobile_number,
    phone,
    employer_id,
    parties!inner(name_en, contact_email)
  `)
  .eq('status', 'active')
  .is('profiles.email', null); // Only promoters without profiles

// Register each promoter
for (const promoter of promoters) {
  try {
    // Create auth user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: promoter.email.toLowerCase(),
      password: generateTemporaryPassword(),
      email_confirm: true,
      user_metadata: {
        full_name: promoter.name_en,
        role: 'promoter',
        must_change_password: true,
      },
    });

    if (userError) {
      console.error(`Failed to create user for ${promoter.email}:`, userError);
      continue;
    }

    // Profile is created automatically via trigger
    // Create employer_employee record
    const { error: eeError } = await supabase
      .from('employer_employees')
      .insert({
        employer_id: employerProfileId, // Get from employer's profile
        employee_id: user.user.id,
        promoter_id: promoter.id,
        party_id: promoter.employer_id,
        employment_type: 'contract',
        employment_status: 'active',
      });

    if (eeError) {
      console.error(`Failed to create employer_employee for ${promoter.email}:`, eeError);
    }

    console.log(`✅ Registered: ${promoter.email}`);
  } catch (error) {
    console.error(`Error registering ${promoter.email}:`, error);
  }
}
```

---

### **Option 2: Use Existing Invite API Endpoint**

If you have access to the employer team management UI, you can use the invite endpoint:

```bash
# For each promoter, make a POST request:
curl -X POST https://your-domain.com/api/employer/team/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "promoter@example.com",
    "full_name": "Promoter Name",
    "phone": "+968 9123 4567",
    "job_title": "Promoter",
    "employment_type": "contract"
  }'
```

**Note:** This requires authentication as an employer.

---

### **Option 3: Supabase Admin API (Direct)**

If you have Supabase admin access, you can create users directly:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get promoters needing registration
const { data: promoters } = await supabaseAdmin
  .from('promoters')
  .select(`
    *,
    parties!inner(*)
  `)
  .eq('status', 'active')
  .is('email', null, { foreignTable: 'profiles', column: 'email' });

// Register each promoter
for (const promoter of promoters) {
  // Create auth user
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email: promoter.email.toLowerCase(),
    password: generateTemporaryPassword(),
    email_confirm: true,
    user_metadata: {
      full_name: promoter.name_en,
      role: 'promoter',
      must_change_password: true,
    },
  });

  if (error) {
    console.error(`Failed: ${promoter.email}`, error);
    continue;
  }

  console.log(`✅ Created: ${promoter.email} (${user.user.id})`);
}
```

---

## ✅ **Step 3: Create Missing `employer_employee` Records**

After registration, create the linking records:

```sql
-- Run this script to create employer_employee records
\i scripts/create-missing-employer-employees-for-existing-profiles.sql
```

This script will:
- Find promoters with profiles but missing `employer_employee` records
- Create the linking records automatically
- Link promoters to their employers

---

## 🔍 **Step 4: Verify Registration**

Run the analysis script again to verify:

```sql
-- Re-run analysis
\i scripts/analyze-provided-parties-and-promoters.sql
```

**Expected results:**
- ✅ **0** promoters need registration
- ✅ **0** missing `employer_employee` records
- ✅ All 123 promoters have profiles
- ✅ All 123 promoters have `employer_employee` records

---

## 📋 **Quick Checklist**

- [ ] Check for duplicate emails
- [ ] Fix duplicate emails (if any)
- [ ] Choose registration method
- [ ] Register all 123 promoters
- [ ] Create missing `employer_employee` records
- [ ] Verify all promoters have profiles
- [ ] Verify all promoters have `employer_employee` records
- [ ] Test attendance/tasks access for a sample promoter

---

## 🚨 **Troubleshooting**

### **Error: "Email already exists"**
- Check if promoter already has a profile
- Verify email is unique in `auth.users` and `profiles`

### **Error: "Foreign key constraint violation"**
- Ensure employer party has a profile (should be ✅ based on your results)
- Ensure employer party has a company (should be ✅ based on your results)

### **Error: "Duplicate key value violates unique constraint"**
- Check for duplicate emails in promoters table
- Run duplicate email fix script

---

## 📊 **Progress Tracking**

Track your registration progress:

```sql
-- Check registration progress
SELECT 
  'Total promoters' as metric,
  COUNT(*) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'

UNION ALL

SELECT 
  'Promoters with profiles' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles pr ON LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != ''

UNION ALL

SELECT 
  'Promoters with employer_employee records' as metric,
  COUNT(DISTINCT p.id) as count
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
JOIN employer_employees ee ON ee.employee_id = emp_profile.id
  AND ee.employer_id = emp_pr.id
WHERE p.status = 'active'
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != '';
```

---

## 🎉 **Success Criteria**

You're done when:
- ✅ All 123 promoters have profiles
- ✅ All 123 promoters have `employer_employee` records
- ✅ All promoters can access attendance, tasks, targets
- ✅ Analysis script shows 0 missing relationships

---

## 📚 **Related Documentation**

- `docs/ANALYZE_PARTIES_AND_PROMOTERS_GUIDE.md` - Analysis guide
- `docs/PROMOTER_REGISTRATION_GUIDE.md` - General registration guide
- `docs/DUPLICATE_EMAIL_SOLUTION.md` - Duplicate email handling
- `scripts/check-and-prepare-promoter-registration.sql` - Registration readiness check

