# 🚀 Quick Setup: Attendance for Your Active Company

## ✅ **Your Active Company**

Based on your profile, your active company is:
- **Company**: Digital Morph
- **Company ID**: `e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7`

---

## 📋 **Quick Setup (3 Steps)**

### **Step 1: Get Your Office Coordinates**

1. Open [Google Maps](https://maps.google.com)
2. Search for your office address
3. Right-click on the exact location
4. Click the coordinates (e.g., "23.6145, 58.5459")
5. Copy **latitude** and **longitude**

**Example for Muscat, Oman:**
- Latitude: `23.6145`
- Longitude: `58.5459`

---

### **Step 2: Run the Setup Script**

1. Open Supabase SQL Editor
2. Run: `scripts/setup-attendance-active-company.sql`
3. **Update these values in the script:**
   ```sql
   'Main Office',              -- Your office name
   'Your Office Address',      -- Your address
   24.7136,                    -- Your latitude
   46.6753,                    -- Your longitude
   50,                         -- Radius in meters
   '09:00:00'::TIME,           -- Check-in time
   ```

---

### **Step 3: Verify Setup**

After running the script, verify everything was created:

```sql
-- Check office location
SELECT * FROM office_locations 
WHERE company_id = (SELECT active_company_id FROM profiles WHERE id = auth.uid());

-- Check employee group
SELECT * FROM employee_attendance_groups 
WHERE company_id = (SELECT active_company_id FROM profiles WHERE id = auth.uid());

-- Check schedule
SELECT * FROM attendance_link_schedules 
WHERE company_id = (SELECT active_company_id FROM profiles WHERE id = auth.uid());
```

---

## 🎯 **What Gets Created**

✅ **Office Location** - Physical location for check-ins  
✅ **Employee Group** - Groups employees by location  
✅ **Attendance Schedule** - Automated daily link generation

---

## 📝 **Next Steps After Setup**

1. **Assign Employees to Group**
   - Go to: `/en/employer/attendance-groups`
   - Add employees to the "Main Office Team" group

2. **Test Check-In**
   - Go to: `/en/attendance`
   - Try checking in as an employee

3. **Test Approval**
   - Go to: `/en/employer/attendance-approval`
   - Review and approve attendance records

4. **Verify Cron Job**
   - Check if `/api/cron/generate-attendance-links` is running
   - Should run daily at 00:00 UTC

---

## 🔧 **Troubleshooting**

### **"No active company found"**
```sql
-- Set your active company
UPDATE profiles 
SET active_company_id = 'e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7'::UUID
WHERE id = auth.uid();
```

### **"No employees found"**
- Add employees via: `/en/employer/team`
- Ensure `employment_status = 'active'`

### **"Office location not found"**
- Check the office name matches in the script
- Verify coordinates are correct

---

## 📚 **Full Documentation**

- **Complete Guide**: `ATTENDANCE_SYSTEM_CONFIGURATION_GUIDE.md`
- **User Guide**: `ATTENDANCE_SYSTEM_USER_GUIDE.md`
- **Quick Start**: `ATTENDANCE_QUICK_START.md`

---

**Ready to set up?** Run `scripts/setup-attendance-active-company.sql` and update the coordinates! 🚀

