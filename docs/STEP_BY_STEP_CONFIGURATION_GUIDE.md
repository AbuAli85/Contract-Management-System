# 📋 Step-by-Step Configuration Guide: Automated Daily Attendance Links

## 🎯 Overview

This guide will walk you through configuring the system to automatically generate and send attendance check-in links to employees every day based on your settings.

---

## 📍 Prerequisites

Before starting, ensure you have:
- ✅ Admin, Manager, or Employer role
- ✅ Office locations created
- ✅ Employees added to your team
- ✅ Permissions: `attendance:read:all` and `attendance:create:all`

---

## 🚀 Complete Setup Process

### **STEP 1: Create Office Locations**

**Purpose:** Define physical locations where employees work.

**How to do it:**

1. **Navigate to:** `HR Management → Attendance Links`
2. **Look for:** "Office Locations" section
3. **Click:** "Add Office Location" or "Create Location"
4. **Fill in the form:**

   ```
   Name: Grand Mall Muscat
   Address: Grand Mall, Muscat, Oman
   Latitude: 23.6145
   Longitude: 58.5459
   Allowed Radius: 50 meters
   Is Active: ✓ (checked)
   ```

5. **How to get coordinates:**
   - Open Google Maps
   - Search for your location (e.g., "Grand Mall Muscat")
   - Right-click on the location
   - Click on the coordinates (e.g., "23.6145, 58.5459")
   - Copy latitude and longitude

6. **Click:** "Save Location"

**Repeat** for each location:
- City Center Muscat
- Al Mouj Mall
- Main Office
- Any other work locations

**✅ Result:** You now have office locations defined.

---

### **STEP 2: Create Employee Groups**

**Purpose:** Organize employees by location or department for easier management.

**How to do it:**

1. **Navigate to:** `HR Management → Employee Groups`
2. **Click:** "Create Group" button (top right)
3. **Fill in Basic Information:**

   ```
   Group Name: Grand Mall Muscat Team
   Description: Employees working at Grand Mall location
   Group Type: Location-Based
   ```

4. **Select Office Location:**
   - Click dropdown: "Office Location"
   - Select: "Grand Mall Muscat"

5. **Optional - Set Default Times:**
   ```
   Default Check-In Time: 09:00
   Default Check-Out Time: 17:00
   ```
   *(These can be overridden in schedules)*

6. **Assign Employees:**
   - Scroll to "Assign Employees" section
   - You'll see tabs: "All Employees", "Selected", "Groups", "By Location"
   - Click **"Selected"** tab
   - Use search bar to find employees
   - Check boxes next to employees who work at Grand Mall
   - Selected employees will show a checkmark ✓

7. **Click:** "Create Group"

**Repeat** for each group:
- "City Center Muscat Team" (Location-Based)
- "Sales Department" (Department-Based)
- "Marketing Team" (Department-Based)
- etc.

**✅ Result:** Employees are now organized into groups.

---

### **STEP 3: Create Automated Schedule**

**Purpose:** Configure when, where, and for whom links are generated automatically.

**How to do it:**

1. **Navigate to:** `HR Management → Automated Schedules`
2. **Click:** "Create Schedule" button (top right)
3. **A dialog will open with multiple tabs**

#### **Tab 1: Basic Settings**

```
Name: Daily Grand Mall Check-In
Description: Automatic check-in links for Grand Mall team
Active: ✓ (checked - must be ON for automation)
```

#### **Tab 2: Location Settings**

**Choose Location Source:**
- **Option A: Office Location** (Recommended)
  - Select: "Office Location" radio button
  - Choose: "Grand Mall Muscat" from dropdown
  - Allowed Radius: 50 meters

- **Option B: Google Maps Search**
  - Select: "Google Maps Search" radio button
  - Type location name: "Grand Mall Muscat"
  - Select from suggestions
  - System auto-fills coordinates

- **Option C: Custom Coordinates**
  - Select: "Custom Coordinates" radio button
  - Enter: Latitude and Longitude manually

**✅ Recommended:** Use "Office Location" for consistency.

#### **Tab 3: Schedule Settings**

```
Check-In Time: 09:00
Check-Out Time: 17:00 (optional - leave empty if not needed)
Link Valid Duration: 2 hours
```

**Days of Week:**
```
✓ Monday
✓ Tuesday
✓ Wednesday
✓ Thursday
✓ Friday
☐ Saturday
☐ Sunday
```

**Explanation:**
- **Check-In Time:** When employees should check in (e.g., 09:00)
- **Check-Out Time:** When employees should check out (optional)
- **Link Valid Duration:** How long the link remains active (2 hours = valid from 08:45 to 11:00)
- **Days:** Which days the schedule runs (Monday-Friday for weekdays)

#### **Tab 4: Employee Assignment** ⭐ **MOST IMPORTANT**

**Choose Assignment Type:**

**Option 1: All Employees**
```
Assignment Type: All Employees
```
- Sends links to ALL active employees in your company
- Use for: Company-wide policies

**Option 2: Selected Employees**
```
Assignment Type: Selected
```
- Click "Selected" tab
- Search and select specific employees
- Use for: Custom groups or special cases

**Option 3: Groups** ⭐ **RECOMMENDED**
```
Assignment Type: Groups
```
- Click "Groups" tab
- Check the groups you want:
  ```
  ✓ Grand Mall Muscat Team
  ☐ City Center Muscat Team
  ☐ Sales Department
  ```
- Use for: Organized, scalable approach

**Option 4: By Location** ⭐ **BEST FOR MULTI-LOCATION**
```
Assignment Type: By Location
```
- Automatically assigns employees based on location
- If schedule location = "Grand Mall Muscat"
- All employees in groups linked to "Grand Mall Muscat" receive links
- Use for: Multi-location companies

**✅ Recommended:** Use "Groups" or "By Location" for better organization.

#### **Tab 5: Notification Settings**

```
Send Check-In Link: ✓ (checked)
Send Check-Out Link: ☐ (optional)
Notification Method:
  ✓ Email
  ✓ SMS
Send Before: 15 minutes
```

**Explanation:**
- **Send Before:** Links sent 15 minutes before check-in time
- If check-in is 09:00, links sent at 08:45
- **Email + SMS:** Employees receive both (recommended)

#### **Tab 6: Advanced Settings**

```
Max Uses Per Link: 1
Require Photo: ✓
Require Location Verification: ✓
```

**Explanation:**
- **Max Uses:** 1 = one-time use (employee can only check in once)
- **Require Photo:** Employee must take selfie
- **Require Location Verification:** GPS must match location

4. **Click:** "Create Schedule"

**✅ Result:** Schedule is created and will run automatically every day.

---

### **STEP 4: Verify Configuration**

**Check your setup:**

1. **Go to:** `HR Management → Automated Schedules`
2. **Verify:**
   - Schedule shows as "Active" ✓
   - Correct location selected
   - Correct employees/groups assigned
   - Correct times set
   - Days of week correct

3. **Test (Optional):**
   - Click "Generate Now" button on a schedule
   - Check if links are generated
   - Verify employees receive notifications

---

## ⚙️ How Daily Automation Works

### **Automatic Process (No Action Required)**

Once configured, the system runs automatically:

#### **Every Day at 00:00 UTC (04:00 Oman Time):**

1. **System Checks:**
   - Are there active schedules? ✓
   - Should schedule run today? (checks day of week) ✓
   - Has it already been generated today? ✗

2. **For Each Active Schedule:**
   - Gets list of target employees (based on assignment type)
   - Generates unique link for each employee
   - Creates attendance link records
   - Records in database

3. **At Scheduled Time (e.g., 08:45 for 09:00 check-in):**
   - System sends email/SMS notifications
   - Each employee receives personalized link
   - Links become active

4. **During Check-In Window (e.g., 09:00 - 11:00):**
   - Employees can use their links
   - System verifies location (GPS)
   - System captures photo
   - Attendance records created

---

## 📊 Configuration Examples

### **Example 1: Single Location Company**

**Setup:**
```
1. Create 1 office location: "Main Office"
2. Create 1 group: "All Employees" (Location-Based)
3. Assign all employees to this group
4. Create 1 schedule:
   - Location: Main Office
   - Assignment: All Employees
   - Check-in: 09:00
   - Days: Monday-Friday
```

**Result:** All employees receive daily check-in links automatically.

---

### **Example 2: Multi-Location Retail**

**Setup:**
```
1. Create locations:
   - Grand Mall Muscat
   - City Center Muscat
   - Al Mouj Mall

2. Create groups (one per location):
   - Grand Mall Team (linked to Grand Mall)
   - City Center Team (linked to City Center)
   - Al Mouj Team (linked to Al Mouj)

3. Assign employees to their respective groups

4. Create schedules (one per location):
   - "Grand Mall Daily"
     - Location: Grand Mall Muscat
     - Assignment: By Location
     - Check-in: 09:00
   
   - "City Center Daily"
     - Location: City Center Muscat
     - Assignment: By Location
     - Check-in: 09:00
   
   - "Al Mouj Daily"
     - Location: Al Mouj Mall
     - Assignment: By Location
     - Check-in: 09:00
```

**Result:** Each location's employees receive links for their specific location automatically.

---

### **Example 3: Department-Based Schedules**

**Setup:**
```
1. Create groups:
   - Sales Department (Department-Based)
   - Marketing Department (Department-Based)
   - Operations Department (Department-Based)

2. Assign employees by department

3. Create schedules:
   - "Sales Team Schedule"
     - Assignment: Groups → Sales Department
     - Check-in: 08:30
   
   - "Marketing Team Schedule"
     - Assignment: Groups → Marketing Department
     - Check-in: 09:00
   
   - "Operations Schedule"
     - Assignment: Groups → Operations Department
     - Check-in: 07:00
```

**Result:** Each department receives links at their scheduled time automatically.

---

## 🔧 Advanced Configuration

### **Multiple Schedules for Same Group**

You can create multiple schedules for the same group:

```
Schedule 1: "Grand Mall Morning"
- Location: Grand Mall
- Assignment: Grand Mall Team
- Check-in: 09:00
- Days: Monday-Friday

Schedule 2: "Grand Mall Evening"
- Location: Grand Mall
- Assignment: Grand Mall Team
- Check-in: 18:00
- Days: Monday-Friday
```

**Result:** Same employees receive links for both morning and evening check-ins.

---

### **Weekend Schedules**

Create separate schedules for weekends:

```
Schedule: "Weekend Check-In"
- Location: Grand Mall
- Assignment: Grand Mall Team
- Check-in: 10:00
- Days: Saturday, Sunday
```

**Result:** Employees receive links on weekends with different times.

---

### **Custom Notification Times**

Adjust when links are sent:

```
Check-In Time: 09:00
Send Before: 30 minutes
```

**Result:** Links sent at 08:30 (30 minutes before 09:00).

---

## ✅ Verification Checklist

After configuration, verify:

- [ ] Office locations created
- [ ] Employee groups created
- [ ] Employees assigned to groups
- [ ] Schedules created
- [ ] Schedules marked as "Active"
- [ ] Correct assignment type selected
- [ ] Correct times set
- [ ] Correct days selected
- [ ] Notifications enabled (Email/SMS)
- [ ] Test generation works (optional)

---

## 🎯 Quick Start (5 Minutes)

**Fastest setup for single location:**

1. **Create Location:** `HR Management → Attendance Links → Add Location`
2. **Create Group:** `HR Management → Employee Groups → Create Group`
   - Name: "All Employees"
   - Type: Location-Based
   - Select location
   - Assign all employees
3. **Create Schedule:** `HR Management → Automated Schedules → Create Schedule`
   - Location: Your location
   - Assignment: All Employees
   - Check-in: 09:00
   - Days: Monday-Friday
   - Active: ✓

**Done!** System will automatically generate and send links every day.

---

## 📱 What Employees Receive

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

## 🔄 Daily Automation Timeline

### **Monday, January 15, 2025**

```
00:00 UTC (04:00 Oman Time)
├─ Cron job triggers
├─ System checks all active schedules
├─ Finds "Daily Grand Mall Check-In" (runs Mon-Fri)
└─ Generates 15 unique links (one per employee)

08:45 Oman Time (15 min before 09:00)
├─ System sends notifications
├─ 15 emails sent
├─ 15 SMS sent (if enabled)
└─ Links are now active

09:00 Oman Time
├─ Check-in window opens
├─ Employees can use their links
└─ Links valid until 11:00

09:00 - 11:00
├─ Employees check in
├─ Attendance records created
├─ Photos uploaded
└─ Location verified

11:00 Oman Time
├─ Check-in window closes
└─ Links expire

17:00 Oman Time (if check-out enabled)
├─ Check-out window opens
└─ Employees can check out
```

**This repeats automatically every day!**

---

## 🛠️ Troubleshooting

### **Links Not Generated**

**Check:**
1. Schedule is "Active" ✓
2. Today is in schedule's days (Mon-Fri) ✓
3. Employees are assigned to groups ✓
4. Employees have "active" status ✓
5. Cron job is running (check Vercel logs)

**Solution:**
- Click "Generate Now" to test manually
- Check schedule settings
- Verify employee assignments

---

### **Employees Not Receiving Links**

**Check:**
1. Employee is in assigned group ✓
2. Employee employment status is "active" ✓
3. Email/SMS is correct in employee profile ✓
4. Notifications enabled in schedule ✓

**Solution:**
- Verify employee assignment
- Check employee profile
- Test notification delivery

---

### **Wrong Employees Receiving Links**

**Check:**
1. Assignment type is correct
2. Groups are correctly configured
3. Employees are in correct groups

**Solution:**
- Review assignment type
- Check group membership
- Update schedule assignment

---

## 📝 Summary

**Configuration Steps:**
1. ✅ Create office locations
2. ✅ Create employee groups
3. ✅ Assign employees to groups
4. ✅ Create automated schedules
5. ✅ Activate schedules

**Result:**
- System automatically generates links every day
- Links sent to employees 15 minutes before check-in
- Employees check in using their personalized links
- Attendance records created automatically

**No manual work needed after setup!** 🎉

---

## 🆘 Need Help?

- Check: `HR Management → Automated Schedules` for schedule status
- Check: `HR Management → Employee Groups` for group membership
- Check: `HR Management → Attendance Approval` for attendance records
- Review: System logs for automation status

**The system is fully automated once configured!**

