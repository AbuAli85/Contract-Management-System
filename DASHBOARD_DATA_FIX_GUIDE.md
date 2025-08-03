# Dashboard Data Fetching Fix Guide

## 🚨 **Issue Description**

The main dashboard page is not showing any data from overview pages like:
- Promoters count
- Contracts count  
- Parties count
- Notifications
- Activities

## 🔍 **Root Cause Analysis**

The issue is likely related to the **schema cache problem** we just fixed, combined with potential API endpoint issues. The dashboard relies on several API endpoints that may be failing due to:

1. **Schema cache issues** affecting database queries
2. **API endpoint failures** 
3. **Authentication issues**
4. **Database connectivity problems**

## 🛠️ **Solution Steps**

### **Step 1: Run Database Diagnostics**

First, run the database diagnostic script to check if tables exist and have data:

```sql
-- Run this in Supabase SQL Editor
\i scripts/test_dashboard_api_endpoints.sql
```

**Expected Output:**
- ✅ All tables exist
- ✅ Tables have data (count > 0)
- ✅ No permission issues

### **Step 2: Use the Dashboard Diagnostics Panel**

The dashboard now includes a **Diagnostics Panel** that will help identify the exact issue:

1. **Go to the dashboard page**
2. **Scroll down to the "Dashboard Diagnostics" panel**
3. **Click "Full Diagnostics"** to run comprehensive tests
4. **Review the results** to identify which endpoints are failing

### **Step 3: Fix Schema Cache Issues**

If the diagnostics show schema cache problems, run the schema cache refresh:

```sql
-- Run this in Supabase SQL Editor
\i scripts/026_refresh_supabase_client_cache.sql
```

### **Step 4: Test API Endpoints Manually**

You can also test the API endpoints manually in the browser console:

```javascript
// Test stats endpoint
fetch('/api/dashboard/stats')
  .then(response => response.json())
  .then(data => console.log('Stats:', data))
  .catch(error => console.error('Stats error:', error))

// Test notifications endpoint  
fetch('/api/dashboard/notifications')
  .then(response => response.json())
  .then(data => console.log('Notifications:', data))
  .catch(error => console.error('Notifications error:', error))

// Test activities endpoint
fetch('/api/dashboard/activities')
  .then(response => response.json())
  .then(data => console.log('Activities:', data))
  .catch(error => console.error('Activities error:', error))
```

### **Step 5: Check Browser Console**

Open the browser developer tools and check for any errors:

1. **Press F12** to open developer tools
2. **Go to Console tab**
3. **Look for any red error messages**
4. **Check Network tab** for failed API requests

## 🔧 **Manual Fixes**

### **If API Endpoints Are Failing**

If the API endpoints are returning errors, check these common issues:

#### **1. Authentication Issues**
```typescript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  console.error('User not authenticated')
}
```

#### **2. Database Permission Issues**
```sql
-- Check if the current user has proper permissions
SELECT current_user, session_user;
```

#### **3. Missing Tables or Columns**
```sql
-- Check if all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('contracts', 'promoters', 'parties');
```

### **If Data Exists But Dashboard Shows Zero**

This indicates a **data fetching issue** rather than missing data:

#### **1. Check API Response Format**
The dashboard expects specific data format. Check if the API is returning the correct structure:

```typescript
// Expected stats format
{
  totalContracts: number,
  activeContracts: number,
  totalPromoters: number,
  activePromoters: number,
  totalParties: number,
  pendingApprovals: number,
  // ... other fields
}
```

#### **2. Check for Null/Undefined Values**
The dashboard may be showing 0 if the API returns null values:

```typescript
// In the dashboard component, add fallback values
const stats = {
  totalContracts: apiData?.totalContracts || 0,
  activeContracts: apiData?.activeContracts || 0,
  // ... other fields
}
```

## 🧪 **Testing the Fix**

### **1. Test Database Queries**

Run these queries to verify data exists:

```sql
-- Check contracts
SELECT COUNT(*) as total_contracts FROM contracts;
SELECT status, COUNT(*) FROM contracts GROUP BY status;

-- Check promoters  
SELECT COUNT(*) as total_promoters FROM promoters;
SELECT status, COUNT(*) FROM promoters GROUP BY status;

-- Check parties
SELECT COUNT(*) as total_parties FROM parties;
```

### **2. Test API Endpoints**

Use the diagnostic panel or manually test:

```javascript
// Quick test
const response = await fetch('/api/dashboard/stats')
const data = await response.json()
console.log('Dashboard stats:', data)
```

### **3. Verify Dashboard Display**

After fixing, the dashboard should show:
- ✅ **Real numbers** instead of zeros
- ✅ **Active counts** for promoters and contracts
- ✅ **Pending approvals** count
- ✅ **Recent activities**
- ✅ **Notifications**

## 🔄 **Prevention Measures**

### **1. Add Error Handling**

The dashboard now includes better error handling:

```typescript
// Enhanced error handling in fetchDashboardData
if (statsResponse.ok && 'json' in statsResponse) {
  const statsData = await statsResponse.json()
  setStats(statsData)
} else {
  console.warn('Stats API failed, using fallback data')
  setStats({
    totalContracts: 0,
    activeContracts: 0,
    // ... fallback values
  })
}
```

### **2. Add Loading States**

The dashboard shows loading states while data is being fetched:

```typescript
const [loading, setLoading] = useState(true)
// ... loading logic
```

### **3. Add Auto-Refresh**

The dashboard automatically refreshes data every 2 minutes:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (!document.hidden && document.hasFocus()) {
      fetchDashboardData()
    }
  }, 2 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
```

## 📋 **Files Modified**

### **New Files Created:**
1. `scripts/test_dashboard_api_endpoints.sql` - Database diagnostic script
2. `lib/dashboard-diagnostics.ts` - Client-side diagnostic utilities
3. `components/dashboard-diagnostics-panel.tsx` - Diagnostic UI component
4. `DASHBOARD_DATA_FIX_GUIDE.md` - This guide

### **Files Updated:**
1. `app/[locale]/dashboard/page.tsx` - Added diagnostic panel
2. `app/api/dashboard/stats/route.ts` - Enhanced error handling

## 🎯 **Expected Outcome**

After applying this fix:

1. ✅ **Dashboard shows real data** instead of zeros
2. ✅ **All API endpoints work correctly**
3. ✅ **Schema cache issues resolved**
4. ✅ **Diagnostic tools available** for future troubleshooting
5. ✅ **Better error handling** and user feedback

## 🆘 **Troubleshooting**

### **If the fix doesn't work:**

1. **Check the diagnostic panel results**
2. **Review browser console errors**
3. **Test API endpoints manually**
4. **Verify database permissions**
5. **Check if tables have data**
6. **Contact support if issues persist**

### **Common Issues:**

- **API 401/403 errors**: Authentication/permission issues
- **API 500 errors**: Server-side errors, check logs
- **Empty data**: Database tables may be empty
- **Schema cache errors**: Use the schema cache refresh tools
- **Network errors**: Check internet connection

## 🚀 **Quick Fix**

For immediate resolution:

1. **Open the dashboard page**
2. **Scroll to the "Dashboard Diagnostics" panel**
3. **Click "Full Diagnostics"**
4. **Follow the recommendations** based on the test results
5. **If schema cache issues are found**, run the schema cache refresh
6. **Refresh the page** to see the updated data

This comprehensive fix should resolve the dashboard data fetching issue and provide tools for future troubleshooting! 🎉 