# Register 169 Promoters - Step-by-Step Checklist

## Current Status ✅
- ✅ 172 total active promoters
- ✅ All promoters have unique emails (no duplicates)
- ✅ 3 promoters already registered and have employer_employee records
- ⚠️ **169 promoters need registration**

---

## Step 1: Prepare Registration Data ✅

Run this script to get all registration data:

```sql
\i scripts/prepare-all-promoters-for-registration.sql
```

**What you'll get:**
- Summary by employer
- CSV format (all 169 promoters)
- JSON format for API (all in one array)
- JSON grouped by employer (for batch processing)

**Save the JSON output** from Part 3 for the next step.

---

## Step 2: Choose Registration Method

You have 3 options. Choose the one that works best for your setup:

### Option A: Bulk API Registration (Recommended)

**If you have a registration API endpoint:**

1. Use the JSON array from `prepare-all-promoters-for-registration.sql` (Part 3)
2. Call your API endpoint (e.g., `POST /api/users` or `POST /api/employer/team/invite`)
3. Send the entire JSON array in one request (or split into batches if needed)

**Example API call:**
```javascript
// Using the JSON from the script
const registrationData = [/* JSON array from script */];

fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registrationData)
});
```

### Option B: Supabase Admin API

**If you want to use Supabase directly:**

1. Get your Supabase Admin API key from the dashboard
2. Use the JSON from the script
3. Create `auth.users` entries via Supabase Admin API
4. Profiles will be created automatically via triggers

**See:** `docs/REGISTER_123_PROMOTERS_GUIDE.md` for detailed Supabase Admin API instructions

### Option C: Batch by Employer

**If you want to register in smaller batches:**

1. Use the JSON from Part 4 (grouped by employer)
2. Register one employer at a time
3. Verify after each batch

---

## Step 3: Verify Registration Progress

After registering, check progress:

```sql
\i scripts/quick-status-check.sql
```

**Look for:**
- "Promoters Needing Registration" should decrease
- "Promoters with Profiles" should increase

**Or run this quick check:**
```sql
SELECT 
  COUNT(DISTINCT p.id) as registered_count,
  COUNT(DISTINCT p.id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(p.email))
    )
  ) as with_profiles
FROM promoters p
JOIN parties pt ON pt.id = p.employer_id
WHERE pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND p.status = 'active'
  AND p.email IS NOT NULL
  AND TRIM(p.email) != '';
```

---

## Step 4: Create Employer_Employee Records

**After all 169 promoters are registered** (have profiles), run:

```sql
\i scripts/create-missing-employer-employees-for-existing-profiles.sql
```

**This will:**
- Create employer_employee records for all newly registered promoters
- Link them to their employers
- Set proper employment status and job details
- Report how many records were created

**Expected result:** ~169 records created (one for each newly registered promoter)

---

## Step 5: Final Verification

Run the status check again:

```sql
\i scripts/quick-status-check.sql
```

**Expected final results:**
- ✅ Promoters Needing Registration: **0**
- ✅ Promoters with Profiles: **172** (all of them)
- ✅ Promoters with employer_employee Records: **172** (all of them)
- ✅ All data quality checks: **✅ None**

---

## Troubleshooting

### If registration fails for some promoters:

1. **Check for errors** in the API response
2. **Verify email uniqueness** - all should be unique already
3. **Check if profiles were created** - some might have been created even if API returned errors
4. **Re-run the status check** to see current state

### If some promoters still don't have profiles after registration:

1. **Check the registration logs/errors**
2. **Verify the email addresses** are correct
3. **Try registering them individually** to see specific errors
4. **Check if there are any constraints** preventing profile creation

### If employer_employee records aren't created:

1. **Verify both employer and employee profiles exist:**
   ```sql
   SELECT 
     pt.name_en as employer,
     COUNT(DISTINCT emp_pr.id) as employer_profiles,
     COUNT(DISTINCT emp_profile.id) as employee_profiles
   FROM promoters p
   JOIN parties pt ON pt.id = p.employer_id
   LEFT JOIN profiles emp_pr ON LOWER(TRIM(emp_pr.email)) = LOWER(TRIM(pt.contact_email))
   LEFT JOIN profiles emp_profile ON LOWER(TRIM(emp_profile.email)) = LOWER(TRIM(p.email))
   WHERE p.status = 'active'
     AND pt.type = 'Employer'
     AND pt.overall_status = 'active'
   GROUP BY pt.id, pt.name_en;
   ```

2. **Check if employer parties have contact_email:**
   ```sql
   SELECT 
     pt.name_en,
     pt.contact_email
   FROM parties pt
   WHERE pt.type = 'Employer'
     AND pt.overall_status = 'active'
     AND (pt.contact_email IS NULL OR TRIM(pt.contact_email) = '');
   ```

---

## Progress Tracking

Use this to track your progress:

- [ ] Step 1: Prepared registration data
- [ ] Step 2: Registered promoters (0/169)
- [ ] Step 3: Verified registration (all 169 have profiles)
- [ ] Step 4: Created employer_employee records
- [ ] Step 5: Final verification passed

---

## Quick Command Reference

```bash
# 1. Prepare data
psql -f scripts/prepare-all-promoters-for-registration.sql

# 2. (Register via your chosen method)

# 3. Check progress
psql -f scripts/quick-status-check.sql

# 4. Create employer_employee records (after registration)
psql -f scripts/create-missing-employer-employees-for-existing-profiles.sql

# 5. Final verification
psql -f scripts/quick-status-check.sql
```

---

## Success Criteria

✅ **System is complete when:**
- All 172 promoters have profiles
- All 172 promoters have employer_employee records
- All promoters can access attendance, tasks, targets, and permissions
- No data quality issues remain

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Run diagnostic scripts in the `scripts/` folder
3. Review the error messages carefully
4. Verify data integrity with `quick-status-check.sql`

