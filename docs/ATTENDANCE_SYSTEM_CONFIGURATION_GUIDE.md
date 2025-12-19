# ⚙️ Attendance System - Complete Configuration Guide

## 🎯 Overview

This guide walks you through the complete setup and configuration of the Professional Attendance System for employers and employees. Follow these steps in order to ensure everything works properly.

---

## 📋 **PREREQUISITES**

Before starting, ensure you have:
- ✅ Admin, Manager, or Employer role
- ✅ Company created in the system
- ✅ Database migrations applied
- ✅ Supabase configured
- ✅ Storage bucket for attendance photos created

---

## 🗄️ **STEP 1: Database Setup**

### **1.1 Run Required Migrations**

Ensure these migrations are applied (in order):

```sql
1. 20250111_enhance_attendance_security.sql
   - Creates office_locations table
   - Adds security columns to employee_attendance
   - Creates verification functions

2. 20250111_create_attendance_links.sql
   - Creates attendance_links table
   - Creates attendance_link_usage table

3. 20250112_create_automated_attendance_schedules.sql
   - Creates attendance_link_schedules table
   - Creates scheduled_attendance_links table
   - Creates automation functions

4. 20250112_add_employee_groups_to_schedules.sql
   - Links employee groups to schedules

5. 20250130_create_employer_team_management.sql
   - Creates employee_attendance table structure
   - Creates employee_permissions table

6. 20250131_add_break_tracking.sql
   - Adds break_start_time column
```

**How to Apply:**
```bash
# If using Supabase CLI
supabase migration up

# Or apply manually via Supabase Dashboard → SQL Editor
```

### **1.2 Verify Tables Exist**

Check these tables exist:
- ✅ `employee_attendance`
- ✅ `office_locations`
- ✅ `attendance_links`
- ✅ `attendance_link_schedules`
- ✅ `employee_attendance_groups`
- ✅ `employee_group_assignments`
- ✅ `employer_employees`

### **1.3 Create Storage Bucket**

**For Attendance Photos:**
1. Go to Supabase Dashboard → Storage
2. Create bucket: `attendance-photos`
3. Set to **Public** (or configure RLS policies)
4. Enable file size limits (max 5MB recommended)

---

## 🏢 **STEP 2: Company Setup**

### **2.1 Verify Company Exists**

1. **Check Company:**
   - Navigate to `/en/companies`
   - Ensure your company exists
   - Note the `company_id`

2. **Set Active Company:**
   - Go to Company Switcher (if available)
   - Select your company as active
   - This sets `active_company_id` in your profile

### **2.2 Verify Company Members**

Ensure you have proper role:
- **Admin**: Full access
- **Manager**: Can manage team
- **Employer**: Can manage employees

**Check Role:**
```sql
SELECT role FROM company_members 
WHERE company_id = 'your-company-id' 
AND user_id = 'your-user-id';
```

---

## 📍 **STEP 3: Office Locations Configuration**

### **3.1 Create Office Locations**

**Access:** `/en/employer/attendance-links` → "Office Locations" section

**For Each Office Location:**

1. **Click "Add Office Location"**

2. **Fill in Details:**
   ```
   Name: Grand Mall Muscat
   Address: Grand Mall, Muscat, Oman
   Latitude: 23.6145
   Longitude: 58.5459
   Allowed Radius: 50 meters
   Is Active: ✓ (checked)
   ```

3. **How to Get GPS Coordinates:**
   - **Method 1: Google Maps**
     1. Open Google Maps
     2. Search for your location
     3. Right-click on the exact spot
     4. Click on coordinates (e.g., "23.6145, 58.5459")
     5. Copy latitude and longitude
   
   - **Method 2: GPS Device**
     - Use a GPS device at the location
     - Record coordinates
   
   - **Method 3: Mobile App**
     - Use a GPS app on your phone
     - Stand at the location
     - Record coordinates

4. **Set Radius:**
   - **Small Office**: 25-50 meters
   - **Large Building**: 50-100 meters
   - **Campus**: 100-200 meters
   - **Default**: 50 meters

5. **Click "Save Location"**

**Repeat for all locations:**
- Main Office
- Branch Offices
- Remote Sites
- Client Locations (if applicable)

### **3.2 Verify Office Locations**

**Check via API or Database:**
```sql
SELECT id, name, latitude, longitude, radius_meters, is_active
FROM office_locations
WHERE company_id = 'your-company-id';
```

---

## 👥 **STEP 4: Employee Setup**

### **4.1 Add Employees to Team**

**Access:** `/en/employer/team`

**Steps:**

1. **Click "Add Team Member"**

2. **Search for Employee:**
   - Enter email or name
   - Select from results
   - Employee must exist in system first

3. **Fill Employment Details:**
   ```
   Employee Code: EMP001
   Job Title: Sales Associate
   Department: Sales
   Employment Type: Full Time
   Hire Date: 2024-01-15
   Salary: (optional)
   Work Location: Office
   Company: [Your Company]
   ```

4. **Click "Add to Team"**

5. **Verify:**
   - Employee appears in team list
   - Status shows "Active"
   - Can see in attendance system

### **4.2 Verify Employee Records**

**Check Database:**
```sql
SELECT 
  ee.id,
  ee.employee_id,
  ee.company_id,
  ee.employment_status,
  p.full_name,
  p.email
FROM employer_employees ee
JOIN profiles p ON p.id = ee.employee_id
WHERE ee.company_id = 'your-company-id'
AND ee.employment_status = 'active';
```

**Important:**
- ✅ Employee must have `employment_status = 'active'`
- ✅ Employee must have `company_id` matching your company
- ✅ Employee must have a profile record

---

## 👥 **STEP 5: Employee Groups Configuration**

### **5.1 Create Employee Groups**

**Access:** `/en/employer/attendance-groups`

**Purpose:** Organize employees by location or department

**Steps:**

1. **Click "Create Group"**

2. **Fill Group Details:**
   ```
   Group Name: Grand Mall Muscat Team
   Description: Employees working at Grand Mall location
   Group Type: Location-Based
   Office Location: Grand Mall Muscat
   ```

3. **Assign Employees:**
   - **Option A: All Employees**
     - Select "All Employees" radio button
   
   - **Option B: Selected Employees**
     - Click "Selected" tab
     - Check employees who work at this location
     - Or click "Select All"
   
   - **Option C: By Department**
     - Filter by department
     - Select relevant employees

4. **Click "Create Group"**

5. **Verify:**
   - Group appears in list
   - Employee count shows correctly
   - Employees can be seen in group

### **5.2 Verify Groups**

**Check via API:**
```bash
GET /api/employer/attendance-groups
```

**Expected Response:**
```json
{
  "groups": [
    {
      "id": "...",
      "name": "Grand Mall Muscat Team",
      "group_type": "location",
      "employee_count": 15,
      "employees": [...]
    }
  ]
}
```

---

## ⏰ **STEP 6: Attendance Schedules Configuration**

### **6.1 Create Automated Schedule**

**Access:** `/en/employer/attendance-schedules`

**Steps:**

1. **Click "Create Schedule"**

2. **Basic Settings:**
   ```
   Name: Daily Grand Mall Check-In
   Description: Daily attendance for Grand Mall location
   Is Active: ✓ (MUST be checked)
   ```

3. **Location Settings:**
   ```
   Location Source: Office Location
   Select: Grand Mall Muscat
   Allowed Radius: 50 meters
   ```
   
   **OR Custom Location:**
   ```
   Location Source: Custom Coordinates
   Latitude: 23.6145
   Longitude: 58.5459
   Allowed Radius: 50 meters
   ```

4. **Time Settings:**
   ```
   Check-In Time: 09:00
   Check-Out Time: 17:00 (optional)
   Link Valid Duration: 2 hours
   ```

5. **Schedule Days:**
   ```
   ✓ Monday
   ✓ Tuesday
   ✓ Wednesday
   ✓ Thursday
   ✓ Friday
   ✗ Saturday
   ✗ Sunday
   ```

6. **Employee Assignment:**
   ```
   Assignment Type: Groups
   Select Groups: ✓ Grand Mall Muscat Team
   ```
   
   **OR:**
   ```
   Assignment Type: Selected
   Select Employees: [Choose specific employees]
   ```

7. **Notification Settings:**
   ```
   Send Check-In Link: ✓
   Send Check-Out Link: ✗ (optional)
   Notification Method: Email
   Send Before: 15 minutes
   ```

8. **Advanced Settings:**
   ```
   Max Uses Per Link: 1
   Require Photo: ✓
   Require Location Verification: ✓
   ```

9. **Click "Create Schedule"**

### **6.2 Verify Schedule**

**Check Schedule:**
```sql
SELECT 
  id,
  name,
  is_active,
  check_in_time,
  office_location_id,
  monday, tuesday, wednesday, thursday, friday
FROM attendance_link_schedules
WHERE company_id = 'your-company-id'
AND is_active = true;
```

---

## 🔄 **STEP 7: Cron Job Configuration**

### **7.1 Verify Cron Job**

**Check Cron Endpoint:**
- **URL**: `/api/cron/generate-attendance-links`
- **Method**: GET
- **Authentication**: Should be protected (API key or Vercel Cron)

### **7.2 Configure Vercel Cron (If Using Vercel)**

**Create `vercel.json` or update existing:**

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-attendance-links",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 0 * * *` = Every day at 00:00 UTC (midnight)
- Adjust timezone as needed

### **7.3 Manual Trigger (Testing)**

**Test Cron Job:**
```bash
# Via API
GET /api/cron/generate-attendance-links

# Or via Vercel Dashboard
Vercel Dashboard → Cron Jobs → Run Now
```

**Expected Result:**
- Links generated for today
- Employees receive notifications (if configured)
- Links appear in system

---

## 🔐 **STEP 8: Permissions Configuration**

### **8.1 Verify Employee Permissions**

**Check Employee Can:**
- ✅ Access `/en/attendance`
- ✅ Check in/out
- ✅ View own history
- ✅ View own analytics

**If Issues:**
1. Check `employer_employees` record exists
2. Verify `employment_status = 'active'`
3. Check `company_id` matches
4. Verify user has profile

### **8.2 Verify Employer Permissions**

**Check Employer Can:**
- ✅ Access `/en/employer/attendance-approval`
- ✅ Access `/en/employer/team`
- ✅ Approve/reject attendance
- ✅ View team attendance
- ✅ Create schedules

**If Issues:**
1. Check role in `company_members`
2. Verify `active_company_id` in profile
3. Check RBAC permissions

---

## ✅ **STEP 9: Testing & Verification**

### **9.1 Test Employee Check-In**

**Steps:**
1. Login as employee
2. Go to `/en/attendance`
3. Click "Check In"
4. Allow location
5. Take photo
6. Verify:
   - ✅ Check-in time recorded
   - ✅ Location captured
   - ✅ Photo saved
   - ✅ Status shows "Checked In"
   - ✅ Timer starts

### **9.2 Test Break Management**

**Steps:**
1. While checked in, click "Start Break"
2. Wait a few minutes
3. Click "End Break"
4. Verify:
   - ✅ Break duration calculated
   - ✅ Shown in summary
   - ✅ Excluded from total hours

### **9.3 Test Check-Out**

**Steps:**
1. Click "Check Out"
2. Allow location
3. Take photo
4. Verify:
   - ✅ Check-out time recorded
   - ✅ Total hours calculated
   - ✅ Overtime calculated (if > 8 hours)
   - ✅ Status shows "Checked Out"
   - ✅ Approval status = "pending"

### **9.4 Test Manager Approval**

**Steps:**
1. Login as employer/manager
2. Go to `/en/employer/attendance-approval`
3. See pending record
4. Review details:
   - Employee name
   - Times
   - Photo (click camera icon)
   - Location
5. Click ✅ to approve
6. Verify:
   - ✅ Status changes to "approved"
   - ✅ Employee receives notification
   - ✅ Record moves to approved list

### **9.5 Test Automated Links**

**Steps:**
1. Wait for cron job to run (or trigger manually)
2. Check scheduled links generated:
   ```sql
   SELECT * FROM scheduled_attendance_links
   WHERE scheduled_date = CURRENT_DATE;
   ```
3. Verify links created:
   ```sql
   SELECT * FROM attendance_links
   WHERE id IN (
     SELECT attendance_link_id 
     FROM scheduled_attendance_links
     WHERE scheduled_date = CURRENT_DATE
   );
   ```
4. Test employee can use link:
   - Employee receives link (email/SMS)
   - Opens link
   - Can check in successfully

---

## 🔧 **STEP 10: Advanced Configuration**

### **10.1 Configure Late Detection**

**Default:** Late if check-in after 9:00 AM

**To Change:**
- Modify in `app/api/employee/attendance/route.ts`:
  ```typescript
  const hour = new Date().getHours();
  const status = hour >= 9 ? 'late' : 'present'; // Change 9 to your time
  ```

### **10.2 Configure Overtime Calculation**

**Default:** Overtime if > 8 hours

**To Change:**
- Modify in `app/api/employee/attendance/route.ts`:
  ```typescript
  const overtimeHours = Math.max(0, parseFloat(totalHours) - 8); // Change 8 to your hours
  ```

### **10.3 Configure Notification Times**

**Default:** Reminder 15 minutes before check-in

**To Change:**
- In schedule settings: `send_before_minutes`
- In notification settings: User preferences

### **10.4 Configure Location Verification**

**Strict Mode (Enforce Location):**
- Set `require_location_verification = true` in schedule
- Employees must be within radius to check in

**Flexible Mode (Allow Anywhere):**
- Don't set office locations
- Or set very large radius (e.g., 1000 meters)
- System allows check-in from anywhere

---

## 🐛 **TROUBLESHOOTING**

### **Issue 1: Employees Can't Check In**

**Symptoms:**
- "Not authorized" error
- "No employee record" error

**Solutions:**
1. Verify employee in `employer_employees` table
2. Check `employment_status = 'active'`
3. Verify `company_id` matches
4. Check employee has profile

**SQL Check:**
```sql
SELECT * FROM employer_employees
WHERE employee_id = 'employee-user-id'
AND employment_status = 'active';
```

---

### **Issue 2: Location Verification Failing**

**Symptoms:**
- "Location not verified" error
- Check-in rejected due to location

**Solutions:**
1. Verify office location exists
2. Check coordinates are correct
3. Increase radius if needed
4. Verify employee's GPS is accurate

**Test Location:**
```sql
SELECT 
  name,
  latitude,
  longitude,
  radius_meters,
  calculate_distance(23.6145, 58.5459, latitude, longitude) as distance
FROM office_locations
WHERE company_id = 'your-company-id'
AND is_active = true;
```

---

### **Issue 3: Automated Links Not Generating**

**Symptoms:**
- No links created daily
- Employees not receiving links

**Solutions:**
1. Check schedule is active (`is_active = true`)
2. Verify cron job is running
3. Check schedule days match today
4. Verify employee assignment
5. Check notification settings

**Manual Trigger:**
```bash
GET /api/cron/generate-attendance-links
```

**Check Schedule:**
```sql
SELECT 
  name,
  is_active,
  check_in_time,
  monday, tuesday, wednesday, thursday, friday
FROM attendance_link_schedules
WHERE company_id = 'your-company-id';
```

---

### **Issue 4: Manager Can't Approve**

**Symptoms:**
- "Permission denied" error
- Approval page empty

**Solutions:**
1. Verify manager role in `company_members`
2. Check `active_company_id` in profile
3. Verify company matches employee's company
4. Check RBAC permissions

**Check Permissions:**
```sql
SELECT role FROM company_members
WHERE company_id = 'your-company-id'
AND user_id = 'manager-user-id';
```

---

### **Issue 5: Photos Not Uploading**

**Symptoms:**
- Photo capture works but not saved
- "Photo upload failed" error

**Solutions:**
1. Verify storage bucket exists: `attendance-photos`
2. Check bucket permissions (public or RLS)
3. Verify file size limits
4. Check Supabase storage configuration

**Test Storage:**
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'attendance-photos';
```

---

## 📊 **VERIFICATION CHECKLIST**

Use this checklist to verify your setup:

### **Database:**
- [ ] All migrations applied
- [ ] Tables exist and have correct structure
- [ ] Storage bucket created
- [ ] Functions created (calculate_distance, verify_attendance_location)

### **Company:**
- [ ] Company exists in system
- [ ] Active company set in profile
- [ ] Company members have proper roles

### **Office Locations:**
- [ ] At least one office location created
- [ ] Coordinates are accurate
- [ ] Radius is appropriate
- [ ] Location is active

### **Employees:**
- [ ] Employees added to team
- [ ] Employment status = 'active'
- [ ] Company ID matches
- [ ] Employees can access attendance page

### **Groups:**
- [ ] Employee groups created
- [ ] Employees assigned to groups
- [ ] Groups linked to office locations

### **Schedules:**
- [ ] At least one schedule created
- [ ] Schedule is active
- [ ] Check-in time configured
- [ ] Days selected correctly
- [ ] Employees/groups assigned

### **Cron Job:**
- [ ] Cron job configured
- [ ] Can trigger manually
- [ ] Links generate successfully
- [ ] Notifications sent (if configured)

### **Permissions:**
- [ ] Employees can check in/out
- [ ] Employers can approve
- [ ] Managers can view team
- [ ] All roles have correct access

### **Testing:**
- [ ] Employee can check in
- [ ] Employee can check out
- [ ] Break tracking works
- [ ] Manager can approve
- [ ] Bulk approval works
- [ ] Location verification works
- [ ] Photos save correctly
- [ ] Notifications work

---

## 🎯 **QUICK CONFIGURATION SUMMARY**

**Minimum Setup (5 Steps):**

1. ✅ **Run Migrations** - Apply database migrations
2. ✅ **Create Office Location** - Add at least one location
3. ✅ **Add Employees** - Add employees to team
4. ✅ **Create Schedule** - Set up automated schedule
5. ✅ **Test** - Verify check-in/approval works

**Full Setup (10 Steps):**

1. ✅ Database setup
2. ✅ Company setup
3. ✅ Office locations
4. ✅ Employee setup
5. ✅ Employee groups
6. ✅ Attendance schedules
7. ✅ Cron job configuration
8. ✅ Permissions
9. ✅ Testing
10. ✅ Advanced configuration

---

## 📞 **SUPPORT**

**If you encounter issues:**
1. Check this guide
2. Review troubleshooting section
3. Check database logs
4. Verify API responses
5. Contact support

---

## 📚 **RELATED DOCUMENTATION**

- **User Guide**: `ATTENDANCE_SYSTEM_USER_GUIDE.md`
- **Usage Guide**: `ATTENDANCE_SYSTEM_USAGE.md`
- **Quick Start**: `ATTENDANCE_QUICK_START.md`
- **How It Works**: `HOW_IT_WORKS_ATTENDANCE_SCHEDULES.md`

---

**Last Updated**: January 2025
**Version**: 1.0.0

