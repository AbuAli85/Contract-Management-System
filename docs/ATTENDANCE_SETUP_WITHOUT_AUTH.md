# 🔧 Attendance Setup Without Authentication

## Problem

When running SQL scripts in Supabase SQL Editor, `auth.uid()` may not work because:
- The SQL Editor doesn't have your authentication context
- You need to be logged in via the Supabase Dashboard

## Solution

Use the **company-specific setup script** that doesn't require authentication:

### **File: `scripts/setup-attendance-digital-morph.sql`**

This script:
- ✅ Uses your company ID directly (no `auth.uid()` needed)
- ✅ Works in Supabase SQL Editor without authentication
- ✅ Pre-configured for Digital Morph

---

## 🚀 Quick Setup Steps

### **Step 1: Get Your Office Coordinates**

1. Open [Google Maps](https://maps.google.com)
2. Search for **"Muscat Grand Mall, Oman"**
3. Right-click on the exact location
4. Click the coordinates (e.g., "23.6145, 58.5459")
5. Copy **latitude** and **longitude**

### **Step 2: Update the Script**

Open `scripts/setup-attendance-digital-morph.sql` and update:

```sql
-- Line ~45: Update office name
'Muscat Grand Mall Office',  -- Your office name

-- Line ~46: Update address
'Muscat Grand Mall, Muscat, Oman',  -- Your address

-- Line ~47-48: Update coordinates ⬅️ IMPORTANT
23.6145,  -- Your latitude (from Google Maps)
58.5459,  -- Your longitude (from Google Maps)

-- Line ~49: Update radius (optional)
50,  -- Radius in meters (50m = ~164 feet)

-- Line ~120: Update check-in time
'09:00:00'::TIME,  -- Your check-in time (24-hour format)
```

### **Step 3: Run the Script**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the entire script from `scripts/setup-attendance-digital-morph.sql`
3. Paste into SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)

### **Step 4: Verify Setup**

The script will show:
- ✅ Office location created
- ✅ Employee count
- ✅ Employee group created
- ✅ Attendance schedule created

---

## 📋 Alternative: Manual Setup

If you prefer to set up manually, use these queries:

### **1. Create Office Location**

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
  'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID,  -- Digital Morph
  'Muscat Grand Mall Office',
  'Muscat Grand Mall, Muscat, Oman',
  23.6145,  -- UPDATE: Your latitude
  58.5459,  -- UPDATE: Your longitude
  50,
  true
);
```

### **2. Create Employee Group**

```sql
INSERT INTO employee_attendance_groups (
  company_id,
  name,
  group_type,
  office_location_id
)
SELECT 
  'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID,
  'Muscat Grand Mall Team',
  'location',
  id
FROM office_locations
WHERE company_id = 'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID
  AND name = 'Muscat Grand Mall Office'
LIMIT 1;
```

### **3. Create Attendance Schedule**

```sql
INSERT INTO attendance_link_schedules (
  company_id,
  name,
  description,
  is_active,
  office_location_id,
  check_in_time,
  link_valid_duration_hours,
  monday, tuesday, wednesday, thursday, friday, saturday, sunday,
  send_check_in_link,
  notification_method,
  send_before_minutes,
  send_to_all_employees,
  require_photo,
  require_location_verification
)
SELECT 
  'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID,
  'Daily Office Check-In',
  'Automated daily attendance for Muscat Grand Mall office',
  true,
  id,
  '09:00:00'::TIME,
  2,
  true, true, true, true, true, false, false,
  true,
  ARRAY['email']::TEXT[],
  15,
  true,
  true,
  true
FROM office_locations
WHERE company_id = 'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID
  AND name = 'Muscat Grand Mall Office'
LIMIT 1;
```

---

## ✅ Verification Queries

After setup, run these to verify:

```sql
-- Check office location
SELECT * FROM office_locations 
WHERE company_id = 'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID;

-- Check employee group
SELECT * FROM employee_attendance_groups 
WHERE company_id = 'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID;

-- Check schedule
SELECT * FROM attendance_link_schedules 
WHERE company_id = 'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID;
```

---

## 🔍 Troubleshooting

### **"Company not found"**
- Verify the company ID: `e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7`
- Check if the company exists: `SELECT * FROM companies WHERE id = 'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID;`

### **"No employees found"**
- Add employees via: `/en/employer/team`
- Ensure `employment_status = 'active'`

### **"Office location not found"**
- Check the office name matches in the script
- Verify coordinates are correct

---

## 📚 Related Documentation

- **Quick Setup Guide**: `ATTENDANCE_QUICK_SETUP_ACTIVE_COMPANY.md`
- **Full Configuration**: `ATTENDANCE_SYSTEM_CONFIGURATION_GUIDE.md`
- **User Guide**: `ATTENDANCE_SYSTEM_USER_GUIDE.md`

---

**Ready to set up?** Use `scripts/setup-attendance-digital-morph.sql` and update the coordinates! 🚀

