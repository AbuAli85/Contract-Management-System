# 🚀 Next Steps: Set Up Attendance for Your Company

## ✅ **You've Successfully Listed Your Companies!**

You have **30 companies** in your system. Now let's set up attendance for one of them.

---

## 🎯 **Choose Your Company**

From your list, here are some popular choices:

| Company Name | Company ID | Use Case |
|-------------|------------|----------|
| **Amjad Al Maerifa LLC** | `a7453123-f814-47a5-b3fa-e119eb5f2da6` | Main business |
| **Digital Morph** | `e81ac512-2c00-4dfa-b3d2-dd0648eeb7d7` | Digital services |
| **smartPRO** | `6233e133-3f6f-4c22-b845-afabf81e7962` | Tech company |
| **Vision Electronics LLC** | `29de0cc7-f704-41a1-bd43-1da1e48d0d46` | Electronics |
| **FALCON ELECTRONIC LLC** | `40986f0f-8aba-4e4b-a430-892ddc64bc94` | Electronics |

---

## 📋 **Option 1: Use Simple Setup (Recommended)**

**Best if:** You want to use your active company automatically.

1. **Set your active company first:**
   ```sql
   -- Replace with your chosen company ID
   UPDATE profiles 
   SET active_company_id = 'a7453123-f814-47a5-b3fa-e119eb5f2da6'::UUID
   WHERE id = auth.uid();
   ```

2. **Run the simple setup:**
   ```sql
   -- File: scripts/setup-attendance-system-simple.sql
   ```

---

## 📋 **Option 2: Setup for Specific Company**

**Best if:** You want to set up attendance for a specific company (not your active one).

1. **Open the script:**
   ```sql
   -- File: scripts/setup-attendance-for-company.sql
   ```

2. **Update the company ID:**
   ```sql
   -- Find this line:
   v_company_id := 'YOUR-COMPANY-ID-HERE'::UUID;
   
   -- Replace with your company ID, e.g.:
   v_company_id := 'a7453123-f814-47a5-b3fa-e119eb5f2da6'::UUID;
   ```

3. **Update office location coordinates:**
   ```sql
   -- Find these lines and update:
   latitude,   -- Get from Google Maps
   longitude,  -- Get from Google Maps
   ```

4. **Run the script**

---

## 📍 **Get Office Location Coordinates**

**How to get GPS coordinates:**

1. Open [Google Maps](https://maps.google.com)
2. Search for your office address
3. Right-click on the exact location
4. Click on the coordinates (e.g., "23.6145, 58.5459")
5. Copy **latitude** and **longitude**

**Example:**
- If your office is in Muscat, Oman:
  - Latitude: `23.6145`
  - Longitude: `58.5459`

---

## ✅ **After Setup - Verification**

Run these queries to verify:

```sql
-- 1. Check office locations
SELECT * FROM office_locations 
WHERE company_id = 'your-company-id-here'::UUID;

-- 2. Check employee groups
SELECT * FROM employee_attendance_groups 
WHERE company_id = 'your-company-id-here'::UUID;

-- 3. Check schedules
SELECT * FROM attendance_link_schedules 
WHERE company_id = 'your-company-id-here'::UUID;
```

---

## 🎯 **Quick Setup Example**

**For "Amjad Al Maerifa LLC":**

```sql
-- Step 1: Set as active company
UPDATE profiles 
SET active_company_id = 'a7453123-f814-47a5-b3fa-e119eb5f2da6'::UUID
WHERE id = auth.uid();

-- Step 2: Run simple setup
-- (Run scripts/setup-attendance-system-simple.sql)
```

---

## 📚 **What Gets Created**

After running the setup script, you'll have:

1. ✅ **Office Location** - Physical location for check-ins
2. ✅ **Employee Group** - Groups employees by location
3. ✅ **Attendance Schedule** - Automated daily link generation

**Next Steps:**
- Add employees to the group (via UI)
- Test check-in/check-out
- Configure notifications

---

## 🆘 **Need Help?**

- **Full Guide**: `ATTENDANCE_SYSTEM_CONFIGURATION_GUIDE.md`
- **Quick Fix**: `ATTENDANCE_SETUP_QUICK_FIX.md`
- **User Guide**: `ATTENDANCE_SYSTEM_USER_GUIDE.md`

---

**Ready to proceed?** Choose Option 1 or Option 2 above! 🚀

