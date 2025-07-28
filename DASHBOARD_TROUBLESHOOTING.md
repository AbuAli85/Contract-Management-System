# 🔧 Dashboard Loading Troubleshooting Guide

## 🚨 Issue: Dashboard Stuck on Loading

If your dashboard is stuck on a loading state, follow these steps to diagnose and fix the issue.

## 🔍 Quick Diagnosis

### 1. **Check Debug Dashboard**
Visit the debug dashboard to see what's causing the issue:
```
https://your-domain.com/en/dashboard/debug
```

This will show you:
- Authentication status
- Environment variables
- Supabase connection
- API status
- Browser information

### 2. **Run Browser Console Diagnostic**
Open your browser's developer console and run:
```javascript
// Copy and paste this into the console
window.debugDashboard()
```

### 3. **Check Network Tab**
1. Open Developer Tools (F12)
2. Go to Network tab
3. Refresh the dashboard page
4. Look for failed requests (red entries)
5. Check the `/api/dashboard/analytics` request

## 🛠️ Common Solutions

### **Issue 1: Authentication Loading Forever**
**Symptoms:** Page shows "Loading authentication..." indefinitely

**Solutions:**
1. Clear browser storage:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
2. Check if Supabase environment variables are set correctly
3. Verify Supabase project is active and accessible

### **Issue 2: Analytics API Failing**
**Symptoms:** Dashboard loads but shows "Loading data..." or empty stats

**Solutions:**
1. Check if the `/api/dashboard/analytics` endpoint is working
2. Verify database connection
3. Check if user has proper permissions

### **Issue 3: Environment Variables Missing**
**Symptoms:** Various API calls failing with 500 errors

**Solutions:**
1. Verify all environment variables are set in Vercel
2. Check the debug dashboard for missing variables
3. Redeploy with correct environment variables

### **Issue 4: Supabase Connection Issues**
**Symptoms:** Authentication or data loading fails

**Solutions:**
1. Check Supabase project status
2. Verify API keys are correct
3. Check if database is accessible
4. Verify RLS policies are configured correctly

## 🔧 Manual Testing

### **Test Authentication Flow**
```javascript
// Test login
fetch('/api/auth/status')
  .then(r => r.json())
  .then(console.log)
```

### **Test Analytics API**
```javascript
// Test analytics
fetch('/api/dashboard/analytics')
  .then(r => r.json())
  .then(console.log)
```

### **Test Supabase Connection**
```javascript
// Test Supabase
fetch('/api/debug/supabase')
  .then(r => r.json())
  .then(console.log)
```

## 🚀 Production Deployment Checklist

### **Environment Variables**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] All webhook URLs are configured

### **Database Setup**
- [ ] Supabase project is active
- [ ] Database tables exist
- [ ] RLS policies are configured
- [ ] User roles are set up

### **API Endpoints**
- [ ] `/api/dashboard/analytics` returns 200
- [ ] `/api/auth/status` returns 200
- [ ] `/api/debug/supabase` returns 200

## 📞 Getting Help

If the issue persists:

1. **Check the debug dashboard** for specific error messages
2. **Review browser console** for JavaScript errors
3. **Check Vercel function logs** for server-side errors
4. **Verify Supabase logs** for database issues

## 🔄 Quick Fixes

### **Force Refresh Dashboard**
```javascript
// Clear cache and reload
window.location.reload(true)
```

### **Reset Authentication State**
```javascript
// Clear auth state
localStorage.removeItem('sb-auth-token')
sessionStorage.clear()
window.location.reload()
```

### **Bypass Analytics Loading**
If analytics API is the issue, the dashboard will show default stats (0 values) but should still load.

## 📊 Expected Behavior

### **Normal Loading Sequence:**
1. Page loads → "Loading authentication..." (1-2 seconds)
2. Auth loads → "Loading data..." (2-5 seconds)
3. Data loads → Dashboard displays with real stats

### **Fallback Behavior:**
- If analytics API fails → Dashboard shows with default stats (0 values)
- If auth fails → Redirects to login page
- If Supabase fails → Shows error message

## 🎯 Success Indicators

✅ Dashboard loads within 10 seconds
✅ Authentication status shows "Ready"
✅ Analytics API returns 200 status
✅ Supabase connection shows "Can Connect: Yes"
✅ Real data displays in stats cards 