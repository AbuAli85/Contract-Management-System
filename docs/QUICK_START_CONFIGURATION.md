# ⚡ Quick Start: Configure Automated Daily Attendance Links

## 🎯 5-Minute Setup Guide

### **Step 1: Create Office Location** (1 minute)

1. Go to: **HR Management → Attendance Links**
2. Click: **"Add Office Location"**
3. Fill in:
   ```
   Name: Grand Mall Muscat
   Address: Grand Mall, Muscat, Oman
   Latitude: 23.6145
   Longitude: 58.5459
   Radius: 50 meters
   ```
4. Click: **"Save"**

---

### **Step 2: Create Employee Group** (2 minutes)

1. Go to: **HR Management → Employee Groups**
2. Click: **"Create Group"**
3. Fill in:
   ```
   Name: Grand Mall Muscat Team
   Type: Location-Based
   Office Location: Grand Mall Muscat
   ```
4. **Assign Employees:**
   - Click **"Selected"** tab
   - Check employees who work at Grand Mall
   - Or click **"Select All"**
5. Click: **"Create Group"**

---

### **Step 3: Create Automated Schedule** (2 minutes)

1. Go to: **HR Management → Automated Schedules**
2. Click: **"Create Schedule"**

**Basic Settings:**
```
Name: Daily Grand Mall Check-In
Active: ✓ (MUST be checked)
```

**Location Settings:**
```
Location Source: Office Location
Select: Grand Mall Muscat
Radius: 50 meters
```

**Schedule Settings:**
```
Check-In Time: 09:00
Link Valid Duration: 2 hours
Days: ✓ Monday-Friday
```

**Employee Assignment:**
```
Assignment Type: Groups
Select: ✓ Grand Mall Muscat Team
```

**Notification Settings:**
```
Send Check-In Link: ✓
Email: ✓
SMS: ✓
Send Before: 15 minutes
```

**Advanced Settings:**
```
Max Uses: 1
Require Photo: ✓
Require Location: ✓
```

3. Click: **"Create Schedule"**

---

## ✅ Done!

**The system will now:**
- ✅ Generate links automatically every day at 00:00 UTC
- ✅ Send links to employees 15 minutes before check-in (08:45)
- ✅ Links valid from 08:45 to 11:00
- ✅ Employees check in using their personalized links
- ✅ Attendance records created automatically

**No manual work needed!** 🎉

---

## 📋 What Happens Daily

```
00:00 UTC → System generates unique links for each employee
08:45     → System sends email/SMS with links
09:00     → Links become active
09:00-11:00 → Employees check in
```

---

## 🔧 Troubleshooting

**Links not generated?**
- Check schedule is "Active" ✓
- Check today is in schedule's days (Mon-Fri) ✓

**Employees not receiving links?**
- Check employees are in the assigned group ✓
- Check employee status is "active" ✓

**Need to test?**
- Click "Generate Now" button on schedule
- Links generated immediately for testing

---

## 📚 Full Documentation

- **Complete Guide:** `docs/STEP_BY_STEP_CONFIGURATION_GUIDE.md`
- **How It Works:** `docs/HOW_IT_WORKS_ATTENDANCE_SCHEDULES.md`
- **User Guide:** `docs/COMPLETE_USER_GUIDE_ATTENDANCE_SYSTEM.md`

