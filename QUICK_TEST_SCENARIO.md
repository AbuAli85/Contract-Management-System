# ⚡ Quick Test Scenario - 15 Minutes

**Complete workflow test for Team Management System**

---

## 🎯 **STEP-BY-STEP TEST (15 Minutes)**

### **STEP 1: Access Team Management (1 min)**
```
1. Login as admin: /en/auth/login
2. Click "Team Management" in sidebar
3. Verify page loads: /en/employer/team
4. ✅ Should see statistics cards and "Add Team Member" button
```

### **STEP 2: Add Team Member (3 min)**
```
1. Click "Add Team Member"
2. Search for user email (e.g., "test@example.com")
3. Click "Search" → Select user from results
4. Fill form:
   - Employee Code: EMP001
   - Job Title: Test Engineer
   - Department: QA
   - Employment Type: Full Time
   - Hire Date: Today
5. Click "Add to Team"
6. ✅ Should see success message and member in list
```

### **STEP 3: Assign Permissions (2 min)**
```
1. Click on the team member card
2. Click "Permissions" tab
3. Search: "attendance"
4. Select:
   - attendance:view:own
   - attendance:record:own
   - tasks:view:own
   - tasks:update:own
5. Click "Save Permissions"
6. ✅ Should see success message
```

### **STEP 4: Create Task (2 min)**
```
1. Click "Tasks" tab
2. Click "Add Task" (or verify existing tasks)
3. Fill:
   - Title: "Test Task"
   - Description: "Testing task creation"
   - Priority: High
   - Due Date: Tomorrow
4. Submit
5. ✅ Task appears in list with correct details
```

### **STEP 5: Create Target (2 min)**
```
1. Click "Targets" tab
2. Click "Add Target"
3. Fill:
   - Title: "Complete 10 tasks"
   - Target Value: 10
   - Unit: tasks
   - Period: Monthly
   - Start/End: Current month
4. Submit
5. ✅ Target appears with 0% progress
```

### **STEP 6: Test Employee View (5 min)**
```
1. Logout
2. Login as the employee you added
3. Navigate to: /en/employee/dashboard
4. Verify:
   - ✅ Employment info displays
   - ✅ Attendance tab works
   - ✅ Tasks tab shows assigned task
   - ✅ Targets tab shows assigned target
5. Update task status: pending → in_progress
6. ✅ Status updates successfully
7. Update target progress: current_value = 5
8. ✅ Progress updates to 50%
```

---

## ✅ **VERIFICATION**

After completing all steps, verify:
- ✅ Team member added successfully
- ✅ Permissions assigned
- ✅ Task created and visible
- ✅ Target created and visible
- ✅ Employee can view own data
- ✅ Employee can update own records
- ✅ No errors in console
- ✅ All features functional

---

**Total Time:** ~15 minutes  
**Status:** ✅ All features tested

