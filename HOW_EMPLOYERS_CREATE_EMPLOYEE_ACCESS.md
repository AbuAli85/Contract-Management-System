# 👥 How Employers Create Employee Access - Complete Guide

## 🎯 Overview

This guide explains how **Employers** can create access accounts for their employees to use the Team Management system.

---

## 🚀 **QUICK START: 3 Simple Steps**

1. **Go to Team Management** → `/en/employer/team`
2. **Click "Invite New Employee"** button
3. **Fill form & share credentials** with employee

That's it! The system automatically creates everything needed.

---

## 📋 **DETAILED STEP-BY-STEP GUIDE**

### **Step 1: Access Team Management Page**

1. **Login** as an employer at `/en/auth/login`
2. **Navigate** to Team Management:
   - Click "Team Management" in sidebar, OR
   - Go directly to: `/en/employer/team`
3. You'll see the **Team Management Dashboard**

### **Step 2: Invite New Employee**

#### **Option A: Invite New Employee (Recommended)**

**Use this for employees who don't have an account yet.**

1. **Click** the **"Invite New Employee"** button (green button with user-plus icon)
2. **Fill in the form:**

   **Required Fields:**
   - ✅ **Email** - Employee's email address (must be valid)
   - ✅ **Full Name** - Employee's full name

   **Optional Fields (click "+ Add optional details"):**
   - Phone number
   - Job Title
   - Department
   - Employment Type (Full Time, Part Time, Contract, etc.)

3. **Click** "Create & Invite" button
4. **System automatically:**
   - ✅ Creates user account in authentication system
   - ✅ Creates profile record
   - ✅ Creates promoter record
   - ✅ Links employee to your team
   - ✅ Generates secure temporary password
   - ✅ Sets up all necessary permissions

5. **Share credentials** with employee:
   - System shows login credentials (email + temporary password)
   - You can:
     - **Copy** credentials to clipboard
     - **Share via WhatsApp**
     - **Share via Email**
   - Employee must change password on first login

#### **Option B: Add Existing Employee**

**Use this for employees who already have an account.**

1. **Click** the **"Add Team Member"** button (outline button)
2. **Search** for employee by name or email
3. **Select** employee from the list
4. **Fill in employment details:**
   - Employee Code
   - Job Title
   - Department
   - Employment Type
   - Hire Date
   - Salary (optional)
   - Work Location
   - Notes
5. **Click** "Add to Team"
6. **Done!** Employee is now in your team

---

## 🔐 **WHAT HAPPENS BEHIND THE SCENES**

### **For New Employees (Invite):**

When you invite a new employee, the system:

1. **Creates Authentication Account:**
   ```typescript
   - Email: employee@example.com
   - Password: Auto-generated secure password (12 characters)
   - Role: 'promoter'
   - Status: Email confirmed automatically
   - Must change password: true
   ```

2. **Creates Profile Record:**
   ```sql
   INSERT INTO profiles (
     id, email, full_name, role, phone,
     must_change_password
   )
   VALUES (...)
   ```

3. **Creates Promoter Record:**
   ```sql
   INSERT INTO promoters (
     id, email, name_en, name_ar, phone,
     status, created_by
   )
   VALUES (...)
   ```

4. **Links to Your Team:**
   ```sql
   INSERT INTO employer_employees (
     employer_id,      -- Your profile ID
     employee_id,      -- Employee's profile ID
     job_title,
     department,
     employment_type,
     employment_status: 'active',
     hire_date
   )
   VALUES (...)
   ```

5. **Sets Up Permissions:**
   - Employee gets `promoter:read:own` permission
   - Can view their own profile
   - Can access team features (if granted)

---

## 📧 **SHARING CREDENTIALS WITH EMPLOYEE**

After creating an employee account, you'll see a credentials screen with:

### **Login Information:**
- 📧 **Email:** `employee@example.com`
- 🔑 **Password:** `TempPass123!@#` (auto-generated)
- 🔗 **Login URL:** `https://portal.thesmartpro.io/en/auth/login`

### **Sharing Options:**

#### **1. Copy to Clipboard**
- Click **"Copy"** button
- Paste into secure message/email
- ✅ Best for: Manual sharing

#### **2. Share via WhatsApp**
- Click **"WhatsApp"** button
- Opens WhatsApp with pre-filled message
- ✅ Best for: Quick mobile sharing

#### **3. Share via Email**
- Click **"Email"** button
- Opens email client with pre-filled message
- ✅ Best for: Official documentation

### **Security Best Practices:**

⚠️ **Important:**
- Share credentials through **secure channels only**
- Use **encrypted messaging** or **secure email**
- **Never** share credentials in public channels
- Employee **must change password** on first login
- Consider using **password managers** for sharing

---

## 👤 **EMPLOYEE FIRST LOGIN PROCESS**

Once employee receives credentials:

1. **Go to:** `https://portal.thesmartpro.io/en/auth/login`
2. **Enter:**
   - Email: `employee@example.com`
   - Password: `[temporary password from employer]`
3. **Click** "Login"
4. **System prompts:** "Please set a new password"
5. **Enter new password** (must be different from temporary)
6. **Confirm new password**
7. **Click** "Change Password"
8. **Redirected** to dashboard
9. **Can now access:**
   - Own profile (`/en/promoters`)
   - Team features (if permissions granted)
   - Attendance tracking
   - Tasks assigned to them
   - Targets assigned to them

---

## 🔄 **WORKFLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────┐
│              EMPLOYER INVITES EMPLOYEE                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  1. Employer fills form (email, name, job details)      │
│  2. Clicks "Create & Invite"                            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  SYSTEM AUTOMATICALLY:                                   │
│  ✅ Creates auth account                                 │
│  ✅ Creates profile                                      │
│  ✅ Creates promoter record                              │
│  ✅ Links to employer's team                             │
│  ✅ Generates temporary password                         │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  EMPLOYER RECEIVES:                                     │
│  📧 Email + 🔑 Temporary Password                        │
│  📋 Copy/Share options                                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  EMPLOYER SHARES CREDENTIALS:                           │
│  📱 Via WhatsApp / Email / Secure Channel                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  EMPLOYEE FIRST LOGIN:                                   │
│  1. Login with temporary password                       │
│  2. System prompts: Change password                     │
│  3. Employee sets new password                          │
│  4. Access granted! ✅                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 **USE CASES**

### **Use Case 1: New Employee Onboarding**

**Scenario:** You just hired a new employee and want to give them system access.

**Steps:**
1. Go to `/en/employer/team`
2. Click "Invite New Employee"
3. Enter:
   - Email: `newemployee@company.com`
   - Full Name: `Ahmed Al-Mansoori`
   - Job Title: `Sales Representative`
   - Department: `Sales`
4. Click "Create & Invite"
5. Copy credentials
6. Share via WhatsApp or Email
7. Employee receives credentials
8. Employee logs in and changes password
9. ✅ Employee now has access!

### **Use Case 2: Adding Existing User to Team**

**Scenario:** Employee already has an account but isn't in your team yet.

**Steps:**
1. Go to `/en/employer/team`
2. Click "Add Team Member"
3. Search for employee by email or name
4. Select employee from list
5. Fill in employment details
6. Click "Add to Team"
7. ✅ Employee is now in your team!

### **Use Case 3: Bulk Employee Onboarding**

**Scenario:** You need to add multiple employees at once.

**Current Solution:**
- Add employees one by one using the invite dialog
- Each employee gets their own credentials
- Share credentials individually

**Future Enhancement:**
- Bulk import via CSV
- Bulk invite via email list
- Automated email notifications

---

## 🔧 **ADVANCED: Manual Setup (Admin/Developer)**

If you need to create employee access manually (for troubleshooting or bulk operations):

### **Step 1: Create Auth Account**

```sql
-- This is done via Supabase Admin API (not SQL)
-- The invite endpoint handles this automatically
```

### **Step 2: Create Profile**

```sql
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  must_change_password,
  created_at,
  updated_at
)
VALUES (
  'employee-uuid-here',
  'employee@example.com',
  'Employee Name',
  'promoter',
  '+968 9123 4567',
  true,
  NOW(),
  NOW()
);
```

### **Step 3: Create Promoter Record**

```sql
INSERT INTO promoters (
  id,
  email,
  name_en,
  name_ar,
  phone,
  status,
  created_by,
  created_at,
  updated_at
)
VALUES (
  'employee-uuid-here',
  'employee@example.com',
  'Employee Name',
  'اسم الموظف',
  '+968 9123 4567',
  'active',
  'employer-uuid-here',
  NOW(),
  NOW()
);
```

### **Step 4: Link to Team**

```sql
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  job_title,
  department,
  employment_type,
  employment_status,
  hire_date,
  created_by,
  company_id
)
VALUES (
  'employer-profile-uuid',
  'employee-profile-uuid',
  'Sales Representative',
  'Sales',
  'full_time',
  'active',
  CURRENT_DATE,
  'employer-profile-uuid',
  'company-uuid'  -- Optional: if using company scope
);
```

### **Step 5: Grant Permissions**

```sql
-- Grant basic permissions
INSERT INTO rbac_user_role_assignments (
  user_id,
  role_id,
  is_active,
  valid_from
)
SELECT 
  'employee-profile-uuid',
  r.id,
  true,
  NOW()
FROM rbac_roles r
WHERE r.name = 'user'
ON CONFLICT DO NOTHING;
```

---

## ✅ **VERIFICATION CHECKLIST**

After creating employee access, verify:

- [ ] Employee can login with credentials
- [ ] Employee sees their profile
- [ ] Employee appears in your team list
- [ ] Employee can access assigned features
- [ ] Permissions are correctly set
- [ ] Employee can change password
- [ ] Employee can view their attendance (if enabled)
- [ ] Employee can view their tasks (if assigned)
- [ ] Employee can view their targets (if assigned)

---

## 🐛 **TROUBLESHOOTING**

### **Problem: "Only employers can invite employees"**

**Solution:**
- Verify your account has role = 'employer', 'manager', or 'admin'
- Check your profile in database:
```sql
SELECT role, user_metadata FROM profiles WHERE email = 'your-email@example.com';
```

### **Problem: "This person is already in your team"**

**Solution:**
- Employee is already linked to your team
- Check existing team members:
```sql
SELECT * FROM employer_employees 
WHERE employer_id = 'your-profile-uuid';
```

### **Problem: Employee can't login**

**Solution:**
1. Verify account was created:
```sql
SELECT * FROM profiles WHERE email = 'employee@example.com';
```

2. Check if email is confirmed:
```sql
-- In Supabase Auth dashboard, check user status
```

3. Reset password if needed:
   - Go to Team Management
   - Click on employee
   - Click "Reset Password"
   - Share new credentials

### **Problem: Employee doesn't see team features**

**Solution:**
1. Check permissions:
```sql
SELECT * FROM employee_permissions 
WHERE employer_employee_id = 'employer-employee-uuid';
```

2. Grant permissions via UI:
   - Go to Team Management
   - Click on employee
   - Go to "Permissions" tab
   - Enable required permissions

---

## 📊 **ACCESS LEVELS**

### **What Employees Can Access:**

After being added to team, employees can:

✅ **View:**
- Own profile
- Own attendance records
- Assigned tasks
- Assigned targets
- Own permissions

✅ **Update:**
- Own profile (if permission granted)
- Task status
- Target progress
- Attendance check-in/out (if enabled)

❌ **Cannot:**
- View other employees
- Create tasks for others
- Manage team members
- Access admin features
- View all promoters

### **Permission-Based Access:**

Access is controlled by permissions assigned by employer:

- `attendance:view:own` - View own attendance
- `attendance:record:own` - Record own attendance
- `tasks:view:own` - View assigned tasks
- `tasks:update:own` - Update own tasks
- `targets:view:own` - View assigned targets
- `targets:update:own` - Update own targets
- `profile:edit:own` - Edit own profile

---

## 🔐 **SECURITY FEATURES**

### **Password Security:**
- ✅ Auto-generated secure passwords (12 characters)
- ✅ Mix of uppercase, lowercase, numbers, special chars
- ✅ Must change password on first login
- ✅ Password strength validation

### **Account Security:**
- ✅ Email confirmation required
- ✅ Role-based access control (RBAC)
- ✅ Company-scoped data access
- ✅ Audit trail (who created account, when)

### **Data Privacy:**
- ✅ Employees only see their own data
- ✅ Employers only see their team members
- ✅ Row-level security (RLS) enforced
- ✅ No cross-company data leakage

---

## 📱 **MOBILE ACCESS**

Employees can access the system from:

- ✅ **Desktop** - Full web browser
- ✅ **Mobile** - Responsive web design
- ✅ **Tablet** - Optimized layout
- ✅ **Any device** - Works on all screen sizes

**Login URL:** `https://portal.thesmartpro.io/en/auth/login`

---

## 🎓 **TRAINING RESOURCES**

### **For Employers:**
- Team Management Dashboard Guide
- How to Assign Permissions
- How to Manage Attendance
- How to Create Tasks & Targets

### **For Employees:**
- How to Login (First Time)
- How to View Your Profile
- How to Record Attendance
- How to Update Tasks
- How to Track Targets

---

## 📞 **SUPPORT**

If you encounter issues:

1. **Check this guide** for troubleshooting
2. **Verify** all steps were followed correctly
3. **Check** database records (if you have access)
4. **Contact** system administrator
5. **Check** error messages in browser console

---

## ✅ **SUMMARY**

**To create employee access:**

1. ✅ Go to `/en/employer/team`
2. ✅ Click "Invite New Employee"
3. ✅ Fill form (email + name required)
4. ✅ Click "Create & Invite"
5. ✅ Share credentials securely
6. ✅ Employee logs in and changes password
7. ✅ ✅ Employee has full access!

**That's it!** The system handles everything automatically. 🎉

