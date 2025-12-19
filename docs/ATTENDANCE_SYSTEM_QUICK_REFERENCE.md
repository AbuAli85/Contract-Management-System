# 🚀 Attendance System - Quick Reference

## 📍 **QUICK ACCESS**

### **For Employees**
- **Dashboard**: `/en/attendance`
- **Check-In via Link**: `/en/attendance/check-in/[code]`

### **For Employers**
- **Attendance Dashboard**: `/en/employer/attendance-approval`
- **Team Management**: `/en/employer/team`
- **Attendance Groups**: `/en/employer/attendance-groups`

---

## ⚡ **QUICK ACTIONS**

### **Employee Check-In**
1. Go to `/en/attendance`
2. Click "Check In" (green button)
3. Allow location & camera
4. Capture photo
5. Confirm

### **Employer Approval**
1. Go to `/en/employer/attendance-approval`
2. Click "Approval" tab
3. Review pending records
4. Click ✅ to approve or ❌ to reject

### **Export Data**
1. Go to `/en/employer/attendance-approval`
2. Click "Reports" tab
3. Click "Export to CSV"
4. Download file

---

## 🔧 **SETUP (One-Time)**

### **1. Run Setup Script**
```sql
-- In Supabase SQL Editor
scripts/setup-attendance-digital-morph.sql
```

### **2. Update Coordinates**
- Get from Google Maps
- Update in script (lines 47-48)

### **3. Assign Employees**
- Go to `/en/employer/attendance-groups`
- Add employees to groups

---

## 🧠 **SMART FEATURES**

### **Auto-Detection**
- ✅ Late check-ins
- ✅ Missing check-ins
- ✅ Frequent patterns
- ✅ Location issues

### **Alerts**
- Real-time updates
- Severity levels
- Actionable insights

---

## 📊 **KEY STATS**

### **Employee Dashboard Shows**
- Today's attendance status
- Working hours timer
- Break duration
- Monthly summary

### **Employer Dashboard Shows**
- Total employees
- Checked in today
- Pending approvals
- Late arrivals
- Average hours
- Overtime totals

---

## 🔄 **AUTOMATION**

### **Cron Job**
- **Runs**: Daily at 00:00 UTC
- **Function**: Generates attendance links
- **Status**: ✅ Configured in `vercel.json`

### **Auto-Refresh**
- Dashboard: Every 30 seconds
- Real-time updates
- No manual refresh needed

---

## ✅ **TROUBLESHOOTING**

### **"No active company found"**
- Set active company in profile
- Or use company-specific setup script

### **"Location not captured"**
- Check browser permissions
- Ensure HTTPS (required for geolocation)

### **"Camera not working"**
- Check browser permissions
- Verify `Permissions-Policy: camera=(self)` in headers

### **"Cron job not running"**
- Check `vercel.json` has cron configuration
- Verify CRON_SECRET in environment variables
- Test manually: `GET /api/cron/generate-attendance-links`

---

## 📞 **SUPPORT**

- **Documentation**: See `docs/ATTENDANCE_*.md` files
- **Setup Guide**: `ATTENDANCE_SETUP_WITHOUT_AUTH.md`
- **User Guide**: `ATTENDANCE_SYSTEM_USER_GUIDE.md`

---

**🎯 Everything is ready! Start using the system now.**

