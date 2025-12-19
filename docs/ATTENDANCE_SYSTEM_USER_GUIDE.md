# 📋 Professional Attendance System - User Guide

## 🎯 Overview

The Professional Attendance System provides comprehensive time tracking for both **Employees** and **Employers/Managers**. This guide explains how to use all features from both perspectives.

---

## 👤 **FOR EMPLOYEES**

### **Accessing the Attendance System**

**Navigation Path:**
```
Sidebar → "Attendance" or "My Attendance"
URL: /en/attendance (or /ar/attendance for Arabic)
```

### **1. Today's Attendance Dashboard**

#### **Check-In Process:**
1. **Navigate to Attendance Page**
   - Click "Attendance" in the sidebar
   - You'll see today's attendance status

2. **Click "Check In" Button**
   - System will request location permission
   - Allow location access when prompted
   - Camera will open for photo capture
   - Position your face in the frame
   - Click "Capture Photo"
   - Review the photo and click "Check In"

3. **What Happens:**
   - ✅ Your check-in time is recorded
   - ✅ Location is verified
   - ✅ Photo is saved
   - ✅ Status shows "Checked In"
   - ✅ Working hours timer starts

#### **During Work:**
- **View Working Hours**: See real-time timer showing hours worked
- **Start Break**: Click "Start Break" when taking a break
- **End Break**: Click "End Break" when returning
- **Break Duration**: Automatically tracked and excluded from total hours

#### **Check-Out Process:**
1. **Click "Check Out" Button**
   - Location permission requested again
   - Camera opens for check-out photo
   - Capture photo
   - Click "Check Out"

2. **What Happens:**
   - ✅ Check-out time recorded
   - ✅ Total hours calculated (excluding breaks)
   - ✅ Overtime calculated (if over 8 hours)
   - ✅ Status updated to "Checked Out"

### **2. Attendance History**

**Access:** Click "History" tab in attendance dashboard

**Features:**
- **View Past Records**: See all your attendance history
- **Search**: Search by date or status
- **Filter by Status**: Present, Late, Absent, etc.
- **Filter by Approval**: Approved, Pending, Rejected
- **Month Selection**: Select any month to view
- **Statistics Cards**: 
  - Present Days
  - Late Days
  - Total Hours
  - Overtime Hours
- **Export to CSV**: Download your attendance data

**How to Use:**
1. Select month from date picker
2. Use search bar to find specific dates
3. Apply filters as needed
4. Click "Export CSV" to download

### **3. Analytics & Reports**

**Access:** Click "Analytics" tab in attendance dashboard

**Features:**
- **Key Metrics**:
  - Attendance Rate (%)
  - Total Hours
  - Average Hours/Day
  - Overtime Hours
- **Attendance Breakdown**: Visual breakdown of present/late/absent days
- **Time Summary**: Detailed time statistics
- **Weekly Trends**: Weekly attendance patterns
- **Export Options**: Excel and PDF export

**How to Use:**
1. Select date range (Week, Month, Quarter, Year)
2. Select specific month
3. View metrics and charts
4. Export reports as needed

### **4. Notifications**

**Access:** Notifications appear automatically or can be accessed via bell icon

**Types of Notifications:**
- **Check-in Reminders**: Reminder to check in (before 9 AM)
- **Approval Pending**: Your attendance is pending manager approval
- **Approval Approved**: Your attendance has been approved
- **Approval Rejected**: Your attendance was rejected (with reason)
- **Late Warning**: Alert if you checked in late
- **Anomaly Alerts**: Unusual patterns detected

**Managing Notifications:**
- Click notification to mark as read
- Click "Mark All Read" to clear all
- Click "Settings" to configure preferences:
  - Enable/disable check-in reminders
  - Enable/disable approval notifications
  - Enable/disable anomaly alerts
  - Set reminder time

---

## 👔 **FOR EMPLOYERS/MANAGERS**

### **Accessing Attendance Management**

**Navigation Paths:**
```
Option 1: Sidebar → "Team Management" → Select Employee → "Attendance" Tab
URL: /en/employer/team

Option 2: Sidebar → "Attendance Approval" (if available)
URL: /en/employer/attendance/approval
```

### **1. View Team Attendance**

#### **Via Team Management:**
1. **Navigate to Team Management**
   - Go to `/en/employer/team`
   - You'll see your team members list

2. **Select a Team Member**
   - Click on any team member
   - Click "Attendance" tab
   - View their attendance history

3. **What You Can See:**
   - Monthly attendance summary
   - Daily check-in/check-out times
   - Total hours worked
   - Overtime hours
   - Break durations
   - Approval status
   - Location data
   - Photos

### **2. Attendance Approval Workflow**

#### **Access Approval Dashboard:**
```
Sidebar → "Attendance Approval" or
Team Management → "Attendance" → "Pending Approvals"
```

#### **Review Pending Attendance:**
1. **View Pending Records**
   - See all attendance records pending approval
   - Filter by status (All, Pending, Approved, Rejected)
   - Each record shows:
     - Employee name and photo
     - Date and times
     - Total hours
     - Location coordinates
     - Check-in photo
     - Approval status

2. **Single Record Approval:**
   - Click ✅ (green checkmark) to approve
   - Click ❌ (red X) to reject
   - If rejecting, provide reason

3. **Bulk Approval:**
   - Check boxes next to multiple records
   - Click "Approve Selected" or "Reject Selected"
   - Confirm action in dialog
   - For rejections, enter reason

#### **Approval Process:**
1. **Review Details:**
   - Check employee name
   - Verify check-in/check-out times
   - Review location (if available)
   - View check-in photo
   - Check total hours and overtime

2. **Make Decision:**
   - **Approve**: If everything looks correct
   - **Reject**: If there are issues (provide reason)

3. **What Happens:**
   - Employee receives notification
   - Record status updated
   - Appears in approved/rejected list

### **3. Team Attendance Overview**

#### **View All Team Members:**
1. **Navigate to Team Management**
2. **View Statistics:**
   - Total team members
   - Active employees
   - On leave count
   - Today's attendance summary

3. **Filter and Search:**
   - Search by employee name
   - Filter by status
   - Filter by department

### **4. Attendance Reports (For Employers)**

**Access:** Team Management → Analytics or Reports section

**Available Reports:**
- **Team Attendance Summary**: Overall team statistics
- **Individual Reports**: Per-employee detailed reports
- **Monthly Reports**: Month-wise attendance analysis
- **Overtime Reports**: Overtime tracking and analysis
- **Export Options**: Excel, PDF, CSV

**How to Generate Reports:**
1. Select date range
2. Choose employees (all or specific)
3. Select report type
4. Click "Generate Report"
5. Download in preferred format

---

## 🔐 **PERMISSIONS & ACCESS**

### **Employee Permissions:**
- ✅ View own attendance
- ✅ Check in/out
- ✅ View own history
- ✅ View own analytics
- ✅ Manage own notifications
- ❌ Cannot approve/reject attendance
- ❌ Cannot view other employees' data

### **Employer/Manager Permissions:**
- ✅ View all team attendance
- ✅ Approve/reject attendance
- ✅ View team analytics
- ✅ Generate reports
- ✅ Export data
- ✅ Manage attendance links
- ✅ View employee photos and locations

---

## 📱 **MOBILE USAGE**

### **For Employees:**
- All features work on mobile browsers
- Location access required for check-in/out
- Camera access required for photos
- Responsive design adapts to mobile screens

### **For Employers:**
- View and approve attendance on mobile
- Team management accessible
- Reports viewable (export for detailed analysis)

---

## ⚠️ **TROUBLESHOOTING**

### **Common Issues:**

#### **1. Location Not Working:**
- **Problem**: "Location Required" error
- **Solution**: 
  - Allow location permission in browser
  - Check browser settings
  - Ensure GPS is enabled on device
  - Try refreshing the page

#### **2. Camera Not Working:**
- **Problem**: Camera doesn't open
- **Solution**:
  - Allow camera permission
  - Check browser settings
  - Try different browser
  - Ensure device has camera

#### **3. Can't Check In:**
- **Problem**: Check-in button disabled
- **Solution**:
  - Ensure you're logged in
  - Check if already checked in today
  - Verify employee record exists
  - Contact manager if issue persists

#### **4. Approval Not Showing:**
- **Problem**: Can't see pending approvals
- **Solution**:
  - Verify you have manager/employer role
  - Check company assignment
  - Refresh the page
  - Check filter settings

#### **5. Break Not Tracking:**
- **Problem**: Break time not updating
- **Solution**:
  - Ensure you're checked in first
  - Click "Start Break" before leaving
  - Click "End Break" when returning
  - Check if already checked out

---

## 📊 **BEST PRACTICES**

### **For Employees:**
1. **Check In Early**: Check in before 9 AM to avoid late status
2. **Take Breaks Properly**: Always start/end breaks using the system
3. **Review History**: Regularly check your attendance history
4. **Enable Notifications**: Stay updated on approvals and reminders
5. **Report Issues**: Contact manager if you notice discrepancies

### **For Employers:**
1. **Review Daily**: Check pending approvals daily
2. **Verify Details**: Review photos and locations before approving
3. **Communicate**: Provide clear rejection reasons
4. **Use Bulk Actions**: Save time with bulk approvals
5. **Generate Reports**: Regular reports help track patterns
6. **Set Expectations**: Communicate attendance policies clearly

---

## 🔄 **WORKFLOW EXAMPLES**

### **Example 1: Employee Daily Routine**
```
08:45 AM - Receive check-in reminder notification
09:00 AM - Check in (location + photo)
12:00 PM - Start break
12:30 PM - End break
05:00 PM - Check out (location + photo)
05:01 PM - Receive approval pending notification
Next Day - Receive approval notification
```

### **Example 2: Manager Daily Routine**
```
09:30 AM - Review pending attendance approvals
10:00 AM - Approve morning check-ins
12:00 PM - Check team attendance status
03:00 PM - Review afternoon check-ins
04:00 PM - Generate daily attendance report
05:30 PM - Approve remaining check-outs
```

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check this guide first
2. Review troubleshooting section
3. Contact your manager/HR
4. Submit a support ticket

---

## 🎓 **QUICK REFERENCE**

### **Employee Quick Actions:**
- **Check In**: Attendance page → "Check In" button
- **Check Out**: Attendance page → "Check Out" button
- **View History**: Attendance page → "History" tab
- **View Analytics**: Attendance page → "Analytics" tab
- **Manage Notifications**: Click bell icon → Settings

### **Employer Quick Actions:**
- **View Team**: Team Management → Select employee
- **Approve Attendance**: Attendance Approval → Select records → Approve
- **View Reports**: Team Management → Reports section
- **Manage Team**: Team Management → Team tab

---

**Last Updated**: January 2025
**Version**: 1.0.0

