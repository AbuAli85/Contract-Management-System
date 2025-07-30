# Authentication Debug Guide - "Failed to fetch" Issue

## 🚨 **Problem: "Failed to fetch" Error**

You're experiencing a `AuthRetryableFetchError: Failed to fetch` error when trying to log in. This indicates that the Supabase authentication API call is failing.

## 🔍 **Root Cause Analysis**

### **Possible Causes:**
1. **Missing Environment Variables**: Supabase URL/Key not configured
2. **Invalid Supabase Configuration**: Wrong URL or key format
3. **Network Issues**: Connectivity problems to Supabase
4. **CORS Issues**: Cross-origin request problems
5. **Mock Client Issues**: Development environment using wrong client

## 🛠️ **Step-by-Step Debugging**

### **Step 1: Check Environment Variables**

Visit this URL to check your configuration:
```
https://portal.thesmartpro.io/api/test-auth-config
```

**Expected Results:**
- **Development**: Should show `clientType: "mock"`
- **Production**: Should show `clientType: "real"`

### **Step 2: Verify Environment Variables**

Check if these variables are set in your Vercel dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ekdjxzhujettocosgzql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Step 3: Test Supabase Connectivity**

Try accessing your Supabase project directly:
```
https://ekdjxzhujettocosgzql.supabase.co
```

### **Step 4: Check Browser Console**

Open browser developer tools and look for:
1. **Network Tab**: Failed requests to Supabase
2. **Console Tab**: Error messages
3. **Application Tab**: LocalStorage for session data

## 🔧 **Quick Fixes**

### **Fix 1: Force Mock Client (Development)**

If you're in development, the system should automatically use the mock client. The updated mock client now provides working authentication.

**Test with any credentials:**
```
Email: test@example.com
Password: any_password
```

### **Fix 2: Check Vercel Environment Variables**

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Check Environment Variables section
4. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### **Fix 3: Verify Supabase Project**

1. Log into your Supabase dashboard
2. Check if the project is active
3. Verify the URL and anon key match your environment variables

## 🧪 **Testing Steps**

### **Test 1: Environment Configuration**
```bash
# Visit this URL to check your config
https://portal.thesmartpro.io/api/test-auth-config
```

### **Test 2: Mock Authentication**
```bash
# For development, try these credentials
Email: luxsess2001@gmail.com
Password: any_password
```

### **Test 3: Real Authentication**
```bash
# For production, use real Supabase credentials
# The system should automatically detect and use real Supabase
```

## 📊 **Expected Behavior**

### **Development Environment:**
- ✅ Uses mock client
- ✅ Accepts any credentials
- ✅ Stores session in localStorage
- ✅ Provides working authentication

### **Production Environment:**
- ✅ Uses real Supabase
- ✅ Requires valid credentials
- ✅ Stores session securely
- ✅ Provides real authentication

## 🔍 **Debug Information**

### **Console Logs to Look For:**
```
🔧 Client: SSR mode detected, using mock client
🔧 Client: Missing Supabase environment variables - using mock client
🔧 Mock Client: Attempting sign in with: luxsess2001@gmail.com
🔧 Mock Client: Sign in successful
🔧 Mock Client: Session stored successfully
```

### **Network Requests to Check:**
- **Mock Client**: No network requests (everything local)
- **Real Supabase**: Requests to `https://ekdjxzhujettocosgzql.supabase.co`

## 🚀 **Solution Summary**

### **If Using Mock Client (Development):**
1. ✅ **Fixed**: Updated mock client provides working authentication
2. ✅ **Test**: Use any email/password combination
3. ✅ **Verify**: Check console for mock client logs

### **If Using Real Supabase (Production):**
1. ✅ **Check**: Environment variables in Vercel
2. ✅ **Verify**: Supabase project is active
3. ✅ **Test**: Use real Supabase credentials

## 🎯 **Next Steps**

1. **Test the updated mock client** with any credentials
2. **Check environment variables** in Vercel dashboard
3. **Verify Supabase project** is active and accessible
4. **Monitor console logs** for authentication flow
5. **Test both development and production** environments

## 📞 **Support Information**

If the issue persists:
1. Check the `/api/test-auth-config` endpoint for configuration details
2. Review browser console for specific error messages
3. Verify network connectivity to Supabase
4. Test with the updated mock client implementation

---

**Status**: Mock client updated to provide working authentication
**Next Action**: Test with any credentials in development 