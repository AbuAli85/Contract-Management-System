# 📖 How to Access Promoter Details Page - Complete Guide

## 🎯 Overview

This guide explains step-by-step how **Employers** and **Employees** can access and use the promoter details page.

---

## 🏢 **FOR EMPLOYERS**

### **Step 1: Create/Register as Employer**

#### Option A: Self-Registration
1. Go to: `/en/auth/register` or `/en/register-new`
2. Fill in the form:
   - Email
   - Password
   - Full Name
   - **Role: Select "provider" or "employer"**
   - Company Name (if applicable)
   - Phone
3. Click "Register"
4. Check your email and confirm your account

#### Option B: Admin Creates Your Account
An admin can create your employer account using SQL:

```sql
-- Admin runs this in Supabase SQL Editor
UPDATE profiles 
SET 
  role = 'manager',
  user_metadata = '{"role": "employer", "employer_id": "YOUR-EMPLOYER-UUID"}'::jsonb
WHERE email = 'your-email@example.com';
```

### **Step 2: Login**

1. Go to: `/en/auth/login`
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to `/en/dashboard` or `/en/promoters`

### **Step 3: Assign Promoters to Your Company**

Before you can view promoter details, you need to **assign promoters to your employer**.

#### Method 1: Via UI (Team Management)
1. Go to: `/en/employer/team`
2. Click "Add Team Member" or "Invite Employee"
3. Enter employee email (must match promoter email)
4. Fill in details:
   - Full Name
   - Job Title
   - Department
   - Employment Type
5. Click "Add" or "Invite"
6. System automatically:
   - Creates employee account (if doesn't exist)
   - Links promoter to your employer
   - Creates `employer_employees` record

#### Method 2: Via SQL (Admin/Developer)
```sql
-- Link existing promoter to your employer
UPDATE promoters 
SET employer_id = 'YOUR-EMPLOYER-PARTY-UUID'
WHERE id = 'promoter-id';

-- Or create employer_employee relationship
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  party_id,
  promoter_id,
  employment_type,
  employment_status
)
VALUES (
  'YOUR-EMPLOYER-PROFILE-UUID',  -- Your profile ID
  'EMPLOYEE-PROFILE-UUID',        -- Employee's profile ID
  'YOUR-EMPLOYER-PARTY-UUID',    -- Your party/employer UUID
  'PROMOTER-UUID',                -- Promoter ID
  'full_time',
  'active'
);
```

### **Step 4: Access Promoter Details Page**

Once promoters are assigned:

1. **Navigate to Promoters List:**
   - Go to: `/en/promoters` or `/en/manage-promoters`
   - You'll see only promoters assigned to you

2. **Click on a Promoter:**
   - Click any promoter's name or "View Details"
   - URL: `/en/manage-promoters/[promoter-id]`

3. **View Full Details:**
   - Personal information
   - Documents (ID, Passport, Visa)
   - Contracts
   - Financial summary
   - Analytics
   - All management features

### **What Employers Can Do on the Page:**

✅ **View:**
- All promoter information
- Documents and expiry dates
- Contract history
- Financial data
- Analytics and metrics

✅ **Edit:**
- Update promoter details
- Upload documents
- Manage contracts
- Update status

✅ **Manage:**
- Assign to different employer
- Remove employer assignment
- Export data
- Delete (if admin)

---

## 👤 **FOR EMPLOYEES (PROMOTERS)**

### **Step 1: Get Invited by Employer**

Your employer needs to invite you first:

1. **Employer goes to:** `/en/employer/team`
2. **Employer clicks:** "Add Team Member" or "Invite Employee"
3. **Employer enters:** Your email address
4. **System creates:** Your account automatically
5. **You receive:** Email invitation (if configured)

### **Step 2: First Login**

1. **Go to:** `/en/auth/login`
2. **Enter:** Your email address
3. **Password:** 
   - If invited: Check email for temporary password
   - Or: Use password reset if you forgot it
4. **First time:** You may be asked to change password
5. **After login:** Redirected to `/en/dashboard` or `/en/promoters`

### **Step 3: Access Your Profile**

#### Method 1: Via Dashboard
1. **Login** to the system
2. **Go to:** `/en/promoters` or `/en/manage-promoters`
3. **You'll see:** Only your own profile (automatically filtered)
4. **Click:** Your name or "View Details"
5. **URL:** `/en/manage-promoters/[your-promoter-id]`

#### Method 2: Direct URL
1. **Login** to the system
2. **Go directly to:** `/en/manage-promoters/[your-promoter-id]`
3. **Note:** You can only access your own profile

### **Step 4: View Your Details**

You'll see:
- ✅ Your personal information
- ✅ Your documents (ID, Passport, Visa)
- ✅ Document expiry warnings
- ✅ Your contracts
- ✅ Your attendance (if enabled)
- ✅ Your tasks (if assigned)
- ✅ Your targets (if assigned)

### **What Employees Can Do on the Page:**

✅ **View:**
- Own profile information
- Own documents
- Own contracts
- Document expiry dates
- Status alerts

✅ **Edit:**
- Update own profile (if permission granted)
- Upload own documents (if permission granted)

❌ **Cannot:**
- View other promoters
- Edit other promoters
- Delete anything
- Access admin features
- See analytics for others

---

## 🔧 **SETUP CHECKLIST**

### **For Employers:**

- [ ] Account created with role = 'employer' or 'manager'
- [ ] `user_metadata.employer_id` set (or `company_id`)
- [ ] Promoters assigned to your employer (`promoters.employer_id`)
- [ ] `employer_employees` records created
- [ ] Can login successfully
- [ ] Can see promoters list
- [ ] Can access promoter details page

### **For Employees:**

- [ ] Invited by employer (or account created)
- [ ] Profile created in `profiles` table
- [ ] Promoter record exists in `promoters` table
- [ ] Email matches between profile and promoter
- [ ] Linked to employer via `employer_employees` table
- [ ] Can login successfully
- [ ] Can see own profile
- [ ] Can access own promoter details page

---

## 🐛 **TROUBLESHOOTING**

### **Problem: Employer can't see any promoters**

**Solution:**
1. Check if promoters are assigned:
```sql
SELECT p.id, p.name_en, p.employer_id, pt.name_en as employer_name
FROM promoters p
LEFT JOIN parties pt ON pt.id = p.employer_id
WHERE p.employer_id = 'YOUR-EMPLOYER-PARTY-UUID';
```

2. If no results, assign promoters:
```sql
UPDATE promoters 
SET employer_id = 'YOUR-EMPLOYER-PARTY-UUID'
WHERE id IN ('promoter-id-1', 'promoter-id-2');
```

### **Problem: Employee can't see their profile**

**Solution:**
1. Check if profile exists:
```sql
SELECT * FROM profiles WHERE email = 'employee@example.com';
```

2. Check if promoter record exists:
```sql
SELECT * FROM promoters WHERE email = 'employee@example.com';
```

3. Check if linked to employer:
```sql
SELECT * FROM employer_employees 
WHERE employee_id = 'EMPLOYEE-PROFILE-UUID';
```

4. If missing, create the link:
```sql
-- Create employer_employee record
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  promoter_id,
  party_id,
  employment_type,
  employment_status
)
SELECT 
  emp_pr.id as employer_id,
  emp_profile.id as employee_id,
  p.id as promoter_id,
  p.employer_id as party_id,
  'full_time',
  'active'
FROM profiles emp_profile
INNER JOIN promoters p ON LOWER(emp_profile.email) = LOWER(p.email)
INNER JOIN parties pt ON pt.id = p.employer_id
INNER JOIN profiles emp_pr ON LOWER(emp_pr.email) = LOWER(pt.contact_email)
WHERE emp_profile.email = 'employee@example.com';
```

### **Problem: "Permission Denied" error**

**Solution:**
1. Grant permissions via SQL:
```sql
-- Grant promoter:read:own permission
INSERT INTO rbac_user_role_assignments (user_id, role_id, is_active)
SELECT 
  p.id,
  r.id,
  TRUE
FROM profiles p
CROSS JOIN rbac_roles r
WHERE p.email = 'user@example.com'
  AND r.name = 'user'
ON CONFLICT DO NOTHING;
```

2. Or update user metadata:
```sql
UPDATE profiles 
SET user_metadata = '{"role": "promoter"}'::jsonb
WHERE email = 'employee@example.com';
```

---

## 📋 **QUICK REFERENCE**

### **URLs:**
- Login: `/en/auth/login`
- Register: `/en/auth/register`
- Promoters List: `/en/promoters` or `/en/manage-promoters`
- Promoter Details: `/en/manage-promoters/[id]`
- Team Management: `/en/employer/team`

### **Database Tables:**
- `profiles` - User accounts
- `promoters` - Promoter/employee records
- `parties` - Employers (type='Employer')
- `employer_employees` - Links employers to employees
- `companies` - Company information

### **Key Fields:**
- `profiles.role` - User role ('admin', 'manager', 'user')
- `profiles.user_metadata.role` - Metadata role ('employer', 'promoter')
- `profiles.user_metadata.employer_id` - Employer UUID
- `promoters.employer_id` - Links to `parties.id` (employer)
- `employer_employees.employer_id` - Links to `profiles.id` (employer profile)
- `employer_employees.employee_id` - Links to `profiles.id` (employee profile)
- `employer_employees.promoter_id` - Links to `promoters.id`

---

## ✅ **VERIFICATION**

### **Test Employer Access:**
1. Login as employer
2. Go to `/en/promoters`
3. Should see only assigned promoters
4. Click on a promoter
5. Should see full details page
6. Should be able to edit

### **Test Employee Access:**
1. Login as employee
2. Go to `/en/promoters`
3. Should see only own profile
4. Click on own profile
5. Should see own details
6. Should be able to edit own profile (if permission granted)

---

## 🎯 **SUMMARY**

**Employers:**
1. Register/Login → Assign Promoters → View Details
2. Can see all assigned promoters
3. Full management features

**Employees:**
1. Get Invited → Login → View Own Profile
2. Can see only own profile
3. Limited features (view/edit own data)

Both can access the same page, but see different data based on their role and relationships!

