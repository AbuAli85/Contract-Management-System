# 📋 Attendance Setup for One Promoter - Best Practice Guide

**Date:** February 2025  
**Status:** ✅ Complete Step-by-Step Guide

---

## 🎯 **OVERVIEW**

This guide walks you through setting up a complete attendance system for a single promoter/employee with best practices, including:
- ✅ Check-in/Check-out configuration
- ✅ Attendance link generation and delivery
- ✅ Client attendance reports
- ✅ Approval workflow
- ✅ Employer settings management

---

## 📋 **STEP-BY-STEP CONFIGURATION**

### **Step 1: Ensure Promoter is Added as Employee** ✅

**Prerequisite:** The promoter must be added to your team as an employee.

1. Navigate to **Team Management** → **Team** tab
2. Click **"Add Team Member"**
3. Search for promoter by email
4. Fill in employment details:
   - Job Title
   - Department
   - Employment Type
   - Employment Status: **Active**
5. Click **"Add to Team"**

**Verify:**
- Promoter appears in team list
- Status shows as "Active"
- Employee code is generated

---

### **Step 2: Create Office Location (If Not Exists)** ✅

**Purpose:** Define the location where the promoter will check in.

1. Navigate to **Settings** → **Office Locations** (or use the location picker)
2. Click **"Add Location"**
3. Enter location details:
   - **Name:** e.g., "Grand Mall Muscat - Store 1"
   - **Address:** Full address
   - **Coordinates:** Use Google Maps picker or enter manually
   - **Radius:** 50 meters (default, adjustable)
4. Click **"Save Location"**

**Note:** You can also use the location picker when creating attendance links.

---

### **Step 3: Create Attendance Schedule** ✅

**Purpose:** Set up automated daily attendance link generation.

1. Navigate to **Team Management** → **Attendance** → **Schedules** tab
2. Click **"Create Schedule"**
3. Fill in schedule details:

   **Basic Information:**
   - **Schedule Name:** e.g., "Daily Check-In - [Promoter Name]"
   - **Description:** Optional description
   - **Is Active:** ✅ Enabled

   **Location Settings:**
   - **Office Location:** Select the location created in Step 2
   - **Allowed Radius:** 50 meters (adjustable)

   **Time Settings:**
   - **Check-In Time:** e.g., 09:00 AM
   - **Check-Out Time:** e.g., 17:00 PM
   - **Link Valid From:** 15 minutes before check-in (e.g., 08:45)
   - **Link Valid Until:** 2 hours after check-in (e.g., 11:00)

   **Days of Week:**
   - Select days: Monday, Tuesday, Wednesday, Thursday, Friday
   - (Adjust based on work schedule)

   **Assignment:**
   - **Assignment Type:** Select "Specific Employees"
   - **Select Employees:** Choose the promoter from the list

   **Notifications:**
   - **Send Check-In Link:** ✅ Enabled
   - **Send Check-Out Link:** ✅ Enabled (optional)
   - **Notification Method:** Email (or SMS if configured)
   - **Send Before:** 15 minutes before check-in time

4. Click **"Create Schedule"**

**Result:**
- Schedule is created and active
- Links will be generated daily at 00:00 UTC
- Employee will receive email with check-in link

---

### **Step 4: Create Manual Attendance Link (Optional)** ✅

**Purpose:** Create an immediate attendance link for today (if schedule hasn't run yet).

1. Navigate to **Team Management** → **Attendance** → **Links** tab
2. Click **"Create Link"**
3. Fill in link details:

   **Basic Information:**
   - **Title:** e.g., "Check-In Link - [Date]"
   - **Location:** Select office location
   - **Allowed Radius:** 50 meters

   **Validity:**
   - **Valid From:** Now (or specific time)
   - **Valid Until:** End of work day (e.g., 18:00)
   - **Max Uses:** 1 (one check-in per link)

4. Click **"Create Link"**
5. **Copy the link** or **Share via Email/SMS**

**Link Format:**
```
https://portal.thesmartpro.io/en/attendance/check-in/ABC123
```

---

### **Step 5: Send Link to Employee** ✅

**Option A: Automated (Recommended)**
- If schedule is set up correctly, employee receives link automatically via email
- Check email settings in schedule configuration

**Option B: Manual Sharing**
1. Copy the attendance link from Step 4
2. Send via:
   - **Email:** Send link in email
   - **SMS:** Send link via SMS (if SMS service configured)
   - **WhatsApp:** Share link via WhatsApp
   - **QR Code:** Generate QR code and share

**Link Sharing Template:**
```
Hi [Employee Name],

Your check-in link for today:
https://portal.thesmartpro.io/en/attendance/check-in/ABC123

Valid until: [Time]
Location: [Location Name]

Please use this link to check in when you arrive at work.

Thank you!
```

---

### **Step 6: Employee Check-In Process** ✅

**What Employee Does:**

1. **Receives Link:**
   - Via email (automated) or manual sharing

2. **Opens Link:**
   - Clicks link or scans QR code
   - Opens check-in page

3. **Checks In:**
   - System requests location permission
   - Employee takes selfie photo
   - Clicks **"Check In"**
   - System validates:
     - ✅ Location is within allowed radius
     - ✅ Link is valid and not expired
     - ✅ Employee is authorized

4. **Check-Out:**
   - At end of day, employee uses check-out link
   - Or uses same link for check-out
   - System records check-out time

**Result:**
- Attendance record created
- Photo stored
- Location verified
- Time recorded

---

### **Step 7: View and Approve Attendance** ✅

**For Employer:**

1. Navigate to **Team Management** → **Attendance Approval**
2. View pending attendance records:
   - **Date**
   - **Employee Name**
   - **Check-In Time**
   - **Check-Out Time**
   - **Location**
   - **Photo**
   - **Status:** Pending/Approved/Rejected

3. **Review Each Record:**
   - Check photo
   - Verify location
   - Review times
   - Check for anomalies

4. **Take Action:**
   - **Approve:** Click "Approve" → Record is approved
   - **Reject:** Click "Reject" → Add reason → Record is rejected
   - **Bulk Approve:** Select multiple → Click "Approve Selected"

**Approval Settings:**
- **Auto-Approve:** Enable to auto-approve valid check-ins
- **Require Approval:** All check-ins require manual approval
- **Approval Deadline:** Set deadline for approvals

---

### **Step 8: Generate Attendance Report for Client** ✅

**Purpose:** Create professional attendance reports to share with clients.

1. Navigate to **Team Management** → **Attendance** → **Reports**
2. Click **"Generate Report"**
3. Select report parameters:

   **Report Type:**
   - **Daily Report**
   - **Weekly Report**
   - **Monthly Report**
   - **Custom Date Range**

   **Filters:**
   - **Employee:** Select promoter
   - **Date Range:** Select dates
   - **Status:** All/Approved/Pending/Rejected
   - **Location:** Filter by location

   **Report Format:**
   - **PDF** (Recommended for clients)
   - **Excel** (For data analysis)
   - **CSV** (For import)

4. Click **"Generate Report"**
5. **Download and Share:**
   - Download PDF
   - Email to client
   - Print if needed

**Report Includes:**
- Employee information
- Attendance summary
- Daily attendance records
- Check-in/check-out times
- Location verification
- Photos (optional)
- Hours worked
- Overtime (if applicable)
- Approval status

---

### **Step 9: Configure Attendance Settings** ✅

**For Employer:**

1. Navigate to **Team Management** → **Attendance** → **Settings**
2. Configure settings:

   **General Settings:**
   - **Require Photo:** ✅ Enable/Disable
   - **Require Location:** ✅ Enable/Disable
   - **Location Radius:** 50 meters (adjustable)
   - **Auto-Approve:** Enable/Disable
   - **Approval Deadline:** Set hours/days

   **Link Settings:**
   - **Link Validity:** Default validity period
   - **Max Uses Per Link:** 1 (recommended)
   - **Link Expiry:** Set expiry time

   **Notification Settings:**
   - **Send Check-In Reminders:** Enable/Disable
   - **Reminder Time:** Set time before check-in
   - **Send Check-Out Reminders:** Enable/Disable
   - **Notification Methods:** Email/SMS/Both

   **Report Settings:**
   - **Default Report Format:** PDF/Excel/CSV
   - **Include Photos:** Enable/Disable
   - **Include Location:** Enable/Disable
   - **Auto-Generate Reports:** Enable/Disable

3. Click **"Save Settings"**

---

## 📊 **ATTENDANCE REPORT FOR CLIENT**

### **Report Features:**

✅ **Professional Layout**
- Company branding
- Employee information
- Date range
- Summary statistics

✅ **Detailed Records**
- Daily attendance
- Check-in/check-out times
- Location verification
- Hours worked
- Overtime calculation

✅ **Visual Elements**
- Charts and graphs
- Status indicators
- Photo thumbnails (optional)

✅ **Export Options**
- PDF (best for clients)
- Excel (for data analysis)
- CSV (for import)

### **Generating Client Report:**

1. Go to **Attendance Reports**
2. Select **"Client Report"**
3. Choose:
   - Employee
   - Date range
   - Format (PDF recommended)
4. Click **"Generate"**
5. Download and share with client

---

## ✅ **APPROVAL WORKFLOW**

### **Approval Process:**

1. **Employee Checks In:**
   - Attendance record created
   - Status: **Pending**

2. **Employer Reviews:**
   - Views pending records
   - Reviews photo and location
   - Verifies times

3. **Employer Approves/Rejects:**
   - **Approve:** Record marked as approved
   - **Reject:** Record marked as rejected with reason

4. **Auto-Approval (Optional):**
   - If enabled, valid check-ins auto-approve
   - Invalid check-ins still require review

### **Approval Actions:**

- ✅ **Approve Single:** Click approve on individual record
- ✅ **Approve Multiple:** Select multiple → Bulk approve
- ✅ **Reject with Reason:** Reject and add comment
- ✅ **Request Clarification:** Request more info from employee

---

## 🔧 **SETTINGS MANAGEMENT**

### **Employer Settings:**

**Access:** Team Management → Attendance → Settings

**Available Settings:**

1. **Check-In Requirements:**
   - Require photo
   - Require location
   - Location radius
   - Time window

2. **Approval Settings:**
   - Auto-approve enabled/disabled
   - Approval deadline
   - Require manager approval

3. **Link Settings:**
   - Default validity period
   - Max uses per link
   - Link expiry time

4. **Notification Settings:**
   - Email notifications
   - SMS notifications
   - Reminder timing

5. **Report Settings:**
   - Default format
   - Include photos
   - Include location
   - Auto-generation

---

## 📱 **EMPLOYEE LINK DELIVERY**

### **How Employee Gets Link:**

1. **Automated Email (Recommended):**
   - System sends email daily
   - Contains check-in link
   - Includes instructions

2. **SMS (If Configured):**
   - System sends SMS with link
   - Short link format

3. **Manual Sharing:**
   - Employer shares link manually
   - Via email, SMS, WhatsApp, etc.

4. **QR Code:**
   - Generate QR code
   - Employee scans to check in

### **Link Format:**
```
https://portal.thesmartpro.io/en/attendance/check-in/ABC123
```

### **Link Features:**
- ✅ Unique per employee/day
- ✅ Location-restricted
- ✅ Time-restricted
- ✅ Single-use (configurable)
- ✅ Secure and validated

---

## ✅ **VERIFICATION CHECKLIST**

After setup, verify:

- [ ] Promoter is added as employee
- [ ] Office location is created
- [ ] Attendance schedule is created and active
- [ ] Employee receives check-in link (email/SMS)
- [ ] Employee can check in successfully
- [ ] Location is verified
- [ ] Photo is captured
- [ ] Attendance record is created
- [ ] Employer can view attendance
- [ ] Employer can approve/reject
- [ ] Attendance report can be generated
- [ ] Settings are configured
- [ ] Notifications are working

---

## 🚀 **QUICK START SCRIPT**

For quick setup, use the SQL script:
`scripts/setup-attendance-for-one-promoter.sql`

This script automates:
- Employee verification
- Location setup
- Schedule creation
- Link generation

---

## 📞 **TROUBLESHOOTING**

### **Employee Not Receiving Links:**
- Check schedule is active
- Verify email in employee profile
- Check notification settings
- Verify cron job is running

### **Location Not Verified:**
- Check location coordinates
- Verify radius settings
- Ensure GPS is enabled
- Check location permissions

### **Link Expired:**
- Check link validity period
- Verify system time
- Regenerate link if needed

### **Approval Not Working:**
- Check approval settings
- Verify permissions
- Check approval deadline

---

## 📚 **RELATED DOCUMENTATION**

- `ATTENDANCE_SYSTEM_USAGE.md` - General usage guide
- `ATTENDANCE_SETUP_CHECKLIST.md` - Setup checklist
- `ATTENDANCE_LINK_SYSTEM.md` - Link system details
- `HOW_IT_WORKS_ATTENDANCE_SCHEDULES.md` - Schedule automation

---

**Status:** ✅ Complete  
**Last Updated:** February 2025

