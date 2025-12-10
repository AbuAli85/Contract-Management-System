# ⚡ Quick Role Verification Checklist

## 🎯 30-Second Verification

### **Step 1: Check What You See**

#### **If you're an EMPLOYEE:**
- ✅ Header says: **"My Profile"**
- ✅ Only **ONE** profile card visible (yours)
- ✅ **NO** filters section
- ✅ **NO** bulk actions toolbar
- ✅ Document status cards visible
- ✅ Simple, minimal interface

#### **If you're an EMPLOYER:**
- ✅ Header says: **"Promoter Intelligence Hub"**
- ✅ **Multiple** promoters visible (your assigned ones)
- ✅ **Filters** section visible
- ✅ **Bulk actions** toolbar visible
- ✅ **Analytics** tab available
- ✅ Can see **"Add Promoter"** button
- ✅ Can see **"Export"** button

#### **If you're an ADMIN:**
- ✅ Header says: **"Promoter Intelligence Hub"**
- ✅ **ALL** promoters visible (no filtering)
- ✅ **All features** enabled
- ✅ Can **delete** promoters

---

## 🔍 How to Check Your Role

### **Quick Method: Browser Console**

1. Open Promoter Intelligence Hub page
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Paste this code:

```javascript
// Check your role
(async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    window.location.origin.includes('localhost') 
      ? process.env.NEXT_PUBLIC_SUPABASE_URL 
      : 'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('=== YOUR ROLE INFORMATION ===');
  console.log('Role:', session?.user?.user_metadata?.role);
  console.log('Employer ID:', session?.user?.user_metadata?.employer_id);
  console.log('Company ID:', session?.user?.user_metadata?.company_id);
  console.log('User ID:', session?.user?.id);
  console.log('=============================');
  
  // Determine role
  if (session?.user?.user_metadata?.employer_id || 
      session?.user?.user_metadata?.company_id ||
      session?.user?.user_metadata?.role === 'employer') {
    console.log('✅ You are an EMPLOYER');
  } else if (session?.user?.user_metadata?.role === 'promoter' ||
             session?.user?.user_metadata?.role === 'employee') {
    console.log('✅ You are an EMPLOYEE');
  } else {
    console.log('❓ Role not clearly defined');
  }
})();
```

---

## 📋 Feature Checklist by Role

### **EMPLOYEE Features:**
```
✅ View own profile
✅ See document status (ID Card, Passport)
✅ View expiry dates
✅ Download own documents
✅ Edit own profile (if permission granted)
❌ Cannot see other promoters
❌ Cannot use filters
❌ Cannot use bulk actions
❌ Cannot access analytics
❌ Cannot export data
```

### **EMPLOYER Features:**
```
✅ View assigned promoters
✅ Advanced filtering
✅ Search functionality
✅ Bulk actions
✅ Analytics dashboard
✅ Create new promoters
✅ Edit assigned promoters
✅ Export data (CSV, Excel, JSON)
✅ Manage assignments
✅ Send notifications
❌ Cannot see other employers' promoters
❌ Cannot delete promoters
```

### **ADMIN Features:**
```
✅ View ALL promoters
✅ All employer features
✅ Delete promoters
✅ System-wide analytics
✅ Full system access
```

---

## 🧪 Test Your Role

### **Test 1: Employee Test**
1. Login as employee
2. You should see:
   - "My Profile" header
   - Only your profile
   - No filters
   - No bulk actions
3. ✅ **PASS** if you see the above
4. ❌ **FAIL** if you see filters or other promoters

### **Test 2: Employer Test**
1. Login as employer
2. You should see:
   - Full dashboard header
   - Filters section
   - Bulk actions toolbar
   - Only your assigned promoters
   - "Add Promoter" button
3. ✅ **PASS** if you see the above
4. ❌ **FAIL** if you see all promoters or no filters

### **Test 3: Admin Test**
1. Login as admin
2. You should see:
   - Full dashboard
   - ALL promoters (not filtered)
   - All features enabled
   - Delete buttons visible
3. ✅ **PASS** if you see the above
4. ❌ **FAIL** if you see filtered data

---

## 🔧 Fix Common Issues

### **Issue: Employee sees all promoters**
**Fix:** Check user metadata has `role: "promoter"` or `role: "employee"`

### **Issue: Employer sees all promoters**
**Fix:** Check user metadata has `employer_id` set and promoters have matching `employer_id`

### **Issue: Wrong UI showing**
**Fix:** Clear browser cache and refresh, or check role detection in React DevTools

---

## 📊 Visual Guide

### **Employee View:**
```
┌─────────────────────────┐
│   My Profile            │  ← Simple header
├─────────────────────────┤
│  [Your Profile Card]    │  ← Only yours
│  - Name, Email          │
│  - Job Title            │
│  - Assignment           │
│                         │
│  [Document Status]      │
│  - ID Card: Valid       │
│  - Passport: Expiring   │
│                         │
│  [Action Alerts]        │
└─────────────────────────┘
```

### **Employer View:**
```
┌─────────────────────────────────────┐
│  Promoter Intelligence Hub         │  ← Full header
│  [Metrics] [Refresh] [Add] [Export]│
├─────────────────────────────────────┤
│  [Advanced Filters]                 │  ← Filters visible
│  [Search] [Quick Filters]           │
├─────────────────────────────────────┤
│  [Bulk Actions Toolbar]             │  ← Bulk actions
│  [Select All] [Actions ▼]           │
├─────────────────────────────────────┤
│  [Promoters Table]                  │  ← Your promoters
│  - Promoter 1                       │
│  - Promoter 2                       │
│  - Promoter 3                       │
│  ...                                │
└─────────────────────────────────────┘
```

---

## ✅ Quick Verification Steps

1. **Login** to the system
2. **Navigate** to Promoter Intelligence Hub
3. **Check header:**
   - Employee → "My Profile"
   - Employer/Admin → "Promoter Intelligence Hub"
4. **Check filters:**
   - Employee → No filters
   - Employer/Admin → Filters visible
5. **Check data:**
   - Employee → Only own profile
   - Employer → Only assigned promoters
   - Admin → All promoters

---

**That's it!** If everything matches, your role-based system is working correctly! 🎉

