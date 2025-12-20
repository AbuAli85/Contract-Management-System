# 📋 Analysis Next Steps

**Summary of analysis tools created and recommended workflow for fixing missing relationships.**

---

## ✅ **What We've Created**

1. **`scripts/analyze-provided-parties-and-promoters.sql`**
   - Comprehensive analysis script that checks all relationships
   - Identifies missing profiles, companies, and `employer_employee` records
   - Generates detailed reports by employer party

2. **`docs/ANALYZE_PARTIES_AND_PROMOTERS_GUIDE.md`**
   - Complete guide on how to use the analysis script
   - Explains how to interpret results
   - Provides next steps based on findings

---

## 🎯 **Recommended Workflow**

### **Step 1: Run the Analysis Script**

Execute the analysis script to get a baseline of current system state:

```sql
-- Run in Supabase SQL Editor
\i scripts/analyze-provided-parties-and-promoters.sql
```

### **Step 2: Review the Results**

Focus on these key metrics:
- **Employer Parties WITHOUT Profiles** - Need user registration
- **Employer Parties WITHOUT Companies** - Need company creation
- **Promoters WITHOUT Profiles** - Need user registration (may be blocked by duplicate emails)
- **Promoters WITHOUT employer_employee Records** - Need linking records created
- **Duplicate Email Analysis** - Identifies email conflicts

### **Step 3: Prioritize Fixes**

Based on the analysis results, prioritize in this order:

#### **Priority 1: Fix Duplicate Emails**
If duplicate emails are found:
```sql
-- Run the duplicate email fix script
\i scripts/fix-duplicate-emails-and-register.sql
```

#### **Priority 2: Register Missing Employer Profiles**
For employer parties missing profiles:
1. Identify parties with `contact_email` but no matching profile
2. Register these users via API or UI
3. Ensure `contact_email` in `parties` matches `email` in `profiles`

#### **Priority 3: Create Missing Companies**
For employer parties missing companies:
```sql
-- Run the sync script
\i scripts/sync-companies-to-parties.sql
```

#### **Priority 4: Register Missing Promoter Profiles**
For promoters missing profiles:
1. Use bulk registration API or UI
2. Ensure `promoters.email` matches `profiles.email`

#### **Priority 5: Create Missing `employer_employee` Records**
For promoters with profiles but missing linking records:
```sql
-- Run the creation script
\i scripts/create-missing-employer-employees-for-existing-profiles.sql
```

### **Step 4: Verify Fixes**

Re-run the analysis script to confirm all issues are resolved:

```sql
-- Run again to verify
\i scripts/analyze-provided-parties-and-promoters.sql
```

Target: **Zero missing relationships** in all sections.

---

## 📊 **Expected Results After Fixes**

After completing all fixes, you should see:

```
=== SUMMARY STATISTICS ===
Total Employer Parties: 18
Employer Parties with Profiles: 18 ✅
Employer Parties WITHOUT Profiles: 0 ✅
Employer Parties with Companies: 18 ✅
Employer Parties WITHOUT Companies: 0 ✅
Total Active Promoters: 183
Promoters with Profiles: 183 ✅
Promoters WITHOUT Profiles: 0 ✅
Promoters with employer_employee Records: 183 ✅
Promoters WITHOUT employer_employee Records (but have profiles): 0 ✅
```

---

## 🔍 **Specific Checks for Provided Data**

Based on the provided JSON lists:

### **22 Parties (18 Employers, 4 Clients)**

Check that all 18 employer parties:
- ✅ Have `contact_email` set
- ✅ Have matching `profiles` entry (by email)
- ✅ Have matching `companies` entry (by `party_id` or `id`)

### **183 Promoters**

Check that all 183 promoters:
- ✅ Have unique `email` addresses (no duplicates)
- ✅ Have matching `profiles` entry (by email)
- ✅ Have `employer_employee` record linking them to their employer

---

## 🚨 **Common Issues and Solutions**

### **Issue: "No Contact Email Provided"**
- **Solution:** Update `parties.contact_email` with the correct email address
- **Then:** Register the user with that email

### **Issue: "Contact Email Exists But No Matching Profile"**
- **Solution:** Register the user with the email from `parties.contact_email`
- **Verify:** `profiles.email` matches `parties.contact_email` (case-insensitive)

### **Issue: "No Email" for Promoters**
- **Solution:** Assign unique emails to promoters (see duplicate email fix script)
- **Then:** Register promoters with those emails

### **Issue: "No Employee Profile" for Promoters**
- **Solution:** Register promoters (create `auth.users` entries)
- **Verify:** `profiles.email` matches `promoters.email` (case-insensitive)

### **Issue: "Both Profiles Exist But Missing employer_employee Record"**
- **Solution:** Run `scripts/create-missing-employer-employees-for-existing-profiles.sql`
- **Verify:** Check `employer_employees` table for the linking record

---

## 📝 **Quick Reference: Script Execution Order**

```bash
# 1. Analyze current state
psql -f scripts/analyze-provided-parties-and-promoters.sql

# 2. Fix duplicate emails (if needed)
psql -f scripts/fix-duplicate-emails-and-register.sql

# 3. Sync companies from parties
psql -f scripts/sync-companies-to-parties.sql

# 4. Create missing employer_employee records
psql -f scripts/create-missing-employer-employees-for-existing-profiles.sql

# 5. Verify fixes
psql -f scripts/analyze-provided-parties-and-promoters.sql
```

---

## 🎯 **Success Criteria**

The system is fully unified when:

1. ✅ All employer parties have profiles (by `contact_email`)
2. ✅ All employer parties have companies
3. ✅ All promoters have unique emails
4. ✅ All promoters have profiles (by email)
5. ✅ All promoters have `employer_employee` records
6. ✅ All `employer_employee` records have correct `party_id` and `promoter_id`
7. ✅ All `employer_employee` records have correct `company_id`

---

## 📚 **Related Documentation**

- `docs/ANALYZE_PARTIES_AND_PROMOTERS_GUIDE.md` - Detailed guide on using the analysis script
- `docs/PROMOTERS_VS_EMPLOYEES_EXPLANATION.md` - Understanding the unified system
- `docs/DUPLICATE_EMAIL_SOLUTION.md` - Handling duplicate emails
- `docs/COMPLETE_FIX_WORKFLOW.md` - Complete workflow guide

