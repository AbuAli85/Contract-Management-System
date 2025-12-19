# 📋 Attendance System - Complete Usage Guide

## 🎯 **SYSTEM OVERVIEW**

The Professional Attendance System provides comprehensive time tracking for both employees and employers. This document explains how to use all features.

---

## 👤 **FOR EMPLOYEES**

### **📍 Access Points**

**Main Attendance Page:**
- **URL**: `/en/attendance` (or `/ar/attendance` for Arabic)
- **Navigation**: Sidebar → "Attendance" or "My Attendance"
- **Who Can Access**: All employees

---

### **📅 Daily Workflow**

#### **1. Morning Check-In**

**Steps:**
1. Navigate to Attendance page
2. Click the large **"Check In"** button (green gradient)
3. **Allow Location**: Browser will ask for location permission → Click "Allow"
4. **Camera Opens**: Position your face in the frame
5. **Capture Photo**: Click "Capture Photo" button
6. **Review**: Check your photo, click "Check In" to confirm

**What Happens:**
- ✅ Check-in time recorded (e.g., 09:15 AM)
- ✅ Location captured (GPS coordinates)
- ✅ Photo saved
- ✅ Status changes to "Checked In"
- ✅ Working hours timer starts automatically

**Important Notes:**
- Check in **before 9:00 AM** to avoid "Late" status
- Location permission is required
- Photo is mandatory for verification

---

#### **2. During Work - Break Management**

**Start Break:**
1. While checked in, click **"Start Break"** button
2. Break timer starts automatically
3. Status shows you're on break

**End Break:**
1. When returning, click **"End Break"** button
2. Break duration is calculated
3. Break time is excluded from total working hours

**Multiple Breaks:**
- You can take multiple breaks per day
- All break times are accumulated
- Total break time shown in summary

---

#### **3. End of Day Check-Out**

**Steps:**
1. Click the **"Check Out"** button (red gradient)
2. **Allow Location**: Location permission requested again
3. **Camera Opens**: Take check-out photo
4. **Capture Photo**: Click "Capture Photo"
5. **Confirm**: Click "Check Out"

**What Happens:**
- ✅ Check-out time recorded
- ✅ Total hours calculated (check-out - check-in - breaks)
- ✅ Overtime calculated (if over 8 hours)
- ✅ Status changes to "Checked Out"
- ✅ Record sent for manager approval

**Example Calculation:**
```
Check-in: 09:00 AM
Check-out: 05:30 PM
Break: 1 hour (60 minutes)
Total: 7.5 hours (8.5 - 1 = 7.5)
Overtime: 0 hours (less than 8)
```

---

### **📊 Viewing Your Data**

#### **Today Tab (Default)**
- **Real-time Status**: See if you're checked in/out
- **Working Hours Timer**: Live count of hours worked
- **Break Duration**: Total break time today
- **Quick Actions**: Check in/out, start/end break buttons
- **Summary Cards**: Present days, late days, total hours, overtime

#### **History Tab**
- **Filterable Table**: All your attendance records
- **Search**: Search by date or status
- **Filters**: 
  - Status (Present, Late, Absent, etc.)
  - Approval (Approved, Pending, Rejected)
  - Date range (month picker)
- **Statistics**: Summary cards at top
- **Export**: Download as CSV

**How to Use History:**
1. Click "History" tab
2. Select month from date picker
3. Use search bar to find specific dates
4. Apply filters as needed
5. Click "Export CSV" to download

#### **Analytics Tab**
- **Key Metrics**: 
  - Attendance Rate (%)
  - Total Hours
  - Average Hours/Day
  - Overtime Hours
- **Breakdown Charts**: Visual representation
- **Weekly Trends**: Attendance patterns
- **Export Options**: Excel and PDF

**How to Use Analytics:**
1. Click "Analytics" tab
2. Select date range (Week, Month, Quarter, Year)
3. Select specific month
4. View metrics and charts
5. Export reports as needed

---

### **🔔 Notifications**

**Types:**
- **Check-in Reminder**: Before 9 AM if not checked in
- **Approval Pending**: Your attendance needs approval
- **Approval Approved**: Your attendance was approved ✅
- **Approval Rejected**: Your attendance was rejected ❌ (with reason)
- **Late Warning**: Alert if you checked in late
- **Anomaly Alert**: Unusual patterns detected

**Managing Notifications:**
- Click notification to mark as read
- Click "Mark All Read" to clear all
- Click "Settings" (gear icon) to configure:
  - Enable/disable check-in reminders
  - Enable/disable approval notifications
  - Enable/disable anomaly alerts
  - Set reminder time (default: 08:45 AM)

---

## 👔 **FOR EMPLOYERS/MANAGERS**

### **📍 Access Points**

**Option 1: Attendance Approval Dashboard**
- **URL**: `/en/employer/attendance-approval`
- **Navigation**: Sidebar → "HR Management" → "Attendance Approval"
- **Purpose**: Review and approve all pending attendance

**Option 2: Team Management**
- **URL**: `/en/employer/team`
- **Navigation**: Sidebar → "HR Management" → "Team Management"
- **Purpose**: View individual employee attendance

---

### **✅ Approval Workflow**

#### **Access Approval Dashboard**

1. **Navigate to Approval Page**
   - Go to `/en/employer/attendance-approval`
   - Or click "Attendance Approval" in sidebar

2. **View Pending Records**
   - See all attendance records pending approval
   - Each record shows:
     - Employee name and avatar
     - Date
     - Check-in time
     - Check-out time
     - Total hours
     - Status (Present, Late, etc.)
     - Location coordinates
     - Check-in photo (click camera icon to view)
     - Approval status badge

3. **Filter Options**
   - **Show All**: All records
   - **Show Pending**: Only pending approvals
   - Use search to find specific employees

---

#### **Single Record Approval**

**Approve:**
1. Review the record details
2. Check photo (click camera icon)
3. Verify location if needed
4. Click ✅ (green checkmark) button
5. Record is approved immediately

**Reject:**
1. Review the record
2. Identify the issue
3. Click ❌ (red X) button
4. Enter rejection reason in dialog
5. Click "Reject"
6. Employee receives notification with reason

---

#### **Bulk Approval (Multiple Records)**

**Steps:**
1. **Select Records**: 
   - Check boxes next to multiple records
   - Or click checkbox in header to select all

2. **Choose Action**:
   - Click **"Approve Selected"** (green button)
   - OR Click **"Reject Selected"** (red button)

3. **Confirm**:
   - Dialog appears
   - For rejections: Enter reason
   - Click "Approve" or "Reject"

4. **Result**:
   - All selected records updated
   - Employees receive notifications
   - Records move to approved/rejected list

**Best Practice**: Review each record's photo and details before bulk approving.

---

### **👥 View Team Attendance**

#### **Via Team Management**

1. **Navigate to Team Management**
   - Go to `/en/employer/team`
   - See your team members list

2. **Select an Employee**
   - Click on any team member card
   - Employee details panel opens

3. **View Attendance Tab**
   - Click "Attendance" tab
   - See their attendance history
   - Monthly summary
   - Daily records with:
     - Check-in/check-out times
     - Total hours
     - Overtime
     - Break duration
     - Approval status
     - Photos
     - Location data

4. **Filter and Search**
   - Select month
   - Search by date
   - Filter by status

---

### **📊 Reports and Analytics**

**Access**: Team Management → Reports section (or Analytics tab)

**Available Reports:**
- **Team Summary**: Overall team statistics
- **Individual Reports**: Per-employee detailed reports
- **Monthly Reports**: Month-wise analysis
- **Overtime Reports**: Overtime tracking
- **Attendance Rate**: Percentage calculations

**Export Options:**
- **Excel**: `.xlsx` format with charts
- **PDF**: Formatted reports
- **CSV**: Raw data for analysis

**How to Generate:**
1. Select date range
2. Choose employees (all or specific)
3. Select report type
4. Click "Generate Report"
5. Download in preferred format

---

## 🔐 **PERMISSIONS**

### **Employee Permissions:**
- ✅ View own attendance
- ✅ Check in/out
- ✅ View own history
- ✅ View own analytics
- ✅ Manage own notifications
- ❌ Cannot approve/reject
- ❌ Cannot view other employees

### **Employer/Manager Permissions:**
- ✅ View all team attendance
- ✅ Approve/reject attendance
- ✅ View team analytics
- ✅ Generate reports
- ✅ Export data
- ✅ View employee photos
- ✅ View location data

---

## 📱 **MOBILE USAGE**

### **For Employees:**
- ✅ All features work on mobile
- ✅ Location access required
- ✅ Camera access required
- ✅ Responsive design

### **For Employers:**
- ✅ View and approve on mobile
- ✅ Team management accessible
- ✅ Reports viewable
- ✅ Bulk actions work

---

## ⚠️ **TROUBLESHOOTING**

### **Common Issues:**

#### **1. "Location Required" Error**
- **Solution**: 
  - Allow location in browser settings
  - Check GPS is enabled
  - Refresh page and try again

#### **2. Camera Not Opening**
- **Solution**:
  - Allow camera permission
  - Check browser settings
  - Try different browser
  - Ensure device has camera

#### **3. Can't Check In**
- **Solution**:
  - Ensure logged in
  - Check if already checked in
  - Verify employee record exists
  - Contact manager

#### **4. Approval Not Showing**
- **Solution**:
  - Verify manager/employer role
  - Check company assignment
  - Refresh page
  - Check filter settings

#### **5. Break Not Tracking**
- **Solution**:
  - Must be checked in first
  - Click "Start Break" before leaving
  - Click "End Break" when returning
  - Check if already checked out

---

## 💡 **BEST PRACTICES**

### **For Employees:**
1. ✅ Check in before 9 AM
2. ✅ Always use break buttons
3. ✅ Review history weekly
4. ✅ Enable notifications
5. ✅ Report issues immediately

### **For Employers:**
1. ✅ Review approvals daily
2. ✅ Verify photos and locations
3. ✅ Provide clear rejection reasons
4. ✅ Use bulk actions efficiently
5. ✅ Generate monthly reports
6. ✅ Communicate policies clearly

---

## 📞 **SUPPORT**

**Need Help?**
- Check this guide first
- Review troubleshooting section
- Contact your manager/HR
- Submit support ticket

---

**Quick Links:**
- Employee: `/en/attendance`
- Approval: `/en/employer/attendance-approval`
- Team: `/en/employer/team`

