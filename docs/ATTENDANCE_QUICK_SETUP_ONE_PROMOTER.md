# ⚡ Quick Setup: Attendance for One Promoter

**Date:** February 2025  
**Status:** ✅ Ready to Use

---

## 🚀 **5-MINUTE SETUP**

### **Step 1: Run Setup Script** (2 minutes)

1. Open **Supabase SQL Editor**
2. Open `scripts/setup-attendance-for-one-promoter.sql`
3. **Update these variables:**
   ```sql
   v_promoter_email TEXT := 'promoter@example.com'; -- UPDATE THIS
   v_company_name TEXT := 'Your Company Name'; -- UPDATE THIS
   v_location_name TEXT := 'Work Location Name'; -- UPDATE THIS
   v_location_lat DECIMAL(10, 8) := 23.6145; -- UPDATE THIS
   v_location_lng DECIMAL(11, 8) := 58.5459; -- UPDATE THIS
   v_check_in_time TIME := '09:00:00'; -- UPDATE THIS
   v_check_out_time TIME := '17:00:00'; -- UPDATE THIS
   ```
4. **Run the script**
5. **Copy the check-in link** from the output

### **Step 2: Share Link with Employee** (1 minute)

Send the link to the employee via:
- ✅ Email
- ✅ SMS
- ✅ WhatsApp
- ✅ QR Code

**Link Format:**
```
https://portal.thesmartpro.io/en/attendance/check-in/ABC123
```

### **Step 3: Employee Checks In** (1 minute)

1. Employee opens link
2. Takes selfie photo
3. Clicks "Check In"
4. ✅ Done!

### **Step 4: Review & Approve** (1 minute)

1. Go to **Team Management** → **Attendance Approval**
2. Review attendance record
3. Click **"Approve"** or **"Reject"**
4. ✅ Done!

---

## 📊 **GENERATE CLIENT REPORT**

1. Go to **Team Management** → **Attendance** → **Reports**
2. Select employee
3. Choose date range
4. Click **"Generate Report"**
5. Click **"Export PDF"**
6. Share with client

---

## ⚙️ **CONFIGURE SETTINGS**

1. Go to **Team Management** → **Attendance** → **Settings**
2. Configure:
   - Check-in requirements
   - Approval settings
   - Link settings
   - Notifications
   - Reports
3. Click **"Save Settings"**

---

## ✅ **VERIFICATION**

After setup, verify:
- [ ] Employee receives check-in link
- [ ] Employee can check in successfully
- [ ] Location is verified
- [ ] Photo is captured
- [ ] Attendance record appears
- [ ] You can approve/reject
- [ ] Report can be generated

---

## 🔗 **QUICK LINKS**

- **Full Guide:** `docs/ATTENDANCE_SETUP_FOR_ONE_PROMOTER.md`
- **Setup Script:** `scripts/setup-attendance-for-one-promoter.sql`
- **Team Management:** `/en/employer/team`
- **Attendance Approval:** `/en/employer/team` → Attendance Approval tab
- **Reports:** `/en/employer/team` → Attendance → Reports tab
- **Settings:** `/en/employer/team` → Attendance → Settings tab

---

**That's it! Your attendance system is ready! 🎉**

