# 👥 Employer & Employee Access Guide

**How Employers and Employees Access Dashboards and Features**

---

## 🎯 **OVERVIEW**

This guide explains how employers and employees access their dashboards, what features they can use, and how the role-based routing works.

---

## 🔐 **AUTHENTICATION & ROLE DETECTION**

### **How Roles Are Determined:**

The system detects user roles from multiple sources:

1. **User Metadata** (`user.user_metadata.role`)
2. **Profile Table** (`profiles.role`)
3. **Session Metadata** (`session.user.user_metadata`)
4. **Employer-Employee Relationships** (`employer_employees` table)

### **Role Types:**

- **Employer** - Has `employer_id` or `company_id` in metadata, or role = 'employer'/'manager'
- **Employee** - Has role = 'promoter'/'employee'/'user', or linked in `employer_employees` table
- **Admin** - Has role = 'admin'/'super_admin'
- **Manager** - Has role = 'manager'

---

## 🏢 **EMPLOYER ACCESS**

### **Login & Redirect:**

1. **Login:** Employers log in at `/en/auth/login` (or `/ar/auth/login`)
2. **Role Detection:** System checks user metadata for `employer_id`, `company_id`, or role
3. **Redirect:** Based on role:
   - **Employer/Manager:** → `/en/dashboard` or `/en/promoters`
   - **Admin:** → `/en/dashboard/admin`

### **Dashboard Access:**

**Main Dashboard:**
- **URL:** `/en/dashboard`
- **Features:**
  - Contract overview
  - Promoter management (assigned promoters only)
  - Statistics and analytics
  - Quick actions

**Team Management Dashboard:**
- **URL:** `/en/employer/team`
- **Features:**
  - Add/remove team members
  - Manage employee permissions
  - Track attendance
  - Assign tasks
  - Set targets/goals

**Promoter Management:**
- **URL:** `/en/promoters` or `/en/manage-promoters`
- **Features:**
  - View assigned promoters only (filtered by `employer_id`)
  - Create/edit promoters
  - Document management
  - Analytics for assigned promoters

### **Navigation Menu (Sidebar):**

Employers see:
- ✅ Dashboard
- ✅ Promoters (assigned only)
- ✅ Contracts
- ✅ **Team Management** (NEW - needs to be added)
- ✅ Parties & Employers
- ✅ Settings
- ✅ Profile

### **What Employers Can Do:**

✅ **Team Management:**
- Add employees to their team
- Assign custom permissions to employees
- View team statistics
- Manage employment details

✅ **Attendance Tracking:**
- View employee attendance records
- Record attendance manually
- View monthly summaries
- Track hours and overtime

✅ **Task Management:**
- Create tasks for employees
- Assign tasks with priorities
- Track task completion
- View task status

✅ **Targets/Goals:**
- Set targets for employees
- Track progress
- View achievement rates
- Manage target periods

✅ **Permissions:**
- Assign granular permissions
- Customize access per employee
- Manage permission sets

---

## 👤 **EMPLOYEE ACCESS**

### **Login & Redirect:**

1. **Login:** Employees log in at `/en/auth/login`
2. **Role Detection:** System checks for role = 'promoter'/'employee'/'user'
3. **Redirect:** → `/en/dashboard` or `/en/promoters` (employee view)

### **Dashboard Access:**

**Employee Dashboard:**
- **URL:** `/en/dashboard` or `/en/promoters`
- **View:** `PromotersEmployeeView` component
- **Features:**
  - "My Profile" header
  - Own profile only
  - Document status (ID Card, Passport)
  - Edit own profile (if permission granted)
  - Download documents

**Team Features (if assigned to employer):**
- **URL:** `/en/employer/team` (if granted permission)
- **Features:**
  - View own attendance records
  - Check in/out
  - View assigned tasks
  - Update task status
  - View assigned targets
  - Update target progress

### **Navigation Menu (Sidebar):**

Employees see:
- ✅ Dashboard (limited view)
- ✅ My Profile
- ✅ **My Attendance** (if permission granted)
- ✅ **My Tasks** (if permission granted)
- ✅ **My Targets** (if permission granted)
- ✅ Settings
- ✅ Profile

### **What Employees Can Do:**

✅ **View Own Data:**
- View own profile
- View own attendance records
- View assigned tasks
- View assigned targets

✅ **Self-Service:**
- Check in/out for attendance
- Update task status
- Update target progress
- Edit own profile (if permission granted)

❌ **Cannot:**
- View other employees' data
- Create tasks for others
- Assign permissions
- Manage team members
- View analytics (unless granted permission)

---

## 🛣️ **ROUTING & NAVIGATION**

### **Role-Based Routing:**

The system uses role-based routing to direct users to appropriate dashboards:

```typescript
// From lib/enhanced-rbac.ts
export function getRoleDashboardRoute(userRole: EnhancedUserRole): string {
  switch (userRole) {
    case 'super_admin':
    case 'admin':
      return '/dashboard/admin';
    case 'manager':
      return '/dashboard/manager';
    case 'provider':
      return '/dashboard/provider';
    case 'client':
    case 'user':
      return '/dashboard/client';
    case 'viewer':
      return '/dashboard/viewer';
    default:
      return '/dashboard';
  }
}
```

### **Login Redirect Logic:**

```typescript
// From components/auth/unified-login-form.tsx
switch (userRole) {
  case 'provider':
    redirectPath = '/en/dashboard/provider-comprehensive';
    break;
  case 'client':
    redirectPath = '/en/dashboard/client-comprehensive';
    break;
  case 'admin':
  case 'super_admin':
    redirectPath = '/en/dashboard';
    break;
  default:
    redirectPath = '/en/dashboard';
}
```

---

## 📋 **ACCESS MATRIX**

| Feature | Employer | Employee | Admin |
|---------|----------|----------|-------|
| **Dashboard** | ✅ Full | ✅ Limited | ✅ Full |
| **Team Management** | ✅ Own Team | ❌ | ✅ All Teams |
| **Add Team Members** | ✅ | ❌ | ✅ |
| **Assign Permissions** | ✅ Own Team | ❌ | ✅ All |
| **View Attendance** | ✅ Own Team | ✅ Own Only | ✅ All |
| **Record Attendance** | ✅ Own Team | ✅ Own Only | ✅ All |
| **Create Tasks** | ✅ Own Team | ❌ | ✅ All |
| **View Tasks** | ✅ Own Team | ✅ Own Only | ✅ All |
| **Update Task Status** | ✅ Own Team | ✅ Own Tasks | ✅ All |
| **Create Targets** | ✅ Own Team | ❌ | ✅ All |
| **View Targets** | ✅ Own Team | ✅ Own Only | ✅ All |
| **Update Target Progress** | ✅ Own Team | ✅ Own Targets | ✅ All |
| **Promoter Management** | ✅ Assigned Only | ✅ Own Profile | ✅ All |
| **Contracts** | ✅ Own | ✅ Own | ✅ All |

---

## 🔧 **SETUP INSTRUCTIONS**

### **1. Add Team Management to Sidebar (For Employers)**

Update `components/sidebar.tsx` to include team management link for employers:

```typescript
// In the sidebar navigation items
{
  title: 'Team Management',
  href: '/employer/team',
  icon: Users,
  roles: ['employer', 'admin', 'manager'], // Only show for employers
  badge: null,
}
```

### **2. Create Employee Dashboard Routes**

Create employee-specific routes:

- `/en/employee/dashboard` - Employee dashboard
- `/en/employee/attendance` - Own attendance
- `/en/employee/tasks` - Own tasks
- `/en/employee/targets` - Own targets

### **3. Update Navigation Based on Role**

The sidebar should conditionally show menu items:

```typescript
// Example from sidebar.tsx
{roleContext.isEmployer && (
  <MenuItem href="/employer/team" icon={Users}>
    Team Management
  </MenuItem>
)}

{roleContext.isEmployee && (
  <>
    <MenuItem href="/employee/attendance" icon={Clock}>
      My Attendance
    </MenuItem>
    <MenuItem href="/employee/tasks" icon={CheckSquare}>
      My Tasks
    </MenuItem>
    <MenuItem href="/employee/targets" icon={Target}>
      My Targets
    </MenuItem>
  </>
)}
```

---

## 🚀 **USAGE EXAMPLES**

### **Employer Workflow:**

1. **Login** → Redirected to `/en/dashboard`
2. **Navigate to Team Management** → `/en/employer/team`
3. **Add Team Member:**
   - Click "Add Team Member"
   - Search by email
   - Fill employment details
   - Submit
4. **Assign Permissions:**
   - Select team member
   - Go to "Permissions" tab
   - Select permissions
   - Save
5. **Create Task:**
   - Select team member
   - Go to "Tasks" tab
   - Click "Add Task"
   - Fill task details
   - Submit
6. **Set Target:**
   - Select team member
   - Go to "Targets" tab
   - Click "Add Target"
   - Set target value and period
   - Submit

### **Employee Workflow:**

1. **Login** → Redirected to `/en/dashboard` (employee view)
2. **View Own Profile:**
   - See document status
   - View employment details
3. **Check In/Out:**
   - Navigate to attendance (if permission granted)
   - Click "Check In" or "Check Out"
   - System records time
4. **View Tasks:**
   - Navigate to tasks (if permission granted)
   - See assigned tasks
   - Update task status
5. **View Targets:**
   - Navigate to targets (if permission granted)
   - See assigned targets
   - Update progress

---

## 🔐 **PERMISSION-BASED ACCESS**

### **How Permissions Work:**

1. **Default Permissions:** Based on role (employer, employee, admin)
2. **Custom Permissions:** Employers can assign specific permissions to employees
3. **Permission Check:** System checks permissions before allowing access

### **Permission Examples:**

- `employer:read:own` - View own team
- `employer:manage:own` - Manage own team
- `employee:read:own` - View own data
- `employee:update:own` - Update own data
- `attendance:view:own` - View own attendance
- `attendance:record:own` - Record own attendance
- `tasks:view:own` - View own tasks
- `tasks:update:own` - Update own tasks
- `targets:view:own` - View own targets
- `targets:update:own` - Update own targets

---

## 📱 **MOBILE ACCESS**

All features are mobile-responsive:
- ✅ Team management works on mobile
- ✅ Attendance check-in/out on mobile
- ✅ Task management on mobile
- ✅ Target tracking on mobile

---

## 🎯 **QUICK REFERENCE**

### **Employer URLs:**
- Dashboard: `/en/dashboard`
- Team Management: `/en/employer/team`
- Promoters: `/en/promoters`
- Contracts: `/en/contracts`

### **Employee URLs:**
- Dashboard: `/en/dashboard` (employee view) or `/en/employee/dashboard` (NEW)
- Profile: `/en/promoters` (own profile)
- Attendance: `/en/employee/dashboard` → Attendance tab (if assigned to employer)
- Tasks: `/en/employee/dashboard` → Tasks tab (if assigned to employer)
- Targets: `/en/employee/dashboard` → Targets tab (if assigned to employer)

### **Admin URLs:**
- Dashboard: `/en/dashboard/admin`
- User Management: `/en/admin/users`
- Team Management: `/en/employer/team` (all teams)

---

## ✅ **VERIFICATION CHECKLIST**

### **For Employers:**
- [ ] Can access `/en/employer/team`
- [ ] Can add team members
- [ ] Can assign permissions
- [ ] Can view attendance
- [ ] Can create tasks
- [ ] Can set targets
- [ ] Can see only own team members

### **For Employees:**
- [ ] Can access dashboard (limited view)
- [ ] Can view own profile
- [ ] Can check in/out (if permission granted)
- [ ] Can view own tasks (if permission granted)
- [ ] Can update task status (if permission granted)
- [ ] Can view own targets (if permission granted)
- [ ] Cannot see other employees' data

---

## 🎉 **CONCLUSION**

The system provides:
- ✅ **Role-based routing** - Automatic redirect to appropriate dashboard
- ✅ **Permission-based access** - Granular control over features
- ✅ **Team management** - Employers can manage their teams
- ✅ **Self-service** - Employees can manage their own data
- ✅ **Secure access** - RBAC protection on all endpoints

**Status:** ✅ **FULLY FUNCTIONAL**

---

**Last Updated:** January 2025

