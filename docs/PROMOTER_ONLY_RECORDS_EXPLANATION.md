# 🔍 Promoter-Only Records vs Actual Employees

## 📊 **What You're Seeing**

Your team API is returning **promoter-only records** (IDs starting with `promoter_`). These are people who exist in the `promoters` table but **don't have** an `employer_employee` record yet.

## ❌ **Why They're Filtered Out**

The `EmployeeScheduleSelector` filters out promoter-only records because:

1. **Attendance groups require `employer_employee_id`**
   - The `employee_group_assignments` table uses `employer_employee_id`
   - Promoter-only records don't have this ID

2. **Attendance tracking requires `employer_employee_id`**
   - The `employee_attendance` table uses `employer_employee_id`
   - Promoter-only records can't track attendance

## ✅ **Solution: Add Promoters as Employees**

To make these people available for attendance groups, you need to **add them as actual employees**:

### **Option 1: Use the UI**
1. Go to **Team Management** page
2. Click **"Add Team Member"** button
3. Search for the promoter by name/email
4. Fill in their details (job title, department, etc.)
5. Click **"Add to Team"**

This creates an `employer_employee` record for them.

### **Option 2: Check Console**
Run this to see the breakdown:

```javascript
fetch('/api/employer/team')
  .then(r => r.json())
  .then(d => {
    const team = d.team || [];
    const promoters = team.filter(e => e.id?.toString().startsWith('promoter_'));
    const employees = team.filter(e => e.id && !e.id.toString().startsWith('promoter_'));
    
    console.log(`Total: ${team.length}`);
    console.log(`Promoter-only: ${promoters.length}`);
    console.log(`Actual employees: ${employees.length}`);
    console.log('Promoter-only records:', promoters.map(e => ({
      id: e.id,
      name: e.employee?.full_name,
      email: e.employee?.email
    })));
  });
```

## 🎯 **Expected Result**

After adding promoters as employees:
- ✅ They'll appear in the employee selector
- ✅ They can be assigned to attendance groups
- ✅ They can track attendance
- ✅ They'll have a real `employer_employee_id` (not `promoter_xxx`)

## 📝 **Quick Check**

If you see:
- `Promoter-only records: 17, Actual employees: 0` → All are promoter-only, need to add them
- `Promoter-only records: 5, Actual employees: 12` → Some are employees, some need to be added
- `Promoter-only records: 0, Actual employees: 17` → All are employees, should work! ✅

---

**The filtering is working correctly - you just need to convert promoter-only records to actual employees!**

