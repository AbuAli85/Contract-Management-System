# ⚙️ Attendance System - Step-by-Step Configuration

## 🎯 **COMPLETE SETUP GUIDE**

Follow these steps in order to configure the attendance system properly.

---

## 📋 **STEP 1: Database Preparation**

### **1.1 Apply Migrations**

Run these migrations in order (via Supabase Dashboard → SQL Editor):

1. ✅ `20250111_enhance_attendance_security.sql`
2. ✅ `20250111_create_attendance_links.sql`
3. ✅ `20250112_create_automated_attendance_schedules.sql`
4. ✅ `20250112_add_employee_groups_to_schedules.sql`
5. ✅ `20250130_create_employer_team_management.sql`
6. ✅ `20250131_add_break_tracking.sql`

**How to Apply:**
```bash
# Option 1: Supabase CLI
supabase migration up

# Option 2: Manual (Supabase Dashboard)
# Go to SQL Editor → Run each migration file
```

### **1.2 Create Storage Bucket**

1. Go to **Supabase Dashboard → Storage**
2. Click **"New Bucket"**
3. Name: `attendance-photos`
4. Set to **Public** (or configure RLS)
5. Max file size: 5MB
6. Click **"Create Bucket"**

---

## 🏢 **STEP 2: Company Setup**

### **2.1 Verify Company Exists**

1. **Check Company:**
   - Go to `/en/companies`
   - Find your company
   - Note the `company_id` (you'll need this)

2. **Set Active Company:**
   - Use company switcher (if available)
   - Or update profile: `UPDATE profiles SET active_company_id = 'your-company-id' WHERE id = 'your-user-id';`

### **2.2 Verify Your Role**

**Check Role:**
```sql
SELECT role FROM company_members 
WHERE company_id = 'your-company-id' 
AND user_id = 'your-user-id';
```

**Should be one of:**
- `admin` - Full access
- `manager` - Can manage team
- `employer` - Can manage employees

**If Missing:**
```sql
INSERT INTO company_members (company_id, user_id, role, status)
VALUES ('your-company-id', 'your-user-id', 'admin', 'active');
```

---

## 📍 **STEP 3: Create Office Locations**

### **3.1 Get GPS Coordinates**

**Method 1: Google Maps (Easiest)**
1. Open [Google Maps](https://maps.google.com)
2. Search for your office address
3. Right-click on the exact location
4. Click on the coordinates (e.g., "23.6145, 58.5459")
5. Copy **latitude** and **longitude**

**Method 2: Mobile GPS**
1. Use GPS app on phone
2. Stand at the office location
3. Record coordinates

### **3.2 Create Office Location**

**Option A: Via UI (Recommended)**
1. Go to `/en/employer/attendance-links`
2. Find "Office Locations" section
3. Click "Add Office Location"
4. Fill in:
   ```
   Name: Main Office
   Address: 123 Business Street, City, Country
   Latitude: [from Google Maps]
   Longitude: [from Google Maps]
   Allowed Radius: 50 meters
   Is Active: ✓
   ```
5. Click "Save"

**Option B: Via SQL**
```sql
INSERT INTO office_locations (
  company_id,
  name,
  address,
  latitude,
  longitude,
  radius_meters,
  is_active
) VALUES (
  'your-company-id',  -- Get from companies table
  'Main Office',
  'Your Office Address',
  24.7136,  -- Your latitude
  46.6753,  -- Your longitude
  50,  -- Radius in meters
  true
);
```

### **3.3 Verify Location**

```sql
SELECT * FROM office_locations 
WHERE company_id = 'your-company-id';
```

---

## 👥 **STEP 4: Add Employees to Team**

### **4.1 Add Employees**

1. Go to `/en/employer/team`
2. Click **"Add Team Member"**
3. Search for employee by email/name
4. Fill employment details:
   ```
   Employee Code: EMP001
   Job Title: Sales Associate
   Department: Sales
   Employment Type: Full Time
   Hire Date: [date]
   Company: [your company]
   ```
5. Click **"Add to Team"**

### **4.2 Verify Employee Records**

**Check:**
```sql
SELECT 
  ee.id,
  p.full_name,
  p.email,
  ee.company_id,
  ee.employment_status
FROM employer_employees ee
JOIN profiles p ON p.id = ee.employee_id
WHERE ee.company_id = 'your-company-id'
AND ee.employment_status = 'active';
```

**Important:**
- ✅ `employment_status` must be `'active'`
- ✅ `company_id` must match your company
- ✅ Employee must have profile record

---

## 👥 **STEP 5: Create Employee Groups**

### **5.1 Create Group**

1. Go to `/en/employer/attendance-groups`
2. Click **"Create Group"**
3. Fill in:
   ```
   Group Name: Main Office Team
   Description: Employees at main office
   Group Type: Location-Based
   Office Location: Main Office
   ```
4. **Assign Employees:**
   - Select "Selected" tab
   - Check employees
   - Or "Select All"
5. Click **"Create Group"**

### **5.2 Verify Group**

**Check:**
```sql
SELECT 
  id,
  name,
  group_type,
  employee_count
FROM employee_attendance_groups
WHERE company_id = 'your-company-id';
```

---

## ⏰ **STEP 6: Create Attendance Schedule**

### **6.1 Create Schedule**

1. Go to `/en/employer/attendance-schedules`
2. Click **"Create Schedule"**
3. **Basic Settings:**
   ```
   Name: Daily Office Check-In
   Description: Daily attendance for main office
   Is Active: ✓ (MUST be checked!)
   ```
4. **Location:**
   ```
   Location Source: Office Location
   Select: Main Office
   Radius: 50 meters
   ```
5. **Time Settings:**
   ```
   Check-In Time: 09:00
   Link Valid Duration: 2 hours
   ```
6. **Days:**
   ```
   ✓ Monday
   ✓ Tuesday
   ✓ Wednesday
   ✓ Thursday
   ✓ Friday
   ✗ Saturday
   ✗ Sunday
   ```
7. **Employee Assignment:**
   ```
   Assignment Type: Groups
   Select: ✓ Main Office Team
   ```
8. **Notifications:**
   ```
   Send Check-In Link: ✓
   Notification Method: Email
   Send Before: 15 minutes
   ```
9. **Advanced:**
   ```
   Max Uses: 1
   Require Photo: ✓
   Require Location: ✓
   ```
10. Click **"Create Schedule"**

### **6.2 Verify Schedule**

**Check:**
```sql
SELECT 
  id,
  name,
  is_active,
  check_in_time,
  monday, tuesday, wednesday, thursday, friday
FROM attendance_link_schedules
WHERE company_id = 'your-company-id'
AND is_active = true;
```

**Important:**
- ✅ `is_active` must be `true`
- ✅ At least one day must be `true`
- ✅ Check-in time must be set

---

## 🔄 **STEP 7: Configure Cron Job**

### **7.1 Vercel Cron (If Using Vercel)**

**Update `vercel.json`:**
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

**Schedule:**
- `0 0 * * *` = Every day at 00:00 UTC
- Adjust timezone as needed

### **7.2 External Cron (Alternative)**

**Set up external cron service:**
- URL: `https://your-domain.com/api/cron/generate-attendance-links`
- Schedule: Daily at 00:00 UTC
- Method: GET
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

### **7.3 Test Cron Job**

**Manual Trigger:**
```bash
# Via browser or curl
GET /api/cron/generate-attendance-links

# Or via Vercel Dashboard
Vercel → Cron Jobs → Run Now
```

**Expected Result:**
- Links generated for today
- Employees receive notifications
- Links appear in system

---

## ✅ **STEP 8: Testing**

### **8.1 Test Employee Check-In**

1. **Login as Employee**
2. Go to `/en/attendance`
3. Click **"Check In"**
4. Allow location
5. Take photo
6. **Verify:**
   - ✅ Check-in time recorded
   - ✅ Location captured
   - ✅ Photo saved
   - ✅ Status = "Checked In"

### **8.2 Test Manager Approval**

1. **Login as Employer/Manager**
2. Go to `/en/employer/attendance-approval`
3. See pending record
4. Review details
5. Click ✅ to approve
6. **Verify:**
   - ✅ Status = "Approved"
   - ✅ Employee notified

### **8.3 Test Automated Links**

1. **Wait for cron** (or trigger manually)
2. **Check links generated:**
   ```sql
   SELECT * FROM scheduled_attendance_links
   WHERE scheduled_date = CURRENT_DATE;
   ```
3. **Employee receives link** (email/SMS)
4. **Employee uses link** to check in
5. **Verify:** Check-in successful

---

## 🔧 **STEP 9: Common Configuration Issues**

### **Issue: Employees Can't Check In**

**Check:**
1. Employee in `employer_employees` table?
2. `employment_status = 'active'`?
3. `company_id` matches?
4. Employee has profile?

**Fix:**
```sql
-- Update employee company
UPDATE employer_employees
SET company_id = 'correct-company-id'
WHERE employee_id = 'employee-user-id';

-- Activate employee
UPDATE employer_employees
SET employment_status = 'active'
WHERE id = 'employee-record-id';
```

### **Issue: Location Verification Failing**

**Check:**
1. Office location exists?
2. Coordinates correct?
3. Radius appropriate?

**Fix:**
```sql
-- Update location coordinates
UPDATE office_locations
SET latitude = 24.7136, longitude = 46.6753
WHERE id = 'location-id';

-- Increase radius
UPDATE office_locations
SET radius_meters = 100
WHERE id = 'location-id';
```

### **Issue: Automated Links Not Generating**

**Check:**
1. Schedule active?
2. Cron job running?
3. Today is scheduled day?

**Fix:**
```sql
-- Activate schedule
UPDATE attendance_link_schedules
SET is_active = true
WHERE id = 'schedule-id';

-- Check schedule days
SELECT monday, tuesday, wednesday, thursday, friday
FROM attendance_link_schedules
WHERE id = 'schedule-id';
```

---

## 📊 **VERIFICATION QUERIES**

Run these to verify your setup:

```sql
-- 1. Check office locations
SELECT * FROM office_locations 
WHERE company_id = 'your-company-id';

-- 2. Check employees
SELECT COUNT(*) FROM employer_employees 
WHERE company_id = 'your-company-id' 
AND employment_status = 'active';

-- 3. Check groups
SELECT * FROM employee_attendance_groups 
WHERE company_id = 'your-company-id';

-- 4. Check schedules
SELECT * FROM attendance_link_schedules 
WHERE company_id = 'your-company-id' 
AND is_active = true;

-- 5. Check today's links (if cron ran)
SELECT * FROM scheduled_attendance_links 
WHERE scheduled_date = CURRENT_DATE;
```

---

## 🎯 **QUICK SETUP (5 Steps)**

**Minimum Configuration:**

1. ✅ **Run Migrations** - Apply database migrations
2. ✅ **Create Office Location** - Add at least one location
3. ✅ **Add Employees** - Add employees to team
4. ✅ **Create Schedule** - Set up automated schedule (optional)
5. ✅ **Test** - Verify check-in/approval works

**For Automated Daily Links:**

1. ✅ Create office location
2. ✅ Add employees
3. ✅ Create employee group
4. ✅ Create schedule (set `is_active = true`)
5. ✅ Configure cron job

---

## 📚 **NEXT STEPS**

After configuration:
1. ✅ Test employee check-in
2. ✅ Test manager approval
3. ✅ Verify automated links (wait for cron)
4. ✅ Train employees
5. ✅ Train managers
6. ✅ Monitor for first week

---

## 📞 **SUPPORT**

**Configuration Issues?**
1. Check this guide
2. Review troubleshooting section
3. Check database logs
4. Verify API responses
5. Contact support

---

**Configuration Date**: _______________
**Configured By**: _______________
**Company**: _______________

