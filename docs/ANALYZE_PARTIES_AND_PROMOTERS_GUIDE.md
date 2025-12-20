# 📊 Analyze Provided Parties and Promoters Guide

**Guide for analyzing the provided parties and promoters lists to identify missing relationships and data inconsistencies.**

---

## 🎯 **Purpose**

This analysis script (`scripts/analyze-provided-parties-and-promoters.sql`) helps you:

1. **Identify employer parties missing profiles** (by checking `contact_email` against `profiles.email`)
2. **Identify employer parties missing companies**
3. **Check if promoters under these employers have `employer_employee` records**
4. **Generate a comprehensive report** of missing relationships

---

## 📋 **How to Use**

### **Step 1: Run the Analysis Script**

Execute the SQL script in your Supabase SQL editor or via psql:

```bash
psql -h your-db-host -U your-user -d your-database -f scripts/analyze-provided-parties-and-promoters.sql
```

Or copy and paste the script into the Supabase SQL Editor.

### **Step 2: Review the Results**

The script generates **7 sections** of analysis:

#### **Section 1: Summary Statistics**
- Total employer parties
- Employer parties with/without profiles
- Employer parties with/without companies
- Total active promoters
- Promoters with/without profiles
- Promoters with/without `employer_employee` records

#### **Section 2: Detailed Breakdown by Employer Party**
For each employer party, shows:
- Party ID, name (EN/AR), CRN, contact info
- Employer profile status (Has Profile / Missing Profile / No Contact Email)
- Company status (Has Company / Missing Company)
- Total promoters count
- Promoters with profiles count
- Promoters with `employer_employee` records count
- Promoters missing `employer_employee` records count

#### **Section 3: Employer Parties Missing Profiles**
Lists all employer parties that don't have matching profiles, with:
- Party ID, name, CRN, contact email
- Issue reason (No Contact Email / Contact Email Exists But No Matching Profile)
- Number of affected promoters

#### **Section 4: Employer Parties Missing Companies**
Lists all employer parties that don't have corresponding companies, with:
- Party ID, name, CRN, contact email
- Total promoters count

#### **Section 5: Promoters Missing `employer_employee` Records**
Lists promoters that are missing `employer_employee` records, with:
- Employer party info
- Promoter info
- Issue reason (No Email / No Employee Profile / No Employer Contact Email / No Employer Profile / Both Profiles Exist But Missing Record)

#### **Section 6: Duplicate Email Analysis**
Shows promoters sharing the same email address (a blocker for registration).

#### **Section 7: Action Items Summary**
Summary count of action items needed:
- Register Employer Profiles
- Create Companies for Employer Parties
- Register Promoter Profiles
- Create `employer_employee` Records

---

## 🔍 **Understanding the Results**

### **Key Relationships**

```
parties (type='Employer')
  ├─ contact_email → profiles.email (employer profile)
  ├─ id → companies.party_id (company record)
  └─ id → promoters.employer_id
      └─ email → profiles.email (employee profile)
          └─ employer_employees (links employer + employee profiles)
```

### **Common Issues**

1. **Missing Employer Profile**
   - **Symptom:** `employer_profile_status = 'Missing Profile'`
   - **Cause:** No `profiles` entry matching `parties.contact_email`
   - **Fix:** Register the employer user (create `auth.users` entry, which auto-creates `profiles`)

2. **Missing Company**
   - **Symptom:** `company_status = 'Missing Company'`
   - **Cause:** No `companies` entry linked to the party
   - **Fix:** Run `scripts/sync-companies-to-parties.sql` or create company manually

3. **Missing Employee Profile**
   - **Symptom:** `promoters_with_profiles < total_promoters`
   - **Cause:** Promoters don't have matching `profiles` entries
   - **Fix:** Register promoters (create `auth.users` entries, which auto-create `profiles`)

4. **Missing `employer_employee` Record**
   - **Symptom:** `promoters_missing_employer_employee_records > 0`
   - **Cause:** Both profiles exist but no linking record in `employer_employees`
   - **Fix:** Run `scripts/create-missing-employer-employees-for-existing-profiles.sql`

5. **Duplicate Emails**
   - **Symptom:** Multiple promoters with same email
   - **Cause:** Generic emails (e.g., `oprations@falconeyegroup.net`) shared by multiple promoters
   - **Fix:** Run `scripts/fix-duplicate-emails-and-register.sql` to assign unique emails

---

## 📝 **Next Steps Based on Results**

### **If Employer Parties Missing Profiles:**
1. Identify which parties need profiles
2. Register employer users via API or UI
3. Ensure `contact_email` in `parties` matches `email` in `profiles`

### **If Employer Parties Missing Companies:**
1. Run `scripts/sync-companies-to-parties.sql` to create companies from parties
2. Verify companies are linked via `party_id`

### **If Promoters Missing Profiles:**
1. Fix duplicate emails first (if any)
2. Register promoters via bulk registration API or UI
3. Verify `promoters.email` matches `profiles.email`

### **If Promoters Missing `employer_employee` Records:**
1. Ensure both employer and employee profiles exist
2. Run `scripts/create-missing-employer-employees-for-existing-profiles.sql`
3. Verify records are created correctly

---

## 🔗 **Related Scripts**

- `scripts/diagnose-missing-employer-employees.sql` - Similar diagnostic, focused on `employer_employees`
- `scripts/sync-companies-to-parties.sql` - Creates companies from parties
- `scripts/fix-duplicate-emails-and-register.sql` - Fixes duplicate emails
- `scripts/create-missing-employer-employees-for-existing-profiles.sql` - Creates missing `employer_employee` records

---

## 📊 **Example Output Interpretation**

```
=== SUMMARY STATISTICS ===
Total Employer Parties: 18
Employer Parties with Profiles: 12
Employer Parties WITHOUT Profiles: 6
Employer Parties with Companies: 10
Employer Parties WITHOUT Companies: 8
Total Active Promoters: 183
Promoters with Profiles: 85
Promoters WITHOUT Profiles: 98
Promoters with employer_employee Records: 75
Promoters WITHOUT employer_employee Records (but have profiles): 10
```

**Interpretation:**
- 6 employer parties need profiles registered
- 8 employer parties need companies created
- 98 promoters need profiles registered (likely due to duplicate emails)
- 10 promoters have profiles but need `employer_employee` records created

---

## ✅ **Verification After Fixes**

After applying fixes, re-run the analysis script to verify:
- All employer parties have profiles
- All employer parties have companies
- All promoters have profiles
- All promoters have `employer_employee` records

The goal is to have **zero missing relationships** in all sections.

