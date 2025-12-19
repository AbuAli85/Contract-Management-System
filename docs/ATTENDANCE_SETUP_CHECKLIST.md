# ✅ Attendance System - Setup Checklist

## 🎯 **QUICK SETUP CHECKLIST**

Use this checklist to ensure your attendance system is properly configured.

---

## 📋 **PRE-SETUP**

- [ ] Database migrations applied
- [ ] Supabase configured
- [ ] Storage bucket `attendance-photos` created
- [ ] Company exists in system
- [ ] You have Admin/Manager/Employer role

---

## 🏢 **COMPANY CONFIGURATION**

- [ ] Company created
- [ ] Active company set in profile
- [ ] Company members have correct roles
- [ ] Company ID noted for reference

---

## 📍 **OFFICE LOCATIONS**

- [ ] At least one office location created
- [ ] Location name and address filled
- [ ] GPS coordinates accurate (verified on map)
- [ ] Allowed radius set (25-100 meters recommended)
- [ ] Location marked as active
- [ ] All work locations added

**Locations Created:**
- [ ] Location 1: ________________
- [ ] Location 2: ________________
- [ ] Location 3: ________________

---

## 👥 **EMPLOYEE SETUP**

- [ ] Employees added to team via Team Management
- [ ] Employment details filled (job title, department, etc.)
- [ ] Employment status = 'active'
- [ ] Company ID matches
- [ ] At least 1 employee can access attendance page

**Employees Added:**
- [ ] Employee 1: ________________
- [ ] Employee 2: ________________
- [ ] Employee 3: ________________

---

## 👥 **EMPLOYEE GROUPS**

- [ ] At least one group created
- [ ] Group name and type set
- [ ] Office location linked to group
- [ ] Employees assigned to group
- [ ] Employee count shows correctly

**Groups Created:**
- [ ] Group 1: ________________
- [ ] Group 2: ________________

---

## ⏰ **ATTENDANCE SCHEDULES**

- [ ] At least one schedule created
- [ ] Schedule name and description filled
- [ ] Office location selected
- [ ] Check-in time set (e.g., 09:00)
- [ ] Schedule days selected (Mon-Fri)
- [ ] Employee assignment configured (groups or selected)
- [ ] Notification settings configured
- [ ] Schedule marked as ACTIVE ✓

**Schedules Created:**
- [ ] Schedule 1: ________________
- [ ] Schedule 2: ________________

---

## 🔄 **AUTOMATION**

- [ ] Cron job endpoint accessible
- [ ] Cron job configured (Vercel or external)
- [ ] Manual trigger tested successfully
- [ ] Links generate for today
- [ ] Notifications sent (if configured)

---

## 🔐 **PERMISSIONS**

- [ ] Employees can access `/en/attendance`
- [ ] Employees can check in/out
- [ ] Employers can access `/en/employer/attendance-approval`
- [ ] Employers can approve/reject
- [ ] Managers can view team attendance

---

## ✅ **TESTING**

### **Employee Tests:**
- [ ] Employee can check in
- [ ] Location captured correctly
- [ ] Photo saved successfully
- [ ] Break start/end works
- [ ] Employee can check out
- [ ] Total hours calculated correctly
- [ ] Overtime calculated (if applicable)
- [ ] History view works
- [ ] Analytics view works
- [ ] Notifications received

### **Employer Tests:**
- [ ] Can see pending approvals
- [ ] Can view employee details
- [ ] Can view photos
- [ ] Can approve single record
- [ ] Can reject with reason
- [ ] Can bulk approve
- [ ] Can view team attendance
- [ ] Can filter and search

### **System Tests:**
- [ ] Location verification works
- [ ] Late detection works
- [ ] Break time excluded from total
- [ ] Overtime calculation correct
- [ ] Approval workflow complete
- [ ] Notifications sent
- [ ] Reports generate

---

## 🎯 **FINAL VERIFICATION**

- [ ] At least one employee checked in today
- [ ] At least one approval processed
- [ ] System working end-to-end
- [ ] No errors in console/logs
- [ ] All features accessible

---

## 📝 **CONFIGURATION NOTES**

**Office Locations:**
```
Location 1: ________________
Coordinates: ________________
Radius: ________________
```

**Schedule Settings:**
```
Check-in Time: ________________
Days: ________________
Notification: ________________
```

**Employee Count:**
```
Total Employees: ________________
Active Employees: ________________
In Groups: ________________
```

---

## 🚨 **COMMON ISSUES TO CHECK**

- [ ] Employee `company_id` matches employer's company
- [ ] Office location `company_id` matches
- [ ] Schedule `company_id` matches
- [ ] All `is_active` flags set to true
- [ ] Employment status = 'active'
- [ ] Storage bucket permissions correct
- [ ] Cron job timezone correct

---

## ✅ **SETUP COMPLETE**

Once all items are checked:
- ✅ System is configured
- ✅ Ready for production use
- ✅ Employees can check in
- ✅ Employers can approve
- ✅ Automation will run daily

---

**Configuration Date**: _______________
**Configured By**: _______________
**Company**: _______________

