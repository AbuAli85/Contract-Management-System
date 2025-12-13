# 🧪 Team Management System - Complete Testing Guide

**For Admins Testing All Features**

---

## 🎯 **PRE-TESTING SETUP**

### **1. Verify Admin Access:**
- ✅ Login as admin at `/en/auth/login`
- ✅ Verify you're redirected to `/en/dashboard`
- ✅ Check sidebar shows "Team Management" link
- ✅ Verify admin role in profile

### **2. Prepare Test Data:**
- ✅ Have at least 2 test users ready (one will be employer, one will be employee)
- ✅ Or create new test users via `/en/admin/users`

---

## 📋 **TESTING CHECKLIST**

---

## ✅ **TEST 1: Access Team Management Dashboard**

### **Steps:**
1. Login as admin
2. Click "Team Management" in sidebar (or navigate to `/en/employer/team`)
3. Verify page loads

### **Expected Results:**
- ✅ Page loads without errors
- ✅ Statistics cards show (Total, Active, On Leave, Terminated)
- ✅ "Add Team Member" button visible
- ✅ Empty state or existing team members displayed

### **Screenshot Areas:**
- Statistics cards
- Main dashboard layout

---

## ✅ **TEST 2: Add Team Member**

### **Steps:**
1. Click "Add Team Member" button
2. In search field, type email of existing user (e.g., `employee@example.com`)
3. Click "Search"
4. Select user from results
5. Fill in form:
   - Employee Code: `EMP001`
   - Job Title: `Software Engineer`
   - Department: `Engineering`
   - Employment Type: `Full Time`
   - Hire Date: Today's date
   - Salary: `500` (optional)
   - Work Location: `Office` (optional)
6. Click "Add to Team"

### **Expected Results:**
- ✅ User appears in search results
- ✅ Form accepts all inputs
- ✅ Success message: "Team member added successfully"
- ✅ New member appears in team list
- ✅ Member shows as "active" status

### **Verify:**
- ✅ Team member card shows correct information
- ✅ Statistics update (Total count increases)
- ✅ Member is clickable/selectable

---

## ✅ **TEST 3: View Team Member Details**

### **Steps:**
1. Click on a team member card
2. Verify "Details" tab opens automatically

### **Expected Results:**
- ✅ Details tab shows:
  - Employee name and email
  - Employee code
  - Job title
  - Department
  - Employment status badge
- ✅ All information matches what was entered

---

## ✅ **TEST 4: Assign Permissions to Employee**

### **Steps:**
1. Select a team member
2. Click "Permissions" tab
3. Search for permissions (e.g., type "attendance")
4. Select permissions:
   - `attendance:view:own`
   - `attendance:record:own`
   - `tasks:view:own`
   - `tasks:update:own`
   - `targets:view:own`
   - `targets:update:own`
5. Click "Save Permissions"

### **Expected Results:**
- ✅ Permission library loads
- ✅ Search filters permissions correctly
- ✅ Checkboxes work (select/deselect)
- ✅ Success message: "Permissions assigned successfully"
- ✅ Selected permissions are saved

### **Verify:**
- ✅ Refresh page - permissions still selected
- ✅ Employee can now access those features

---

## ✅ **TEST 5: Record Attendance**

### **Steps:**
1. Select a team member
2. Click "Attendance" tab
3. Verify attendance summary shows:
   - Total Days
   - Present count
   - Absent count
   - Total Hours
4. Click month selector, select current month
5. Verify attendance records display (if any)

### **Test Recording Attendance:**
1. As Admin: You can manually record attendance
2. As Employee: Login as that employee and check in/out

### **Expected Results:**
- ✅ Summary statistics display correctly
- ✅ Monthly view works
- ✅ Attendance records show dates, times, status
- ✅ Status badges color-coded (present=green, absent=red)

### **Manual Attendance Recording (Admin):**
- Can record attendance via API or future UI button
- Records show check-in/check-out times
- Hours calculated automatically

---

## ✅ **TEST 6: Create and Manage Tasks**

### **Steps:**
1. Select a team member
2. Click "Tasks" tab
3. Click "Add Task" button (if available) or verify task list
4. Create a task:
   - Title: `Complete project documentation`
   - Description: `Write comprehensive documentation for the new feature`
   - Priority: `High`
   - Due Date: `Tomorrow's date`
   - Estimated Hours: `8`
5. Submit task

### **Expected Results:**
- ✅ Task created successfully
- ✅ Task appears in list
- ✅ Task shows correct priority badge
- ✅ Task shows correct status (pending)
- ✅ Due date displays correctly

### **Test Task Updates:**
1. Login as the employee
2. Navigate to tasks
3. Update task status to "in_progress"
4. Verify status updates

### **Verify:**
- ✅ Tasks list updates in real-time
- ✅ Status changes reflect immediately
- ✅ Priority colors work (urgent=red, high=orange, etc.)

---

## ✅ **TEST 7: Create and Track Targets**

### **Steps:**
1. Select a team member
2. Click "Targets" tab
3. Click "Add Target" button (if available)
4. Create a target:
   - Title: `Complete 50 tasks this month`
   - Description: `Achieve monthly task completion goal`
   - Target Type: `Performance`
   - Target Value: `50`
   - Unit: `tasks`
   - Period Type: `Monthly`
   - Start Date: `First day of current month`
   - End Date: `Last day of current month`
5. Submit target

### **Expected Results:**
- ✅ Target created successfully
- ✅ Target appears in list
- ✅ Progress bar shows 0% (no progress yet)
- ✅ Target shows as "active" status
- ✅ Dates display correctly

### **Test Progress Updates:**
1. Update current value to `25`
2. Verify progress percentage updates to 50%
3. Progress bar updates visually

### **Verify:**
- ✅ Progress calculation: `(current_value / target_value) * 100`
- ✅ Progress bar fills correctly
- ✅ Status changes when target completed

---

## ✅ **TEST 8: Update Team Member Information**

### **Steps:**
1. Select a team member
2. Click "Details" tab
3. Verify all information displays
4. (Future: Edit button to update information)

### **Expected Results:**
- ✅ All fields display correctly
- ✅ Status badge shows correct color
- ✅ Information matches database

---

## ✅ **TEST 9: Remove Team Member**

### **Steps:**
1. Select a team member
2. (Future: Click "Remove" or "Terminate" button)
3. Confirm removal

### **Expected Results:**
- ✅ Member status changes to "terminated"
- ✅ Termination date set
- ✅ Member removed from active list
- ✅ Statistics update (Terminated count increases)

---

## ✅ **TEST 10: Employee Self-Service (Login as Employee)**

### **Setup:**
1. Login as the employee you added to team
2. Navigate to `/en/employee/dashboard` or `/en/dashboard`

### **Test Employee Dashboard:**
1. Verify "My Dashboard" page loads
2. Check employment information displays:
   - Employer name
   - Job title
   - Department
3. Verify tabs available:
   - Attendance
   - Tasks
   - Targets

### **Test Attendance (Employee):**
1. Click "Attendance" tab
2. Verify can view own attendance records
3. (If permission granted) Test check-in:
   - Click "Check In" button
   - Verify time recorded
   - Verify status changes to "present"

### **Test Tasks (Employee):**
1. Click "Tasks" tab
2. Verify can see assigned tasks
3. Update task status:
   - Click on a task
   - Change status from "pending" to "in_progress"
   - Verify update saves

### **Test Targets (Employee):**
1. Click "Targets" tab
2. Verify can see assigned targets
3. Update progress:
   - Update current value
   - Verify progress percentage updates
   - Verify progress bar updates

### **Expected Results:**
- ✅ Employee sees only own data
- ✅ Can update own records (if permissions granted)
- ✅ Cannot see other employees' data
- ✅ Cannot create tasks/targets for others

---

## ✅ **TEST 11: Permission-Based Access**

### **Test Without Permissions:**
1. Remove all permissions from an employee
2. Login as that employee
3. Try to access:
   - Attendance tab
   - Tasks tab
   - Targets tab

### **Expected Results:**
- ✅ Employee cannot access features without permissions
- ✅ Appropriate error/restriction message
- ✅ Features hidden or disabled

### **Test With Permissions:**
1. Assign permissions to employee
2. Login as employee
3. Verify can access granted features

### **Expected Results:**
- ✅ Employee can access features with permissions
- ✅ Only granted permissions work
- ✅ Denied permissions still blocked

---

## ✅ **TEST 12: Search and Filter**

### **Test Team Member Search:**
1. In team management dashboard
2. Type in search box (name, email, employee code)
3. Verify results filter in real-time

### **Expected Results:**
- ✅ Search works instantly
- ✅ Filters by name, email, or code
- ✅ Case-insensitive search
- ✅ Results update as you type

### **Test Attendance Filters:**
1. Select team member → Attendance tab
2. Change month selector
3. Verify records filter by month

### **Expected Results:**
- ✅ Month selector works
- ✅ Only records for selected month show
- ✅ Summary updates for selected period

---

## ✅ **TEST 13: Statistics and Analytics**

### **Test Team Statistics:**
1. Add multiple team members with different statuses
2. Verify statistics cards update:
   - Total count
   - Active count
   - On Leave count
   - Terminated count

### **Expected Results:**
- ✅ All counts accurate
- ✅ Updates in real-time
- ✅ Matches actual data

### **Test Attendance Summary:**
1. Record multiple attendance entries
2. Verify summary calculates:
   - Total days
   - Present days
   - Absent days
   - Total hours
   - Overtime hours

### **Expected Results:**
- ✅ All calculations correct
- ✅ Summary matches individual records
- ✅ Updates when new records added

---

## ✅ **TEST 14: API Endpoints (Direct Testing)**

### **Test Team Management API:**
```bash
# Get team members
GET /api/employer/team
Expected: 200 OK, returns team list

# Add team member
POST /api/employer/team
Body: { employee_id, job_title, department, ... }
Expected: 200 OK, returns created member

# Update team member
PUT /api/employer/team/[id]
Body: { job_title: "Senior Engineer" }
Expected: 200 OK, returns updated member

# Remove team member
DELETE /api/employer/team/[id]
Expected: 200 OK, member status = terminated
```

### **Test Permissions API:**
```bash
# Get permissions
GET /api/employer/team/[id]/permissions
Expected: 200 OK, returns permissions list

# Assign permissions
POST /api/employer/team/[id]/permissions
Body: { permissions: ["attendance:view:own", ...] }
Expected: 200 OK, permissions assigned
```

### **Test Attendance API:**
```bash
# Get attendance
GET /api/employer/team/[id]/attendance?month=2025-01
Expected: 200 OK, returns attendance records + summary

# Record attendance
POST /api/employer/team/[id]/attendance
Body: { attendance_date, check_in, check_out, status }
Expected: 200 OK, attendance recorded
```

### **Test Tasks API:**
```bash
# Get tasks
GET /api/employer/team/[id]/tasks
Expected: 200 OK, returns tasks list

# Create task
POST /api/employer/team/[id]/tasks
Body: { title, description, priority, due_date }
Expected: 200 OK, task created
```

### **Test Targets API:**
```bash
# Get targets
GET /api/employer/team/[id]/targets?period=current
Expected: 200 OK, returns targets list

# Create target
POST /api/employer/team/[id]/targets
Body: { title, target_value, start_date, end_date }
Expected: 200 OK, target created
```

---

## ✅ **TEST 15: Error Handling**

### **Test Invalid Data:**
1. Try to add team member with invalid email
2. Try to create task without title
3. Try to create target without dates

### **Expected Results:**
- ✅ Validation errors display
- ✅ Forms don't submit invalid data
- ✅ Error messages are clear

### **Test Unauthorized Access:**
1. Try to access team management as non-employer
2. Try to access other employer's team

### **Expected Results:**
- ✅ Access denied (403 error)
- ✅ Redirect to unauthorized page
- ✅ Appropriate error message

---

## ✅ **TEST 16: Real-Time Updates**

### **Test:**
1. Open team management in two browser windows (admin view)
2. Add a team member in one window
3. Verify other window updates (or refresh shows new member)

### **Expected Results:**
- ✅ Data syncs across views
- ✅ Statistics update
- ✅ No stale data

---

## ✅ **TEST 17: Mobile Responsiveness**

### **Test:**
1. Open team management on mobile device or resize browser
2. Verify:
   - Statistics cards stack properly
   - Tables/cards are scrollable
   - Forms are usable
   - Buttons are tappable

### **Expected Results:**
- ✅ Layout adapts to mobile
- ✅ All features accessible
- ✅ Touch-friendly interface

---

## 📊 **TESTING RESULTS TEMPLATE**

### **Test Results:**

| Test # | Feature | Status | Notes |
|--------|---------|--------|-------|
| 1 | Access Dashboard | ⬜ | |
| 2 | Add Team Member | ⬜ | |
| 3 | View Details | ⬜ | |
| 4 | Assign Permissions | ⬜ | |
| 5 | Record Attendance | ⬜ | |
| 6 | Create Tasks | ⬜ | |
| 7 | Create Targets | ⬜ | |
| 8 | Update Info | ⬜ | |
| 9 | Remove Member | ⬜ | |
| 10 | Employee Dashboard | ⬜ | |
| 11 | Permission Access | ⬜ | |
| 12 | Search/Filter | ⬜ | |
| 13 | Statistics | ⬜ | |
| 14 | API Endpoints | ⬜ | |
| 15 | Error Handling | ⬜ | |
| 16 | Real-Time Updates | ⬜ | |
| 17 | Mobile Responsive | ⬜ | |

---

## 🚀 **QUICK TEST SCENARIO**

### **Complete Workflow Test (15 minutes):**

1. **Setup (2 min):**
   - Login as admin
   - Navigate to Team Management

2. **Add Employee (3 min):**
   - Search for user
   - Add to team with details
   - Verify appears in list

3. **Assign Permissions (2 min):**
   - Select employee
   - Go to Permissions tab
   - Assign 3-4 permissions
   - Save

4. **Create Task (2 min):**
   - Go to Tasks tab
   - Create a task
   - Verify appears

5. **Create Target (2 min):**
   - Go to Targets tab
   - Create a target
   - Verify appears

6. **Test Employee View (4 min):**
   - Login as employee
   - Verify can see own data
   - Test updating task status
   - Test updating target progress

---

## 🐛 **COMMON ISSUES & SOLUTIONS**

### **Issue: "Team member not found"**
- **Solution:** Verify user exists in `profiles` table
- **Check:** User email is correct

### **Issue: "Insufficient permissions"**
- **Solution:** Verify admin role in profile
- **Check:** `profiles.role = 'admin'`

### **Issue: "Cannot add team member"**
- **Solution:** Check if user already in team
- **Check:** Verify `employer_employees` table exists

### **Issue: "Attendance not recording"**
- **Solution:** Verify date format (YYYY-MM-DD)
- **Check:** Check-in time is valid

### **Issue: "Tasks not appearing"**
- **Solution:** Verify `employer_employee_id` is correct
- **Check:** Employee is active in team

---

## ✅ **VERIFICATION CHECKLIST**

### **Before Marking as Complete:**
- [ ] All 17 tests passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All API endpoints return 200 OK
- [ ] Permissions work correctly
- [ ] Employee can access granted features
- [ ] Employee cannot access denied features
- [ ] Statistics calculate correctly
- [ ] Mobile responsive
- [ ] Error handling works

---

## 📝 **TESTING NOTES**

**Date:** _______________  
**Tester:** _______________  
**Environment:** Production / Staging / Local

**Issues Found:**
1. 
2. 
3. 

**Recommendations:**
1. 
2. 
3. 

---

**Status:** Ready for Testing ✅

