# 🎯 REACT ERROR #310 DEBUGGING - STEP-BY-STEP GUIDE

## 🔥 **LATEST FIXES APPLIED**

### **1. Hooks Order Fixes ✅**
- Fixed dashboard page hooks order violations
- Fixed contracts page hooks order violations
- Fixed useUserProfile infinite loop (useCallback added)
- Fixed fetchDashboardData infinite loop (useCallback added)

### **2. Global Icons Debugging 🧪**
- **TEMPORARILY DISABLED** global icon initialization in providers
- **TEMPORARILY DISABLED** global icon initialization in layout
- This isolates potential React reconciliation conflicts

## 🧪 **TESTING PROTOCOL**

### **Step 1: Clear Everything**
```bash
# Kill dev server if running
Ctrl + C

# Clear browser cache completely
Ctrl + Shift + R (hard refresh)
# OR open incognito window
Ctrl + Shift + N

# Clear Next.js cache
rm -rf .next
# OR on Windows
rmdir /s .next
```

### **Step 2: Restart Fresh**
```bash
# Start dev server fresh
npm run dev

# Wait for "Ready in [time]ms"
# Should see no compilation errors
```

### **Step 3: Test URLs**
```
1. Main dashboard: http://localhost:3000/en/dashboard
2. Generate contract: http://localhost:3000/en/dashboard/generate-contract  
3. Simple page: http://localhost:3000/en/dashboard/simple-page
```

### **Step 4: Monitor Console**
Expected results:
```
✅ NO "Minified React error #310"
✅ NO infinite "Error fetching user profile" 
✅ NO rapid-fire API calls
✅ Normal component rendering
```

## 🔍 **DIAGNOSTIC CHECKS**

### **Browser Developer Tools:**

**Console Tab:**
- Look for React error #310 (should be gone)
- Look for infinite user profile errors (should be gone)  
- Check for any new errors introduced

**Network Tab:**
- Monitor API calls to `/api/users/profile/[id]`
- Should see normal, not excessive requests
- Check response codes (200/401/404 OK, not 500)

**Performance Tab:**
- Check for infinite render loops
- Monitor component mount/unmount cycles
- Watch memory usage (should be stable)

## 🚨 **IF REACT ERROR #310 PERSISTS**

### **Likely Causes:**
1. **Browser cache** - Most common cause after fixes
2. **Other components** with hooks violations not yet found
3. **Dynamic imports** causing component state conflicts
4. **Server/client hydration** mismatches

### **Additional Debug Steps:**
```bash
# 1. Nuclear cache clear
Ctrl + Shift + Delete -> Clear all browsing data

# 2. Check other browsers
# Test in Firefox, Edge, or Safari

# 3. Test in incognito mode
Ctrl + Shift + N

# 4. Restart dev server
npm run dev
```

## 🔧 **IF USER PROFILE ERRORS PERSIST**

### **Debugging Steps:**
1. Check if `/api/users/profile/[id]` endpoint exists
2. Verify Supabase `profiles` table exists
3. Check RLS (Row Level Security) policies
4. Test API directly in browser:
   ```
   http://localhost:3000/api/users/profile/[your-user-id]
   ```

## 📋 **ROLLBACK PLAN**

If issues persist, we can:
1. Re-enable global icons one by one
2. Test each component individually
3. Use React DevTools Profiler
4. Check for specific component state conflicts

## 🎯 **SUCCESS CRITERIA**

- ✅ No React error #310 in console
- ✅ Dashboard loads without crashes  
- ✅ User profile loads (with fallback if needed)
- ✅ Navigation works smoothly
- ✅ Form components render correctly
- ✅ No infinite API call loops

---
**Debug Session:** August 5, 2025  
**Status:** Testing fixes with global icons disabled  
**Next:** Re-enable features if tests pass
