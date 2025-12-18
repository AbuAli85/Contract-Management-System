# How the Automated Attendance Schedule System Works

## 🎯 Overview

The system automatically generates and sends location-restricted attendance check-in links to employees on a daily basis, organized by groups and locations.

---

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ATTENDANCE SCHEDULE SYSTEM                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. EMPLOYEE GROUPS                                         │
│     └─ Organize employees by location/department           │
│                                                              │
│  2. ATTENDANCE SCHEDULES                                    │
│     └─ Define when/where/for whom links are generated       │
│                                                              │
│  3. DAILY CRON JOB                                          │
│     └─ Automatically generates links every day              │
│                                                              │
│  4. LINK DISTRIBUTION                                       │
│     └─ Sends links to employees via email/SMS              │
│                                                              │
│  5. EMPLOYEE CHECK-IN                                       │
│     └─ Employees use links to check in at location         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow

### **Phase 1: Setup (One-Time Configuration)**

#### **Step 1: Create Office Locations**
```
Manager → HR Management → Office Locations
- Add "Grand Mall Muscat"
- Add "City Center Muscat"
- Add "Al Mouj Mall"
```

#### **Step 2: Create Employee Groups**
```
Manager → HR Management → Employee Groups
- Create "Grand Mall Muscat Team" (Location-Based)
- Create "City Center Muscat Team" (Location-Based)
- Create "Sales Department" (Department-Based)
```

**What Happens:**
- System creates group records in `employee_attendance_groups` table
- Groups can be linked to office locations
- Groups can have default check-in/check-out times

#### **Step 3: Assign Employees to Groups**
```
Manager → Employee Groups → Select Group → Assign Employees
- Assign 15 employees to "Grand Mall Muscat Team"
- Assign 8 employees to "City Center Muscat Team"
- Assign 20 employees to "Sales Department"
```

**What Happens:**
- Records created in `employee_group_assignments` table
- Links `employer_employees` to `employee_attendance_groups`
- Employee count updated automatically

#### **Step 4: Create Attendance Schedules**
```
Manager → HR Management → Automated Schedules → Create Schedule
```

**Schedule Configuration:**
```
Name: "Daily Grand Mall Check-In"
Location: Grand Mall Muscat (Office Location)
Assignment Type: Location-Based (or Groups → "Grand Mall Muscat Team")
Check-In Time: 09:00
Check-Out Time: 17:00
Days: Monday-Friday
Notification: Email + SMS, 15 minutes before
Link Valid Duration: 2 hours
```

**What Happens:**
- Schedule record created in `attendance_link_schedules` table
- Stores all configuration (time, location, assignment type)
- Links to employee groups or specific employees

---

### **Phase 2: Daily Automation (Automatic)**

#### **Step 1: Cron Job Triggers (Every Day at 00:00 UTC)**
```
Vercel Cron → /api/cron/generate-attendance-links
```

**What Happens:**
1. System checks all active schedules
2. For each schedule, checks if it should run today:
   - Is schedule active? ✓
   - Is today in the schedule's days (Mon-Fri)? ✓
   - Has it already been generated today? ✗ (if yes, skip)

#### **Step 2: Get Target Employees**
```
For Schedule: "Daily Grand Mall Check-In"
Assignment Type: Location-Based
```

**System Logic:**
```sql
-- If assignment_type = 'location_based'
SELECT employees FROM employee_group_assignments
WHERE group.office_location_id = schedule.office_location_id
AND employee.employment_status = 'active'
```

**Result:**
- Finds all employees in groups linked to "Grand Mall Muscat"
- Returns: 15 employees

#### **Step 3: Generate Attendance Links**
```
For each employee (15 employees):
  1. Generate unique link code (e.g., "ABC123")
  2. Create attendance_link record:
     - link_code: "ABC123"
     - target_latitude: 23.6145
     - target_longitude: 58.5459
     - allowed_radius_meters: 50
     - valid_from: Today 08:45 (15 min before check-in)
     - valid_until: Today 11:00 (2 hours after check-in)
     - max_uses: 1
  3. Record in scheduled_attendance_links table
```

**What Happens:**
- 15 unique links created (one per employee)
- Each link is location-restricted to Grand Mall
- Links are time-restricted (valid only during check-in window)

#### **Step 4: Send Notifications**
```
For each employee (15 employees):
  1. Build notification message:
     "Your check-in link for today: 
      https://portal.thesmartpro.io/attendance/check-in/ABC123
      Valid from 08:45 to 11:00"
  
  2. Send via configured method:
     - Email (if enabled)
     - SMS (if enabled)
  
  3. Update schedule metadata:
     - last_sent_at = NOW()
     - total_notifications_sent += 15
```

**What Happens:**
- Employees receive links 15 minutes before check-in time
- Links are personalized (one per employee)
- System tracks delivery status

---

### **Phase 3: Employee Check-In (Daily)**

#### **Step 1: Employee Receives Link**
```
Employee receives email/SMS at 08:45:
"Your check-in link: https://portal.thesmartpro.io/attendance/check-in/ABC123"
```

#### **Step 2: Employee Opens Link**
```
Employee clicks link → Opens check-in page
```

**System Validates:**
- Is link valid? (not expired, not used)
- Is employee authorized? (belongs to company)
- Is link active? (within valid time window)

#### **Step 3: Employee Checks In**
```
Employee → Check-In Page:
1. System detects location (GPS)
2. Employee takes selfie photo
3. Employee clicks "Check In"
```

**System Processes:**
```sql
1. Verify location:
   - Employee GPS: 23.6145, 58.5459
   - Target location: 23.6145, 58.5459
   - Distance: 5 meters (< 50m radius) ✓
   
2. Create attendance record:
   INSERT INTO employee_attendance (
     employer_employee_id,
     check_in_time,
     latitude,
     longitude,
     check_in_photo,
     approval_status
   )
   
3. Record link usage:
   INSERT INTO attendance_link_usage (
     attendance_link_id,
     employer_employee_id,
     used_at
   )
   
4. Mark link as used:
   UPDATE attendance_links SET current_uses += 1
```

**Result:**
- Attendance record created
- Link marked as used (can't be reused)
- Photo stored in Supabase storage
- Location verified

#### **Step 4: Manager Approval (Optional)**
```
Manager → HR Management → Attendance Approval
- Sees pending attendance records
- Reviews photo and location
- Approves or rejects
```

---

## 🗂️ Database Tables & Relationships

### **Core Tables:**

```
employee_attendance_groups
├─ id (UUID)
├─ company_id (UUID) → companies.id
├─ name (VARCHAR) - "Grand Mall Muscat Team"
├─ group_type (TEXT) - "location", "department", "custom", "project"
├─ office_location_id (UUID) → office_locations.id
└─ employee_count (INTEGER) - Auto-updated

employee_group_assignments
├─ id (UUID)
├─ group_id (UUID) → employee_attendance_groups.id
├─ employer_employee_id (UUID) → employer_employees.id
└─ assigned_at (TIMESTAMPTZ)

attendance_link_schedules
├─ id (UUID)
├─ company_id (UUID) → companies.id
├─ name (VARCHAR) - "Daily Grand Mall Check-In"
├─ office_location_id (UUID) → office_locations.id
├─ check_in_time (TIME) - "09:00"
├─ check_out_time (TIME) - "17:00"
├─ assignment_type (TEXT) - "all", "selected", "groups", "location_based"
├─ employee_group_ids (UUID[]) - Array of group IDs
├─ specific_employee_ids (UUID[]) - Array of employee IDs
├─ monday, tuesday, ... (BOOLEAN)
└─ is_active (BOOLEAN)

attendance_links
├─ id (UUID)
├─ link_code (TEXT) - "ABC123"
├─ target_latitude (DECIMAL)
├─ target_longitude (DECIMAL)
├─ allowed_radius_meters (INTEGER)
├─ valid_from (TIMESTAMPTZ)
├─ valid_until (TIMESTAMPTZ)
└─ current_uses (INTEGER)

scheduled_attendance_links
├─ id (UUID)
├─ schedule_id (UUID) → attendance_link_schedules.id
├─ attendance_link_id (UUID) → attendance_links.id
├─ scheduled_date (DATE)
└─ scheduled_time (TIME)

employee_attendance
├─ id (UUID)
├─ employer_employee_id (UUID) → employer_employees.id
├─ check_in_time (TIMESTAMPTZ)
├─ check_out_time (TIMESTAMPTZ)
├─ latitude (DECIMAL)
├─ longitude (DECIMAL)
├─ check_in_photo (TEXT) - Storage path
└─ approval_status (TEXT) - "pending", "approved", "rejected"
```

---

## 🔀 Assignment Type Logic

### **Type 1: "All Employees"**
```
assignment_type = 'all'
send_to_all_employees = true
```

**Logic:**
```sql
SELECT * FROM employer_employees
WHERE company_id = schedule.company_id
AND employment_status = 'active'
```

**Result:** All active employees receive links

---

### **Type 2: "Selected Employees"**
```
assignment_type = 'selected'
specific_employee_ids = ['uuid1', 'uuid2', 'uuid3']
```

**Logic:**
```sql
SELECT * FROM employer_employees
WHERE id IN (specific_employee_ids)
AND employment_status = 'active'
```

**Result:** Only specified employees receive links

---

### **Type 3: "Groups"**
```
assignment_type = 'groups'
employee_group_ids = ['group-uuid-1', 'group-uuid-2']
```

**Logic:**
```sql
SELECT ee.* FROM employer_employees ee
JOIN employee_group_assignments ega ON ega.employer_employee_id = ee.id
WHERE ega.group_id IN (employee_group_ids)
AND ee.employment_status = 'active'
```

**Result:** All employees in selected groups receive links

---

### **Type 4: "Location-Based"**
```
assignment_type = 'location_based'
office_location_id = 'grand-mall-uuid'
```

**Logic:**
```sql
SELECT ee.* FROM employer_employees ee
JOIN employee_group_assignments ega ON ega.employer_employee_id = ee.id
JOIN employee_attendance_groups eg ON eg.id = ega.group_id
WHERE eg.office_location_id = schedule.office_location_id
AND ee.employment_status = 'active'
```

**Result:** All employees in groups linked to that location receive links

---

## ⚙️ Key Functions

### **1. `get_schedule_employees_enhanced(schedule_id)`**
- Returns list of employees for a schedule
- Handles all assignment types
- Includes employee details (email, phone, name)

### **2. `generate_scheduled_attendance_links(schedule_id)`**
- Generates links for all target employees
- Creates `attendance_links` records
- Records in `scheduled_attendance_links`
- Updates schedule metadata

### **3. `should_schedule_run_today(schedule)`**
- Checks if schedule should run today
- Validates day of week (Monday-Sunday)
- Checks if already generated today

### **4. `auto_create_location_groups(company_id)`**
- Auto-creates groups for office locations
- Links groups to locations
- Useful for initial setup

---

## 📅 Daily Timeline Example

### **Monday, January 15, 2025**

```
00:00 UTC (04:00 Oman Time)
├─ Cron job triggers
├─ Checks all active schedules
├─ Finds "Daily Grand Mall Check-In" (runs Mon-Fri)
└─ Generates 15 links

08:45 Oman Time (15 min before 09:00)
├─ System sends notifications
├─ 15 emails sent
├─ 15 SMS sent (if enabled)
└─ Links are now active

09:00 Oman Time
├─ Check-in window opens
├─ Employees can use links
└─ Links valid until 11:00

09:00 - 11:00
├─ Employees check in
├─ Attendance records created
├─ Photos uploaded
└─ Location verified

11:00 Oman Time
├─ Check-in window closes
├─ Links expire
└─ No more check-ins allowed

17:00 Oman Time (if check-out enabled)
├─ Check-out window opens
└─ Employees can check out
```

---

## 🎯 Real-World Example

### **Scenario: Multi-Location Retail Company**

**Setup:**
- 3 locations: Grand Mall, City Center, Al Mouj
- 50 employees total
- 15 at Grand Mall, 20 at City Center, 15 at Al Mouj

**Groups Created:**
1. "Grand Mall Muscat Team" (15 employees)
2. "City Center Muscat Team" (20 employees)
3. "Al Mouj Mall Team" (15 employees)

**Schedules Created:**
1. "Grand Mall Daily" → Location-Based → Grand Mall
2. "City Center Daily" → Location-Based → City Center
3. "Al Mouj Daily" → Location-Based → Al Mouj

**Daily Flow:**
```
Every morning at 00:00 UTC:
├─ System generates 15 links for Grand Mall employees
├─ System generates 20 links for City Center employees
├─ System generates 15 links for Al Mouj employees
└─ Total: 50 unique links

At 08:45 (15 min before check-in):
├─ 15 emails to Grand Mall team
├─ 20 emails to City Center team
├─ 15 emails to Al Mouj team
└─ Each employee gets their personalized link

At 09:00:
├─ All 50 employees can check in
├─ Each link only works at their assigned location
├─ GPS verification ensures they're on-site
└─ Photo capture provides proof
```

---

## 🔒 Security Features

1. **Location Verification**
   - GPS coordinates required
   - Must be within allowed radius
   - Distance calculated using Haversine formula

2. **Photo Capture**
   - Selfie required for check-in
   - Stored in secure Supabase storage
   - Manager can review photos

3. **Link Security**
   - Unique code per employee per day
   - One-time use (max_uses = 1)
   - Time-restricted (valid_from to valid_until)
   - Location-restricted (GPS verification)

4. **Approval Workflow**
   - All check-ins start as "pending"
   - Manager reviews and approves
   - Can reject with reason

---

## 📊 Monitoring & Analytics

### **Schedule Metrics:**
- `total_links_generated` - How many links created
- `total_notifications_sent` - How many notifications sent
- `last_generated_at` - Last generation timestamp
- `last_sent_at` - Last notification timestamp
- `next_generation_date` - Next scheduled generation

### **Attendance Metrics:**
- Check-in rate per schedule
- Check-in rate per group
- Location accuracy
- Photo submission rate
- Approval rate

---

## 🚀 Benefits

1. **Automation**: No manual link generation needed
2. **Organization**: Groups provide clear structure
3. **Flexibility**: Multiple assignment types
4. **Security**: Location and photo verification
5. **Scalability**: Handles any number of employees
6. **Professional**: Enterprise-grade system
7. **Time-Saving**: Managers set once, system runs daily

---

## 🔧 Troubleshooting

### **Links Not Generated:**
- Check if schedule is active
- Check if today is in schedule's days
- Check cron job is running
- Check schedule has target employees

### **Employees Not Receiving Links:**
- Verify employee is in assigned group
- Check employee employment status is "active"
- Verify notification settings
- Check email/SMS delivery logs

### **Location Verification Failing:**
- Check GPS permissions
- Verify office location coordinates
- Check allowed radius setting
- Ensure employee is on-site

---

This system provides a complete, automated solution for managing employee attendance with location-based verification and professional organization.

