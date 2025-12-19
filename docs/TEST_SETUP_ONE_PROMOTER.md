# 🧪 Test Setup: One Promoter for Testing

## 🎯 **GOAL**

Test the attendance system with **ONE promoter** and your office team first, then roll out to all promoters once everything works.

---

## 📋 **STEP-BY-STEP GUIDE**

### **Step 1: Find a Test Promoter**

1. Go to **Supabase SQL Editor**
2. Run **Step 1** from `scripts/test-setup-one-promoter.sql`
3. This shows you available promoters that can be converted
4. Pick **ONE** promoter to test with (preferably one with a unique email)

---

### **Step 2: Convert the Test Promoter**

**Option A: Convert by Email** (Easier)

1. Open `scripts/test-setup-one-promoter.sql`
2. Find **Step 3** (Convert by EMAIL)
3. Uncomment the INSERT statement
4. Replace `'test-promoter@example.com'` with the actual promoter email
5. Run the query

**Option B: Convert by ID**

1. Find **Step 2** (Convert by ID)
2. Uncomment the INSERT statement
3. Replace `'YOUR_PROMOTER_ID_HERE'` with the promoter ID from Step 1
4. Run the query

---

### **Step 3: Verify Employee Created**

Run **Step 4** from the script to verify the employee was created successfully.

---

## ✅ **TEST CHECKLIST**

Once the test employee is created, test these features:

### **1. Employee Assignment**
- [ ] Go to **Attendance Groups** → Create/Edit a group
- [ ] Click **"Assign Employees"**
- [ ] Verify your test employee appears in the list
- [ ] Select and assign them to the group
- [ ] Save and verify assignment

### **2. Attendance Check-In**
- [ ] Generate an attendance link for the test employee
- [ ] Open the check-in link
- [ ] Test check-in with:
  - [ ] Location (GPS)
  - [ ] Photo capture
  - [ ] Check-in time
- [ ] Verify check-in is recorded

### **3. Attendance Check-Out**
- [ ] Test check-out
- [ ] Verify total hours calculated
- [ ] Verify check-out time recorded

### **4. Break Management**
- [ ] Test break start
- [ ] Test break end
- [ ] Verify break time tracked

### **5. Manager Dashboard**
- [ ] View attendance in employer dashboard
- [ ] Check real-time stats
- [ ] Review attendance history
- [ ] Test approval workflow (if applicable)

### **6. Reports & Analytics**
- [ ] View attendance reports
- [ ] Check analytics dashboard
- [ ] Test export (CSV/Excel)

### **7. Notifications**
- [ ] Check notification system
- [ ] Test notification settings

---

## 🔄 **AFTER TESTING**

Once everything works:

1. ✅ **Fix promoter emails** - Ensure each promoter has a unique email
2. ✅ **Create profiles** - Create profiles for promoters without them
3. ✅ **Run bulk conversion** - Use `scripts/force-insert-all-pairs.sql` to convert all
4. ✅ **Verify all employees** - Check that all appear in attendance groups

---

## 📝 **QUICK REFERENCE**

**Script**: `scripts/test-setup-one-promoter.sql`

**Steps**:
1. Run Step 1 → Find test promoter
2. Run Step 2 or 3 → Convert promoter
3. Run Step 4 → Verify creation
4. Test all features
5. Roll out to all when ready

---

## 🚀 **READY TO TEST?**

1. Run Step 1 to find your test promoter
2. Convert them using Step 2 or 3
3. Start testing!

**Good luck with testing! 🎉**

