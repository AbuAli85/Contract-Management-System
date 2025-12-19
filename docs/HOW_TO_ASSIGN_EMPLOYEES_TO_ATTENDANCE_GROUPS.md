# 📋 How to Assign Employees to Attendance Groups

## 🎯 **STEP-BY-STEP GUIDE**

### **Step 1: Navigate to Attendance Groups**

1. **Go to**: `/en/employer/attendance-groups`
   - Or click: **HR Management → Attendance Groups** in sidebar

2. **You'll see**:
   - List of existing groups (if any)
   - "Create Group" button (top right)

---

### **Step 2: Create a New Group (or Edit Existing)**

#### **Option A: Create New Group**

1. Click **"Create Group"** button
2. Fill in the form:
   ```
   Group Name: [e.g., "Grand Mall Team"]
   Description: [Optional description]
   Group Type: [Select: Location, Department, Custom, or Project]
   ```

3. **If Location-Based**:
   - Select an **Office Location** from dropdown
   - (If no locations exist, create one first at `/en/employer/office-locations`)

4. **If Department-Based**:
   - Enter **Department Name**

5. **Optional Settings**:
   - Default Check-In Time: [e.g., 09:00]
   - Default Check-Out Time: [e.g., 17:00]

#### **Option B: Edit Existing Group**

1. Find the group in the list
2. Click **"Edit"** button on the group card
3. Modify settings as needed

---

### **Step 3: Assign Employees** ⭐ **IMPORTANT**

1. **Scroll down** to **"Assign Employees"** section

2. **You'll see a tabbed interface**:
   - **All Employees** - Assigns to everyone (not recommended)
   - **Selected** - Choose specific employees ⭐ **USE THIS**
   - **Groups** - Assign from other groups
   - **By Location** - Auto-assign by location

3. **Click "Selected" tab**:

4. **Search for employees**:
   - Use the search bar: Type employee name, email, code, or job title
   - Or filter by department using the dropdown

5. **Select employees**:
   - **Click on each employee card** to select/deselect
   - Selected employees will have:
     - ✅ Checkmark icon
     - Blue background highlight
   - Or click **"Select All"** to select all visible employees

6. **Verify selection**:
   - Check the badge showing: **"X selected"**
   - Selected employees are highlighted in blue

---

### **Step 4: Save the Group**

1. **Click "Create Group"** (or **"Update Group"** if editing)
2. **Wait for confirmation**:
   - Success toast message appears
   - Group appears in the list
   - Employee count shows in group card

---

## ✅ **VERIFICATION**

### **Check if Employees are Assigned**

1. **Look at the group card**:
   - Should show: **"X employees"** (where X > 0)

2. **Click "Edit"** on the group:
   - Go to "Assign Employees" section
   - Selected employees should be highlighted
   - Checkmark should be visible

3. **Check in Database** (if needed):
   ```sql
   SELECT 
     ega.*,
     ee.employee_code,
     p.full_name
   FROM employee_group_assignments ega
   JOIN employer_employees ee ON ee.id = ega.employer_employee_id
   JOIN profiles p ON p.id = ee.employee_id
   WHERE ega.group_id = 'your-group-id';
   ```

---

## 🔧 **TROUBLESHOOTING**

### **Problem: "No employees found"**

**Solution**:
1. **Check if you have employees**:
   - Go to `/en/employer/team`
   - Verify employees are listed
   - Employees must have `employment_status = 'active'`

2. **If no employees**:
   - Add employees first at `/en/employer/team`
   - Then return to attendance groups

### **Problem: "Employees not saving"**

**Solution**:
1. **Check browser console** for errors
2. **Verify**:
   - You selected employees (checkmark visible)
   - "X selected" badge shows count > 0
   - Clicked "Create Group" or "Update Group" button
   - Success message appeared

3. **Try again**:
   - Edit the group
   - Re-select employees
   - Click "Update Group"

### **Problem: "Can't see employee selector"**

**Solution**:
1. **Scroll down** in the dialog
2. **Look for** "Assign Employees" section
3. **If missing**:
   - Check browser console for errors
   - Refresh the page
   - Try creating a new group

### **Problem: "Selected employees disappear after save"**

**Solution**:
1. **Check API response**:
   - Open browser DevTools → Network tab
   - Look for `/api/employer/attendance-groups` request
   - Check if `employee_ids` array is sent
   - Check response for errors

2. **Verify employee IDs**:
   - Employees must be from `/api/employer/team`
   - IDs must be `employer_employee_id` (not profile IDs)

---

## 📸 **VISUAL GUIDE**

```
Attendance Groups Page
│
├─ [Create Group Button] (top right)
│
└─ Group List
   └─ Group Card
      ├─ Group Name
      ├─ Description
      ├─ Location/Department
      ├─ "X employees" ← Check this!
      └─ [Edit] [Delete] buttons
         │
         └─ Edit Dialog Opens
            ├─ Basic Info
            ├─ Location/Department Settings
            ├─ Time Settings
            └─ ⭐ Assign Employees Section
               └─ Employee Selector
                  ├─ Tabs: [All] [Selected] [Groups] [By Location]
                  ├─ Search Bar
                  ├─ Department Filter
                  ├─ Employee List (scrollable)
                  │  └─ Employee Card
                  │     ├─ [✓] Checkbox
                  │     ├─ Name
                  │     ├─ Code, Job Title, Department
                  │     └─ Email
                  └─ "X selected" badge
```

---

## 🎯 **QUICK CHECKLIST**

- [ ] Navigated to `/en/employer/attendance-groups`
- [ ] Created or edited a group
- [ ] Clicked "Selected" tab in employee selector
- [ ] Searched/found employees
- [ ] Selected employees (checkmarks visible)
- [ ] Verified "X selected" badge shows count
- [ ] Clicked "Create Group" or "Update Group"
- [ ] Success message appeared
- [ ] Group card shows employee count > 0

---

## 💡 **TIPS**

1. **Use Search**: If you have many employees, use the search bar to find them quickly

2. **Filter by Department**: Use the department filter to narrow down the list

3. **Select All**: Use "Select All" button if assigning many employees at once

4. **Verify Before Saving**: Always check the "X selected" badge before clicking save

5. **Edit to Add More**: You can always edit a group later to add/remove employees

---

## 📞 **STILL HAVING ISSUES?**

1. **Check Browser Console**:
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Verify Employees Exist**:
   - Go to `/en/employer/team`
   - Confirm employees are listed
   - Check they have `employment_status = 'active'`

3. **Check Permissions**:
   - Ensure you have `attendance:create:all` permission
   - Contact admin if needed

---

**✅ Once employees are assigned, they can use attendance features!**

