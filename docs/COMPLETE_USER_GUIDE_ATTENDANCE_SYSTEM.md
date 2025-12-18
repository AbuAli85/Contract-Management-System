# 📘 Complete User Guide: Automated Attendance System

## 🎯 Quick Access Guide

### **How to Access the System**

#### **Step 1: Login**
1. Go to your portal: `https://portal.thesmartpro.io`
2. Login with your **Employer/Manager** credentials
3. You must have `attendance:read:all` and `attendance:create:all` permissions

#### **Step 2: Navigate to HR Management**
1. Look at the **left sidebar**
2. Find the **"HR Management"** section
3. Expand it if collapsed

#### **Step 3: Access Features**
You should see these options under **HR Management**:

```
HR Management
├─ 📋 Team Management
├─ ⏰ Attendance Approval
├─ 🔗 Attendance Links
├─ 📅 Automated Schedules  ← Click here for schedules
└─ 👥 Employee Groups      ← Click here for groups
```

**If you don't see these options:**
- Check your role (must be `admin`, `manager`, or `employer`)
- Check your permissions (must have attendance permissions)
- Contact your system administrator

---

## 📍 Direct URLs

If sidebar navigation doesn't work, use these direct URLs:

### **Employee Groups:**
```
https://portal.thesmartpro.io/en/employer/attendance-groups
```

### **Automated Schedules:**
```
https://portal.thesmartpro.io/en/employer/attendance-schedules
```

### **Attendance Links:**
```
https://portal.thesmartpro.io/en/employer/attendance-links
```

### **Attendance Approval:**
```
https://portal.thesmartpro.io/en/employer/attendance-approval
```

---

## 🚀 Complete Step-by-Step Guide

### **PART 1: Initial Setup (First Time Only)**

#### **Step 1: Create Office Locations**

**Why:** Employees need to check in at specific locations. You must define these locations first.

**How:**
1. Navigate to: **HR Management → Attendance Links**
2. Look for **"Office Locations"** section
3. Click **"Add Office Location"** or **"Create Location"**
4. Fill in the form:
   ```
   Name: Grand Mall Muscat
   Address: Grand Mall, Muscat, Oman
   Latitude: 23.6145 (use Google Maps to find)
   Longitude: 58.5459
   Allowed Radius: 50 meters
   ```
5. Click **"Save"**

**Repeat** for each location:
- City Center Muscat
- Al Mouj Mall
- Main Office
- etc.

**✅ Result:** You now have office locations defined.

---

#### **Step 2: Create Employee Groups**

**Why:** Groups organize employees by location or department. This makes schedule management easier.

**How:**
1. Navigate to: **HR Management → Employee Groups**
2. Click **"Create Group"** button (top right)
3. Fill in the form:

   **Basic Information:**
   ```
   Group Name: Grand Mall Muscat Team
   Description: Employees working at Grand Mall location
   Group Type: Location-Based
   ```

   **Location Settings:**
   ```
   Office Location: Grand Mall Muscat (select from dropdown)
   ```

   **Optional Settings:**
   ```
   Default Check-In Time: 09:00
   Default Check-Out Time: 17:00
   ```

4. Click **"Create Group"**

**Repeat** for each group:
- "City Center Muscat Team" (Location-Based)
- "Sales Department" (Department-Based)
- "Marketing Team" (Department-Based)
- etc.

**✅ Result:** You now have employee groups created.

---

#### **Step 3: Assign Employees to Groups**

**Why:** Employees must be assigned to groups to receive automated attendance links.

**How:**
1. Go to: **HR Management → Employee Groups**
2. Find the group you want to assign employees to (e.g., "Grand Mall Muscat Team")
3. Click **"Edit"** button on that group
4. Scroll to **"Assign Employees"** section
5. You'll see a tabbed interface:
   - **All Employees** - Shows all company employees
   - **Selected** - Choose specific employees
   - **Groups** - Assign from other groups
   - **By Location** - Auto-assign by location

6. For **"Selected"** tab:
   - Use search bar to find employees
   - Check the box next to each employee you want to assign
   - Or click **"Select All"** to select all visible employees
   - Selected employees will show a checkmark

7. Click **"Update Group"** to save

**Visual Guide:**
```
Employee Groups Page
├─ List of Groups
│  └─ "Grand Mall Muscat Team" [Edit Button]
│     └─ Opens Dialog
│        └─ "Assign Employees" Section
│           └─ Employee Selector
│              ├─ Search: [Type name here]
│              ├─ [✓] Employee 1
│              ├─ [✓] Employee 2
│              ├─ [ ] Employee 3
│              └─ [✓] Employee 4
│           └─ [Update Group Button]
```

**✅ Result:** Employees are now assigned to groups.

---

#### **Step 4: Create Attendance Schedule**

**Why:** Schedules define when, where, and for whom attendance links are generated automatically.

**How:**
1. Navigate to: **HR Management → Automated Schedules**
2. Click **"Create Schedule"** button (top right)
3. A dialog will open with multiple tabs

**Tab 1: Basic Settings**
```
Name: Daily Grand Mall Check-In
Description: Automatic check-in links for Grand Mall team
Active: ✓ (checked)
```

**Tab 2: Location Settings**
```
Location Source: Office Location (or Google Maps Search, or Custom)
Office Location: Grand Mall Muscat (select from dropdown)
Allowed Radius: 50 meters
```

**Tab 3: Schedule Settings**
```
Check-In Time: 09:00
Check-Out Time: 17:00 (optional)
Link Valid Duration: 2 hours
Days of Week:
  ✓ Monday
  ✓ Tuesday
  ✓ Wednesday
  ✓ Thursday
  ✓ Friday
  ☐ Saturday
  ☐ Sunday
```

**Tab 4: Employee Assignment** ⭐ **IMPORTANT**
```
Assignment Type: [Select one]
├─ All Employees - Everyone gets links
├─ Selected - Choose specific employees
├─ Groups - Assign to employee groups
└─ By Location - Auto by location

For "Groups" or "By Location":
- Select "Groups" tab
- Check the groups you want:
  ✓ Grand Mall Muscat Team
  ☐ City Center Muscat Team
  ☐ Sales Department
```

**Tab 5: Notification Settings**
```
Send Check-In Link: ✓
Send Check-Out Link: ☐ (optional)
Notification Method:
  ✓ Email
  ✓ SMS
Send Before: 15 minutes
```

**Tab 6: Advanced Settings**
```
Max Uses Per Link: 1 (one-time use)
Require Photo: ✓
Require Location Verification: ✓
```

4. Click **"Create Schedule"**

**✅ Result:** Schedule is created and will run automatically every day.

---

### **PART 2: Daily Operations (Automatic)**

Once setup is complete, the system runs automatically:

#### **What Happens Every Day:**

**00:00 UTC (04:00 Oman Time)**
- System checks all active schedules
- Generates unique links for each employee
- Creates attendance link records

**08:45 Oman Time (15 min before 09:00 check-in)**
- System sends email/SMS notifications
- Each employee receives their personalized link
- Links become active

**09:00 Oman Time**
- Check-in window opens
- Employees can use their links
- Links valid until 11:00 (2 hours)

**Throughout the Day**
- Employees check in using their links
- System verifies location (GPS)
- System captures photo
- Attendance records created

**17:00 Oman Time (if check-out enabled)**
- Check-out window opens
- Employees can check out

---

### **PART 3: Managing the System**

#### **Viewing Schedules**

1. Go to: **HR Management → Automated Schedules**
2. You'll see a list of all schedules:
   ```
   Schedule Name          | Status  | Location        | Employees | Actions
   ──────────────────────────────────────────────────────────────────────
   Daily Grand Mall      | Active  | Grand Mall      | 15        | [Edit] [Delete]
   City Center Daily     | Active  | City Center     | 20        | [Edit] [Delete]
   Sales Team Schedule   | Paused  | Main Office     | 12        | [Edit] [Delete]
   ```

3. Click **"Edit"** to modify a schedule
4. Click **"Delete"** to remove a schedule
5. Toggle **Active/Paused** to enable/disable

---

#### **Viewing Employee Groups**

1. Go to: **HR Management → Employee Groups**
2. You'll see all groups:
   ```
   Group Name              | Type      | Location        | Employees | Actions
   ──────────────────────────────────────────────────────────────────────
   Grand Mall Team         | Location  | Grand Mall      | 15        | [Edit] [Delete]
   City Center Team        | Location  | City Center     | 20        | [Edit] [Delete]
   Sales Department        | Department| -               | 12        | [Edit] [Delete]
   ```

3. Click **"Edit"** to modify group or reassign employees
4. Click **"Delete"** to remove group (employees won't be deleted)

---

#### **Manual Link Generation**

If you need to generate links immediately (without waiting for cron):

1. Go to: **HR Management → Automated Schedules**
2. Find the schedule you want
3. Click **"Generate Now"** button
4. System will:
   - Generate links for all target employees
   - Send notifications immediately
   - Update schedule metadata

---

#### **Viewing Attendance Records**

1. Go to: **HR Management → Attendance Approval**
2. You'll see pending check-ins:
   ```
   Employee        | Check-In Time | Location      | Photo | Status   | Actions
   ──────────────────────────────────────────────────────────────────────
   John Doe        | 09:15        | Grand Mall    | [View]| Pending  | [Approve] [Reject]
   Jane Smith      | 09:20        | City Center   | [View]| Pending  | [Approve] [Reject]
   ```

3. Click **"View"** to see photo and location details
4. Click **"Approve"** to approve attendance
5. Click **"Reject"** to reject (provide reason)

---

### **PART 4: Employee Experience**

#### **How Employees Receive Links**

**Email Notification:**
```
Subject: Your Check-In Link for Today - Grand Mall Muscat

Hello [Employee Name],

Your check-in link for today (January 15, 2025) is ready:

🔗 https://portal.thesmartpro.io/attendance/check-in/ABC123

Valid from: 08:45 AM to 11:00 AM
Location: Grand Mall Muscat

Please check in when you arrive at the location.

Thank you!
```

**SMS Notification:**
```
Your check-in link: https://portal.thesmartpro.io/attendance/check-in/ABC123
Valid: 08:45-11:00. Location: Grand Mall Muscat
```

---

#### **How Employees Check In**

1. **Employee receives link** (email/SMS)
2. **Employee clicks link** (opens check-in page)
3. **System detects location** (GPS)
4. **Employee sees:**
   ```
   ┌─────────────────────────────────────┐
   │  Check-In: Grand Mall Muscat       │
   │                                     │
   │  Location: ✓ Verified              │
   │  Distance: 5 meters from target    │
   │                                     │
   │  [Take Photo] [Check In]            │
   └─────────────────────────────────────┘
   ```
5. **Employee takes selfie photo**
6. **Employee clicks "Check In"**
7. **System confirms:**
   ```
   ✓ Check-in successful!
   Time: 09:15 AM
   Location: Grand Mall Muscat
   Status: Pending Approval
   ```

---

## 🎯 Common Use Cases

### **Use Case 1: Single Location Company**

**Scenario:** All employees work at one location

**Setup:**
1. Create 1 office location: "Main Office"
2. Create 1 group: "All Employees" (Location-Based)
3. Assign all employees to this group
4. Create 1 schedule:
   - Location: Main Office
   - Assignment: All Employees
   - Check-in: 09:00
   - Days: Monday-Friday

**Result:** All employees receive daily check-in links automatically.

---

### **Use Case 2: Multi-Location Retail**

**Scenario:** Employees work at different malls

**Setup:**
1. Create locations:
   - Grand Mall Muscat
   - City Center Muscat
   - Al Mouj Mall

2. Create groups (one per location):
   - Grand Mall Team
   - City Center Team
   - Al Mouj Team

3. Assign employees to their respective groups

4. Create schedules (one per location):
   - "Grand Mall Daily" → Location: Grand Mall → Assignment: By Location
   - "City Center Daily" → Location: City Center → Assignment: By Location
   - "Al Mouj Daily" → Location: Al Mouj → Assignment: By Location

**Result:** Each location's employees receive links for their specific location.

---

### **Use Case 3: Department-Based Schedules**

**Scenario:** Different departments have different schedules

**Setup:**
1. Create groups:
   - Sales Department
   - Marketing Department
   - Operations Department

2. Assign employees by department

3. Create schedules:
   - "Sales Team" → Assignment: Groups → Sales Department → Check-in: 08:30
   - "Marketing Team" → Assignment: Groups → Marketing Department → Check-in: 09:00
   - "Operations Team" → Assignment: Groups → Operations Department → Check-in: 07:00

**Result:** Each department receives links at their scheduled time.

---

### **Use Case 4: Mixed Assignment**

**Scenario:** Some employees need custom schedules

**Setup:**
1. Create groups for most employees
2. Create schedule with "Selected" assignment type
3. Manually select specific employees who need different times/locations

**Result:** Flexible assignment for special cases.

---

## 🔧 Troubleshooting

### **Problem: Can't see "Employee Groups" or "Automated Schedules" in sidebar**

**Solutions:**
1. **Check your role:**
   - Must be `admin`, `manager`, or `employer`
   - Go to your profile to verify

2. **Check permissions:**
   - Must have `attendance:read:all` and `attendance:create:all`
   - Contact administrator to grant permissions

3. **Use direct URLs:**
   - `/en/employer/attendance-groups`
   - `/en/employer/attendance-schedules`

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

### **Problem: Links not being generated**

**Solutions:**
1. **Check schedule is active:**
   - Go to Schedules page
   - Verify "Active" toggle is ON

2. **Check schedule days:**
   - Verify today is in the schedule's active days
   - Monday-Friday schedules won't run on weekends

3. **Check cron job:**
   - Verify cron is configured in Vercel
   - Check cron logs for errors

4. **Check employees assigned:**
   - Verify employees are in assigned groups
   - Verify employees have "active" status

---

### **Problem: Employees not receiving links**

**Solutions:**
1. **Check employee assignment:**
   - Verify employee is in the correct group
   - Verify employee employment status is "active"

2. **Check notification settings:**
   - Verify email/SMS is enabled in schedule
   - Check employee's email/phone is correct

3. **Check notification delivery:**
   - Check email spam folder
   - Verify SMS provider is working
   - Check system logs for delivery errors

---

### **Problem: Location verification failing**

**Solutions:**
1. **Check GPS permissions:**
   - Employee must allow location access in browser
   - Check browser settings

2. **Check office location coordinates:**
   - Verify coordinates are correct
   - Use Google Maps to verify

3. **Check allowed radius:**
   - Increase radius if employees are slightly outside
   - Default is 50 meters

4. **Check employee is on-site:**
   - Employee must be physically at the location
   - GPS must be accurate

---

## 📊 Monitoring & Reports

### **Schedule Statistics**

View schedule performance:
1. Go to: **HR Management → Automated Schedules**
2. Click on a schedule
3. See statistics:
   - Total links generated
   - Total notifications sent
   - Last generated date
   - Next generation date
   - Employee count

### **Attendance Reports**

View attendance data:
1. Go to: **HR Management → Attendance Approval**
2. Filter by:
   - Date range
   - Employee
   - Location
   - Status (pending/approved/rejected)
3. Export data if needed

---

## ✅ Best Practices

1. **Organize by Location First**
   - Create location-based groups
   - Easier to manage multi-location companies

2. **Use Descriptive Names**
   - "Daily Grand Mall Check-In" not "Schedule 1"
   - Makes management easier

3. **Set Realistic Times**
   - Check-in: 15-30 minutes before work starts
   - Link validity: 2-3 hours (gives flexibility)

4. **Test Before Going Live**
   - Create test schedule
   - Assign to yourself
   - Verify link generation and delivery

5. **Monitor Regularly**
   - Check attendance approval daily
   - Review schedule statistics weekly
   - Adjust as needed

---

## 🆘 Support

If you need help:
1. Check this guide first
2. Review troubleshooting section
3. Contact system administrator
4. Check system logs for errors

---

## 📝 Quick Reference

### **Navigation Paths:**
```
Sidebar → HR Management → Employee Groups
Sidebar → HR Management → Automated Schedules
Sidebar → HR Management → Attendance Approval
Sidebar → HR Management → Attendance Links
```

### **Key URLs:**
```
/employer/attendance-groups
/employer/attendance-schedules
/employer/attendance-approval
/employer/attendance-links
```

### **Required Permissions:**
```
attendance:read:all
attendance:create:all
attendance:approve:all
```

### **Required Roles:**
```
admin
manager
employer
```

---

**🎉 You're all set! The system will now automatically generate and send attendance links every day.**

