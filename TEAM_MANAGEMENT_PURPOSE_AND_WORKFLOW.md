# 📋 Team Management Page - Purpose & How It Works

**Last Updated:** January 2025  
**Status:** ✅ Production Ready

---

## 🎯 **PURPOSE**

The **Team Management** page is a comprehensive HR management system that allows **employers** to:

1. **Build and manage their workforce** - Add employees/promoters to their team
2. **Control access and permissions** - Assign specific permissions to each team member
3. **Track attendance** - Monitor employee check-ins, check-outs, and work hours
4. **Manage tasks** - Assign, track, and monitor tasks for team members
5. **Set and track targets** - Define goals and monitor employee performance
6. **Organize team structure** - Define departments, job titles, and reporting relationships

---

## 🏢 **MULTI-EMPLOYER STRUCTURE**

### **How the System Works with Multiple Employers:**

The system supports **multiple employers**, each managing **their own separate teams**:

```
┌─────────────────────────────────────────────────────────┐
│                    SYSTEM OVERVIEW                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📋 PROMOTERS TABLE (Master List)                       │
│  ───────────────────────────────────                    │
│  • All employees/promoters in the system                │
│  • Shared across all employers                          │
│  • Example: 100 promoters total                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  EMPLOYER A  │  │  EMPLOYER B  │  │  EMPLOYER C  │ │
│  │  (Company 1) │  │  (Company 2) │  │  (Company 3) │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤ │
│  │ Team: 15     │  │ Team: 8      │  │ Team: 12     │ │
│  │ employees    │  │ employees    │  │ employees    │ │
│  │              │  │              │  │              │ │
│  │ • Employee 1 │  │ • Employee 1 │  │ • Employee 1 │ │
│  │ • Employee 2 │  │ • Employee 2 │  │ • Employee 2 │ │
│  │ • Employee 3 │  │ • Employee 3 │  │ • Employee 3 │ │
│  │ ...          │  │ ...          │  │ ...          │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  Each employer ONLY sees and manages THEIR team         │
│  Data is completely isolated per employer                │
└─────────────────────────────────────────────────────────┘
```

### **Key Points:**

1. **Data Isolation:**
   - Each employer **ONLY** sees their own team members
   - Employer A cannot see Employer B's team
   - Each employer's data is completely separate

2. **Employee Assignment:**
   - An employee can **only belong to ONE employer at a time**
   - If Employee X is in Employer A's team, they cannot be in Employer B's team
   - If terminated, they can be reassigned to a different employer

3. **How It Works:**
   - All employees are in the `promoters` table (master list)
   - When Employer A adds Employee X to their team, a record is created in `employer_employees`:
     ```sql
     employer_id = 'employer-a-uuid'
     employee_id = 'employee-x-uuid'
     ```
   - When Employer A views their team, the system filters:
     ```sql
     SELECT * FROM employer_employees 
     WHERE employer_id = 'employer-a-uuid'
     ```
   - Employer A **only** sees employees where `employer_id = their-id`

4. **Example Scenario:**
   ```
   System has 100 promoters total
   
   Employer A (Falcon Eye Group):
   - Sees all 100 promoters when adding to team
   - Has 15 employees in their team
   - Only sees these 15 in their Team Management page
   
   Employer B (Techxoman):
   - Sees all 100 promoters when adding to team
   - Has 8 employees in their team
   - Only sees these 8 in their Team Management page
   
   Employer C (SmartPro):
   - Sees all 100 promoters when adding to team
   - Has 12 employees in their team
   - Only sees these 12 in their Team Management page
   ```

---

## ❓ **WHY ADD SOMEONE TO YOUR TEAM? (The Purpose)**

### **What Happens When You Add an Employee to Your Team:**

When you add an employee to your team, you're establishing a **formal employment relationship** that enables:

#### **1. Management & Control** ✅
- **You can manage this employee** - Update their job title, department, salary
- **You can track their employment** - Hire date, status, termination
- **You can organize your workforce** - Group by department, role, etc.

#### **2. Permission Assignment** ✅
- **Assign specific permissions** - Control what this employee can access
- **Granular access control** - Can view contracts? Can create contracts? Can edit?
- **Role-based access** - Different permissions for different employees

#### **3. Attendance Tracking** ✅
- **Track their attendance** - See check-in/check-out times
- **Monitor work hours** - Calculate total hours worked
- **View attendance history** - See patterns and trends
- **Without team assignment:** You cannot track their attendance

#### **4. Task Management** ✅
- **Assign tasks to them** - Create and assign specific tasks
- **Track task progress** - See what they're working on
- **Monitor completion** - Know when tasks are done
- **Set priorities** - Urgent, high, medium, low priority tasks
- **Without team assignment:** You cannot assign tasks to them

#### **5. Performance Targets** ✅
- **Set performance goals** - "Achieve 50 contracts this month"
- **Track progress** - Monitor how they're doing
- **Measure achievement** - See if targets are met
- **Without team assignment:** You cannot set targets for them

#### **6. Reporting & Analytics** ✅
- **Team statistics** - See your team's performance
- **Individual reports** - Performance per employee
- **Attendance summaries** - Monthly/weekly attendance reports
- **Task completion rates** - How many tasks completed
- **Target achievement** - Who met their goals

#### **7. Employee Access** ✅
- **Employee sees their employer** - They know who they work for
- **Employee dashboard** - They can see their tasks, attendance, targets
- **Clear relationship** - Formal employer-employee link

### **What You CANNOT Do Without Team Assignment:**

❌ **Cannot track attendance** - No attendance records  
❌ **Cannot assign tasks** - No task management  
❌ **Cannot set targets** - No performance goals  
❌ **Cannot assign permissions** - No access control  
❌ **Cannot manage employment** - No job details, salary, etc.  
❌ **Cannot see in your team list** - They don't appear in Team Management  

### **Real-World Example:**

**Scenario:** You're Employer A (Falcon Eye Group)

**Without Team Assignment:**
- You can see Employee X in the Promoters list
- You can view their basic information
- **BUT** you cannot:
  - Track when they come to work
  - Give them tasks to complete
  - Set sales targets for them
  - Control what they can access in the system

**With Team Assignment:**
- Employee X is added to your team
- **NOW** you can:
  - ✅ Track their daily attendance
  - ✅ Assign them tasks ("Review 10 contracts today")
  - ✅ Set targets ("Sell 20 contracts this month")
  - ✅ Control permissions ("Can view contracts but not create")
  - ✅ See them in your team dashboard
  - ✅ Manage their employment details

**In Summary:** Adding someone to your team creates a **formal employment relationship** that unlocks all management features for that employee.

---

## 👥 **WHO USES IT?**

### **Primary Users:**
- **Employers** - Business owners, managers, HR administrators
- **Admins** - System administrators with full access
- **Managers** - Team managers with delegated permissions

### **Secondary Users:**
- **Employees** - Can view their own tasks, attendance, and targets (read-only access)

---

## 🔄 **HOW IT WORKS - STEP BY STEP**

### **1. Accessing Team Management**

```
Navigation: Sidebar → "Team Management" (visible to employers, managers, admins)
URL: /employer/team
```

**Requirements:**
- User must be logged in
- User must have `employer`, `manager`, or `admin` role
- Or user must have `employer_id` or `company_id` in metadata

---

### **2. Main Dashboard View**

When you open Team Management, you see:

#### **📊 Statistics Cards:**
- **Total Team** - Total number of team members
- **Active** - Currently active employees
- **On Leave** - Employees on leave
- **Terminated** - Former employees

#### **🔍 Search & Filter:**
- Search bar to find team members by name or email
- Filter by status (active, terminated, on leave)

#### **📑 Tabbed Interface:**
- **Team** - View and manage team members
- **Attendance** - Track attendance records
- **Tasks** - Manage employee tasks
- **Targets** - Set and track goals
- **Permissions** - Manage employee permissions

---

### **3. Adding a Team Member**

#### **Step 1: Click "Add Team Member"**
- Button located at top right of the Team tab
- Opens a modal dialog

#### **Step 2: Select Employee**
- **Search** for employee by name or email
- **Browse** through available employees/promoters
- Employees already in your team are marked with "In Team" badge
- Click on an employee to select them

#### **Step 3: Fill Employment Details**
After selecting an employee, fill in:
- **Employee Code** - Unique identifier (e.g., EMP001)
- **Job Title** - Position title (e.g., Software Engineer)
- **Department** - Department name (e.g., Engineering)
- **Employment Type** - Full Time, Part Time, Contract, Intern, Consultant
- **Hire Date** - Date of employment
- **Salary** - Compensation amount
- **Work Location** - Office, Remote, Hybrid, etc.
- **Notes** - Additional information

#### **Step 4: Submit**
- Click "Add to Team"
- Employee is added to your team
- They appear in your team list immediately

---

### **4. Managing Team Members**

#### **View Team Members:**
- List shows all team members with:
  - Name and email
  - Job title and department
  - Employment status
  - Hire date
  - Actions menu (edit, remove, view details)

#### **Update Team Member:**
- Click on team member or use actions menu
- Update employment details
- Change status (active, on leave, terminated)
- Update salary, department, etc.

#### **Remove Team Member:**
- Use "Remove" action
- Sets status to "terminated"
- Employee removed from active team but record kept

---

### **5. Attendance Tracking**

#### **View Attendance:**
- Switch to "Attendance" tab
- See attendance records for all team members
- Filter by date range
- View check-in/check-out times
- See total hours worked

#### **Record Attendance:**
- Employees can check in/out (via employee dashboard)
- Employers can manually record attendance
- System calculates total hours automatically

---

### **6. Task Management**

#### **Create Task:**
- Switch to "Tasks" tab
- Click "Create Task"
- Select employee
- Enter task details:
  - Title and description
  - Priority (Low, Medium, High, Urgent)
  - Due date
  - Status (Pending, In Progress, Completed, Blocked)

#### **Track Tasks:**
- View all tasks assigned to team members
- Filter by status, priority, employee
- See task progress and updates
- Add comments to tasks

---

### **7. Target Management**

#### **Set Targets:**
- Switch to "Targets" tab
- Click "Create Target"
- Select employee
- Define target:
  - Name and description
  - Target value (e.g., 100 contracts)
  - Unit (contracts, sales, hours, etc.)
  - Start and end date

#### **Track Progress:**
- View current progress vs. target
- See percentage completion
- Monitor achievement status
- Update progress manually or automatically

---

### **8. Permission Management**

#### **Assign Permissions:**
- Switch to "Permissions" tab
- Select team member
- Toggle permissions on/off:
  - View contracts
  - Create contracts
  - Edit contracts
  - Delete contracts
  - View reports
  - Manage team (for managers)
  - And more...

#### **Permission Levels:**
- **Full Access** - All permissions
- **Limited Access** - Selected permissions only
- **Read Only** - View only, no modifications

---

## 🗄️ **DATA FLOW**

### **Database Tables Used:**

1. **`promoters`** - Source of all employees/promoters
   - Contains employee information (name, email, contact, etc.)
   - Same data shown in Promoters page

2. **`employer_employees`** - Team membership
   - Links employer to employee
   - Stores employment details (job title, department, salary, etc.)
   - Tracks employment status

3. **`employee_permissions`** - Custom permissions
   - Stores permission assignments per employee
   - Granular access control

4. **`employee_attendance`** - Attendance records
   - Check-in/check-out times
   - Work hours calculation

5. **`employee_tasks`** - Task assignments
   - Task details, status, priority
   - Due dates and completion tracking

6. **`employee_targets`** - Performance targets
   - Target values and progress
   - Achievement tracking

---

## 🔐 **SECURITY & PERMISSIONS**

### **Access Control:**
- **RBAC (Role-Based Access Control)** - All API endpoints protected
- **RLS (Row Level Security)** - Database-level security
- **Permission Checks** - Verify user can manage team before allowing actions

### **Who Can Do What:**

| Action | Employer | Manager | Admin | Employee |
|--------|----------|---------|-------|----------|
| View Team | ✅ | ✅ | ✅ | ❌ |
| Add Team Member | ✅ | ✅ | ✅ | ❌ |
| Edit Team Member | ✅ | ✅ | ✅ | ❌ |
| Remove Team Member | ✅ | ✅ | ✅ | ❌ |
| View Own Tasks | ❌ | ❌ | ❌ | ✅ |
| View Own Attendance | ❌ | ❌ | ❌ | ✅ |
| View Own Targets | ❌ | ❌ | ❌ | ✅ |

---

## 📱 **USER INTERFACE**

### **Main Components:**

1. **TeamManagementDashboard** - Main container
   - Statistics cards
   - Tab navigation
   - Search and filters

2. **TeamMemberList** - Team member listing
   - Table/card view
   - Actions menu
   - Status badges

3. **AddTeamMemberDialog** - Add member modal
   - Employee selection
   - Employment form
   - Validation

4. **AttendanceView** - Attendance interface
   - Calendar view
   - Records table
   - Summary statistics

5. **TasksView** - Task management
   - Task list
   - Create/edit forms
   - Status tracking

6. **TargetsView** - Target management
   - Target list
   - Progress bars
   - Achievement tracking

7. **PermissionsManager** - Permission assignment
   - Permission toggles
   - Role templates
   - Bulk assignment

---

## 🔄 **TYPICAL WORKFLOWS**

### **Workflow 1: Onboarding New Employee**

```
1. Employer opens Team Management
2. Clicks "Add Team Member"
3. Searches for employee by name/email
4. Selects employee from list
5. Fills in employment details:
   - Employee Code: EMP001
   - Job Title: Sales Promoter
   - Department: Sales
   - Employment Type: Full Time
   - Hire Date: 2025-01-30
   - Salary: 500 OMR
6. Clicks "Add to Team"
7. Employee is added and appears in team list
8. Employer assigns permissions (optional)
9. Employee can now access their dashboard
```

### **Workflow 2: Daily Attendance Tracking**

```
1. Employee logs in
2. Opens Employee Dashboard
3. Clicks "Check In" (records time)
4. Works throughout the day
5. Clicks "Check Out" (records time)
6. System calculates total hours
7. Employer views attendance in Team Management
8. Sees check-in/check-out times and hours worked
```

### **Workflow 3: Task Assignment**

```
1. Employer opens Team Management
2. Switches to "Tasks" tab
3. Clicks "Create Task"
4. Selects employee
5. Enters task details:
   - Title: "Complete contract review"
   - Description: "Review all pending contracts"
   - Priority: High
   - Due Date: 2025-02-05
6. Clicks "Assign Task"
7. Employee receives notification (if enabled)
8. Employee sees task in their dashboard
9. Employee updates task status as they work
10. Employer monitors progress in Tasks tab
```

### **Workflow 4: Setting Performance Targets**

```
1. Employer opens Team Management
2. Switches to "Targets" tab
3. Clicks "Create Target"
4. Selects employee
5. Defines target:
   - Name: "Monthly Sales Target"
   - Description: "Achieve 50 contracts this month"
   - Target Value: 50
   - Unit: Contracts
   - Start Date: 2025-02-01
   - End Date: 2025-02-28
6. Clicks "Set Target"
7. Employee sees target in their dashboard
8. Progress updates automatically or manually
9. Employer monitors progress in Targets tab
```

---

## 🎯 **KEY FEATURES**

### **✅ Implemented Features:**

1. **Team Management**
   - ✅ Add/remove team members
   - ✅ Update employment details
   - ✅ Track employment status
   - ✅ Search and filter team members

2. **Permission Management**
   - ✅ Granular permission assignment
   - ✅ Role-based templates
   - ✅ Custom permissions per employee

3. **Attendance Tracking**
   - ✅ Check-in/check-out recording
   - ✅ Hours calculation
   - ✅ Attendance history
   - ✅ Summary statistics

4. **Task Management**
   - ✅ Create and assign tasks
   - ✅ Task status tracking
   - ✅ Priority management
   - ✅ Due date tracking
   - ✅ Task comments

5. **Target Management**
   - ✅ Set performance targets
   - ✅ Progress tracking
   - ✅ Achievement monitoring
   - ✅ Progress visualization

---

## 📊 **DATA SOURCES & ISOLATION**

### **Employee Data:**
- **Source:** `promoters` table
- **Same as:** Promoters Management page
- **Fields:** Name, email, contact, documents, etc.
- **Shared:** All employers see the same master list when adding employees

### **Team Membership:**
- **Source:** `employer_employees` table
- **Links:** Employer ↔ Employee
- **Stores:** Employment details, status, dates
- **Isolated:** Each employer only sees their own records

### **How Data Isolation Works:**

```sql
-- When Employer A views their team:
SELECT * FROM employer_employees 
WHERE employer_id = 'employer-a-uuid'
-- Returns ONLY Employer A's employees

-- When Employer B views their team:
SELECT * FROM employer_employees 
WHERE employer_id = 'employer-b-uuid'
-- Returns ONLY Employer B's employees

-- Each employer's query is automatically filtered by their employer_id
```

### **Why Two Tables?**
- **`promoters`** = All employees in the system (master list, shared)
- **`employer_employees`** = Team assignments (who works for whom, isolated per employer)

### **Data Flow Example:**

```
1. System has 100 promoters in `promoters` table

2. Employer A adds 15 employees:
   - Creates 15 records in `employer_employees`
   - Each record has: employer_id = 'employer-a-uuid'
   - Employer A now has 15 team members

3. Employer B adds 8 employees:
   - Creates 8 records in `employer_employees`
   - Each record has: employer_id = 'employer-b-uuid'
   - Employer B now has 8 team members

4. When Employer A views Team Management:
   - Query filters: WHERE employer_id = 'employer-a-uuid'
   - Sees ONLY their 15 employees
   - Cannot see Employer B's 8 employees

5. When Employer B views Team Management:
   - Query filters: WHERE employer_id = 'employer-b-uuid'
   - Sees ONLY their 8 employees
   - Cannot see Employer A's 15 employees
```

---

## 🚀 **QUICK START GUIDE**

### **For Employers:**

1. **Navigate to Team Management**
   - Click "Team Management" in sidebar
   - Or go to `/employer/team`

2. **Add Your First Team Member**
   - Click "+ Add Team Member"
   - Search for employee
   - Fill in details
   - Submit

3. **Explore Features**
   - Switch between tabs (Team, Attendance, Tasks, Targets, Permissions)
   - Familiarize yourself with each section

4. **Set Up Permissions**
   - Go to Permissions tab
   - Select team member
   - Assign appropriate permissions

5. **Start Tracking**
   - Create tasks for team members
   - Set performance targets
   - Monitor attendance

---

## ❓ **FREQUENTLY ASKED QUESTIONS**

### **Q: Can an employee belong to multiple employers?**
A: No, an employee can only be assigned to **one employer at a time**. This ensures clear ownership and prevents conflicts. If an employee is terminated from one employer, they can then be assigned to a different employer.

### **Q: Can I see other employers' teams?**
A: **No, absolutely not.** Each employer can **only** see and manage their own team. The system automatically filters all data by your `employer_id`, so you never see other employers' employees, tasks, attendance, or targets.

### **Q: What if I want to hire someone who's already in another employer's team?**
A: The employee must first be **terminated** from their current employer. Once their status is "terminated", they can be added to your team. The system prevents adding employees who are already active with another employer.

### **Q: Why do I see all promoters when adding to team, but only my team in the main view?**
A: When **adding** to team, you see all promoters (master list) so you can select anyone. Once added, they appear in **your team list** which is filtered to show only YOUR employees. This is by design - you can choose from everyone, but only manage your own team.

### **Q: Where do employees come from?**
A: Employees are fetched from the `promoters` table - the same people shown in the Promoters Management page.

### **Q: Can I remove an employee from my team?**
A: Yes, but they are marked as "terminated" rather than deleted. The record is kept for historical purposes.

### **Q: How do employees see their tasks and targets?**
A: Employees access their own dashboard at `/employee/dashboard` where they can view their tasks, attendance, and targets.

### **Q: Can I assign the same task to multiple employees?**
A: Currently, each task is assigned to one employee. You can create duplicate tasks for multiple employees.

### **Q: How are permissions different from roles?**
A: Roles are system-wide (admin, employer, employee). Permissions are granular, per-employee access controls (can view contracts, can create contracts, etc.).

---

## 📝 **SUMMARY**

The **Team Management** page is a comprehensive HR management system that allows employers to:

1. ✅ **Build their team** by adding employees/promoters
2. ✅ **Control access** through granular permissions
3. ✅ **Track attendance** and work hours
4. ✅ **Manage tasks** and assignments
5. ✅ **Set targets** and monitor performance
6. ✅ **Organize structure** with departments and job titles

It provides a complete solution for managing your workforce, from onboarding to daily operations to performance tracking.

---

**For Technical Details:** See `EMPLOYER_TEAM_MANAGEMENT_IMPLEMENTATION.md`  
**For Data Sources:** See `TEAM_MANAGEMENT_DATA_SOURCE.md`  
**For Access Guide:** See `EMPLOYER_EMPLOYEE_ACCESS_GUIDE.md`

