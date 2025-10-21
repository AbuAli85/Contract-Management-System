# 🚀 START HERE - Email Migration Quick Start

## 📊 Current Status (Confirmed)

✅ **Diagnosis Complete:**
- **112 promoters** in system
- **0 have email addresses** (0%)
- **112 need emails** (100%)

✅ **Issues Found:**
- Inconsistent status values: "?", "Cancel", "IT", "Office", "office", "V", "v"
- Should be: `active`, `inactive`, `terminated`, `on_leave`, `suspended`

✅ **Prevention Fixed:**
- ✅ Form now requires email for NEW promoters
- ✅ Existing promoters still show "—" until updated

## 🎯 What To Do RIGHT NOW

### Step 1: Export Promoter List (2 minutes)

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  COALESCE(name_en, name_ar, 'Unnamed') as name,
  id_card_number,
  COALESCE(mobile_number, phone, 'No phone') as phone,
  status,
  COALESCE(
    (SELECT name_en FROM parties WHERE id = promoters.employer_id),
    'Unassigned'
  ) as company
FROM promoters
WHERE email IS NULL OR TRIM(email) = ''
ORDER BY 
  CASE 
    WHEN status = 'active' THEN 1
    WHEN status = '?' THEN 2
    WHEN status = 'Cancel' THEN 3
    ELSE 4
  END,
  name ASC;
```

**Save results as CSV** → Open in Excel/Google Sheets

### Step 2: Add Email Column to Excel (1 minute)

Your Excel should look like:
```
| ID (UUID) | Name | ID Card | Phone | Status | Company | EMAIL (New Column) |
|-----------|------|---------|-------|--------|---------|-------------------|
| abc-123   | John | 12345   | +123  | active | CompanyA| [TO BE FILLED]   |
```

### Step 3: Collect Emails (Choose ONE method)

#### Method A: Call Promoters 📞 (RECOMMENDED)
```
For each promoter:
1. Call the phone number
2. "Hi [Name], we're updating our records. What's your email?"
3. Write email in Excel
4. Validate format: user@domain.com

Target: 20-30 promoters per day
Timeline: 4-5 days to complete all 112
```

#### Method B: Check Existing Records 📁
```
Look for emails in:
- HR database/files
- Contract documents (signed copies)
- Previous email correspondence
- Payroll system

Match by ID card number or name
```

#### Method C: Contact HR/Admin 👥
```
Ask HR department:
"Can you provide email addresses for these 112 promoters?"
Send them the Excel file
They may have this in their records
```

### Step 4: Import Emails to Database (10 minutes per batch)

Once you have emails for some promoters, use this process:

#### Option 1: Small Batch (1-10 emails) - Use Supabase Dashboard

1. Go to Supabase → Table Editor → `promoters`
2. Find the promoter by name or ID
3. Click Edit
4. Enter email in the `email` field
5. Save
6. Repeat for each

#### Option 2: Medium Batch (10-50 emails) - Use SQL

In Supabase SQL Editor:

```sql
BEGIN;

-- Update individual promoters (safe method)
UPDATE promoters SET email = 'john@example.com', updated_at = NOW()
WHERE id_card_number = '12345678' AND name_en = 'John Doe';

UPDATE promoters SET email = 'jane@example.com', updated_at = NOW()
WHERE id_card_number = '87654321' AND name_en = 'Jane Smith';

-- Add more UPDATE statements...

-- Preview what you updated:
SELECT id, name_en, email, updated_at 
FROM promoters 
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC;

-- If it looks good:
COMMIT;

-- If something is wrong:
-- ROLLBACK;
```

#### Option 3: Large Batch (50+ emails) - Use Bulk Import

See: `scripts/bulk-update-promoter-emails.sql` for detailed instructions

### Step 5: Fix Status Values (5 minutes) - OPTIONAL BUT RECOMMENDED

This standardizes the weird status values ("?", "Cancel", etc.)

```sql
-- PREVIEW first - See what will change:
SELECT 
  id,
  name_en,
  status as current_status,
  CASE 
    WHEN status IN ('active', 'Active') THEN 'active'
    WHEN status IN ('inactive', 'Inactive') THEN 'inactive'
    WHEN status IN ('Cancel', 'Cancelled', 'terminated') THEN 'terminated'
    WHEN status IN ('V', 'v', 'Office', 'office', 'IT') THEN 'active'
    WHEN status IN ('?', NULL, '') THEN 'active'
    ELSE 'active'
  END as new_status
FROM promoters
WHERE status NOT IN ('active', 'inactive', 'terminated', 'on_leave', 'suspended')
   OR status IS NULL;

-- If preview looks OK, run the update:
BEGIN;

UPDATE promoters
SET 
  status = CASE 
    WHEN status IN ('active', 'Active') THEN 'active'
    WHEN status IN ('inactive', 'Inactive') THEN 'inactive'
    WHEN status IN ('Cancel', 'Cancelled', 'terminated') THEN 'terminated'
    WHEN status IN ('V', 'v', 'Office', 'office', 'IT') THEN 'active'
    WHEN status IN ('?', NULL, '') THEN 'active'
    ELSE 'active'
  END,
  updated_at = NOW()
WHERE status NOT IN ('active', 'inactive', 'terminated', 'on_leave', 'suspended')
   OR status IS NULL;

-- Check results:
SELECT status, COUNT(*) FROM promoters GROUP BY status;

-- Should now show only: active, inactive, terminated
-- If looks good:
COMMIT;
```

### Step 6: Verify (2 minutes)

After adding emails, check they appear in the app:

1. Go to http://your-app.com/en/promoters
2. Check the Table view - emails should appear instead of "—"
3. Check Grid view - emails should appear
4. Check Cards view - emails should appear

Run this query to check progress:

```sql
-- How many emails collected so far?
SELECT 
  COUNT(*) FILTER (WHERE email IS NOT NULL AND TRIM(email) != '') as emails_added,
  COUNT(*) FILTER (WHERE email IS NULL OR TRIM(email) = '') as still_missing,
  COUNT(*) as total,
  ROUND(
    (COUNT(*) FILTER (WHERE email IS NOT NULL AND TRIM(email) != '') * 100.0) / COUNT(*),
    1
  ) as percentage_complete
FROM promoters;
```

## 📅 Suggested Timeline

### Week 1 - Goal: 50% Complete (56 emails)
- **Day 1**: Export list, start calling (target: 15 emails)
- **Day 2**: Continue calling (target: 15 emails)
- **Day 3**: Continue calling (target: 15 emails)
- **Day 4**: Continue calling (target: 11 emails)
- **Day 5**: Import first batch to database

### Week 2 - Goal: 100% Complete (112 emails)
- **Day 6-9**: Collect remaining 56 emails
- **Day 10**: Import final batch, verify all, fix status values

## 🎯 Priority Order

Focus on these promoters FIRST:

1. **Active promoters** (94) - Currently working, need to contact them
2. **Unknown status "?"** (8) - Need to clarify status AND get email
3. **Others** (10) - Lower priority if cancelled/terminated

## 💡 Pro Tips

### When Calling Promoters:

**Script:**
```
"Hello [Name], this is [Your Name] from [Company].

We're updating our system and noticed we don't have your email address on file.

Could you please provide your email address so we can send you important 
notifications about your documents and work schedule?

[Record email]

Could you spell that for me? [Confirm spelling]

Thank you! Have a great day."
```

### Email Validation Checklist:
- ✅ Contains @ symbol
- ✅ Has domain (.com, .net, etc.)
- ✅ No spaces
- ✅ No obvious typos
- ✅ Test format: user@domain.com

### Common Issues:
- **"I don't have email"** → Offer to create one, or use company email
- **"Why do you need it?"** → "For document expiry notifications"
- **Wrong number** → Update phone number too while you're at it
- **No answer** → Leave voicemail, try again later, mark in notes

## 📊 Progress Tracking

Create a simple tracker in your Excel:

```
| Name | Phone | Email Collected? | Date | Notes |
|------|-------|-----------------|------|-------|
| John | +123  | ✅ Yes          | 10/21| Called, confirmed |
| Jane | +456  | ⏳ Pending      | 10/21| Left voicemail |
| Bob  | +789  | ❌ No answer    | 10/21| Try again tmrw |
```

## ⚠️ Safety Tips

1. **Always PREVIEW before UPDATE**
   - Use `SELECT` first to see what will change
   - Then run `UPDATE` only if it looks correct

2. **Work in batches**
   - Start with 5-10 records
   - Verify they updated correctly
   - Then do more

3. **Use transactions**
   ```sql
   BEGIN;
   -- your updates here
   -- check results
   COMMIT; -- or ROLLBACK if wrong
   ```

4. **Keep the Excel file**
   - It's your backup
   - Documents who you contacted
   - Shows your progress

## 🆘 Need Help?

**If stuck on SQL:**
- See: `scripts/bulk-update-promoter-emails.sql` for examples
- See: `URGENT_EMAIL_DATA_MIGRATION_PLAN.md` for detailed guide

**If can't reach promoters:**
- Ask their manager/supervisor
- Check HR records
- Mark as "pending collection" in notes

**If emails are bouncing:**
- Re-contact promoter
- Ask for alternate email
- Update in database

## ✅ Success Criteria

You'll know you're done when:

- [ ] All 112 promoters have valid email addresses
- [ ] No more "—" showing in the promoters table
- [ ] All status values are standardized (active/inactive/terminated)
- [ ] New promoters are required to enter email
- [ ] Email notifications can be enabled

## 🎉 After Completion

Once all emails are collected:

1. ✅ Enable email notifications for:
   - Document expiry warnings
   - Status changes
   - Important announcements

2. ✅ Set up automated reminders:
   - 30 days before document expires
   - 14 days before
   - 7 days before
   - Day of expiry

3. ✅ Add to onboarding process:
   - Email is REQUIRED for all new promoters
   - Validate at time of entry
   - Test email with welcome message

---

## 🚀 Ready to Start?

### Next 3 Actions:
1. [ ] Run Step 1 query above → Export to Excel
2. [ ] Add "EMAIL" column to Excel
3. [ ] Start calling first 10 promoters

**Start Time:** ____________
**Target Completion:** ____________

Good luck! 💪 You've got this!

