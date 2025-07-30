# 🔍 Authentication System Test Guide

## 🎯 **COMPREHENSIVE AUTH SYSTEM VERIFICATION**

This guide will help you manually test all aspects of the authentication system to ensure it's working properly.

---

## 📋 **PRE-TEST CHECKLIST**

### ✅ **Environment Setup**

- [ ] `.env` file exists with Supabase credentials
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is configured
- [ ] Development server is running (`npm run dev` or `pnpm dev`)

### ✅ **Database Setup**

- [ ] Supabase project is active
- [ ] Database tables exist (contracts, users, etc.)
- [ ] Row Level Security (RLS) policies are configured

---

## 🧪 **TEST 1: BASIC AUTHENTICATION FLOW**

### **Step 1: Access Login Page**

```
URL: http://localhost:3000/en/login
Expected: Login form loads without errors
```

### **Step 2: Test Login with Valid Credentials**

```
Action: Enter valid email and password
Expected:
- Login successful
- Redirect to dashboard
- Console shows: "🔐 Login Debug - Login successful"
- Console shows: "🔐 Login Debug - Session after login: established"
```

### **Step 3: Verify Session Establishment**

```
Action: Check browser console after login
Expected Logs:
✅ "🔐 Login Debug - Login successful, user: [email]"
✅ "🔐 Login Debug - Session data: present"
✅ "🔐 Login Debug - Session access token: present"
✅ "🔐 Login Debug - Session refresh token: present"
✅ "🔐 Login Debug - Using Supabase's built-in session management"
✅ "🔐 Login Debug - Session after login: established"
✅ "🔐 Login Debug - Session user: [email]"
✅ "🔐 Login Debug - Stored session: present"
✅ "🔐 Login Debug - Auth cookie present: true"
✅ "🔐 Login Debug - Supabase cookies: [list of cookies]"
```

---

## 🧪 **TEST 2: SESSION PERSISTENCE**

### **Step 1: Verify Session Storage**

```
Action: After login, check browser storage
Expected:
- localStorage contains 'sb-auth-token'
- Cookies contain Supabase session cookies
- Console shows cookie details
```

### **Step 2: Test Page Refresh**

```
Action: Refresh the dashboard page
Expected:
- User remains logged in
- Dashboard loads without redirect to login
- Session persists across page refresh
```

### **Step 3: Test Browser Tab**

```
Action: Open dashboard in new tab
Expected:
- User automatically logged in
- No redirect to login page
- Session shared across tabs
```

---

## 🧪 **TEST 3: API AUTHENTICATION**

### **Step 1: Test API Calls**

```
Action: Navigate to dashboard (which calls /api/contracts)
Expected API Logs:
✅ "🔍 API Debug - Cookie header: present"
✅ "🔍 API Debug - All cookies: [cookie list]"
✅ "🔍 API Debug - Supabase cookies: [supabase cookies]"
✅ "🔍 API Debug - Session found: true"
✅ "🔍 API Debug - User email: [email]"
✅ "🔍 API Debug - User authenticated: [email]"
✅ "🔍 API Debug - Fetched [X] contracts"
```

### **Step 2: Test Direct API Access**

```
Action: Visit http://localhost:3000/api/contracts directly
Expected:
- If logged in: Returns contracts data
- If not logged in: Returns 401 Unauthorized
```

---

## 🧪 **TEST 4: AUTHENTICATION STATE MANAGEMENT**

### **Step 1: Check Auth Provider**

```
Action: After login, check React DevTools
Expected:
- AuthProvider shows session data
- User object is populated
- Loading state is false
```

### **Step 2: Test Auth Context**

```
Action: Use useAuth() hook in components
Expected:
- session.user.email returns user email
- session.access_token exists
- loading is false
```

---

## 🧪 **TEST 5: LOGOUT FUNCTIONALITY**

### **Step 1: Test Logout**

```
Action: Click logout or call signOut()
Expected:
- User logged out
- Redirected to login page
- Session cleared from storage
- Cookies removed
```

### **Step 2: Verify Post-Logout State**

```
Action: After logout, try to access dashboard
Expected:
- Redirected to login page
- API calls return 401
- No session data in storage
```

---

## 🧪 **TEST 6: ERROR HANDLING**

### **Step 1: Test Invalid Login**

```
Action: Try login with wrong credentials
Expected:
- Error message displayed
- No redirect to dashboard
- Session not established
```

### **Step 2: Test Network Issues**

```
Action: Disconnect internet and try login
Expected:
- Appropriate error handling
- User-friendly error messages
```

---

## 🧪 **TEST 7: SESSION EXPIRATION**

### **Step 1: Test Token Refresh**

```
Action: Wait for token to expire (or simulate)
Expected:
- Automatic token refresh
- User stays logged in
- No interruption in service
```

### **Step 2: Test Expired Session**

```
Action: Manually expire session in browser
Expected:
- Graceful handling of expired session
- Redirect to login if needed
```

---

## 📊 **TEST RESULTS SUMMARY**

### **✅ PASSED TESTS**

- [ ] Basic login/logout flow
- [ ] Session establishment
- [ ] Session persistence
- [ ] API authentication
- [ ] Auth state management
- [ ] Error handling
- [ ] Session expiration

### **❌ FAILED TESTS**

- [ ] List any failed tests here
- [ ] Note specific error messages
- [ ] Document unexpected behavior

---

## 🔧 **TROUBLESHOOTING COMMON ISSUES**

### **Issue: Session Not Established**

```
Symptoms:
- Login successful but no session
- API calls return 401
- Console shows "Session found: false"

Solutions:
1. Check Supabase client configuration
2. Verify environment variables
3. Check browser console for errors
4. Ensure cookies are enabled
```

### **Issue: Infinite Redirect Loop**

```
Symptoms:
- Page keeps redirecting between login and dashboard
- Browser shows redirect loop error

Solutions:
1. Clear browser storage and cookies
2. Check middleware configuration
3. Verify auth provider logic
4. Check for conflicting redirect logic
```

### **Issue: API Authentication Fails**

```
Symptoms:
- Dashboard loads but no data
- API calls return 401
- Console shows "Auth session missing"

Solutions:
1. Check server-side session handling
2. Verify cookie transmission
3. Check Supabase server client
4. Ensure proper session validation
```

---

## 🎯 **FINAL VERIFICATION**

### **Complete Auth System Checklist**

- [ ] ✅ Login works with valid credentials
- [ ] ✅ Session establishes and persists
- [ ] ✅ API calls work with authentication
- [ ] ✅ Logout clears session properly
- [ ] ✅ Error handling works correctly
- [ ] ✅ Session refresh works automatically
- [ ] ✅ Auth state management is consistent
- [ ] ✅ No infinite redirect loops
- [ ] ✅ No 401 errors when authenticated
- [ ] ✅ Session shared across browser tabs

### **🎉 AUTH SYSTEM STATUS**

If all tests pass: **AUTHENTICATION SYSTEM IS FULLY WORKING** ✅
If any tests fail: **NEEDS FURTHER INVESTIGATION** ⚠️

---

## 📝 **NOTES**

- Keep this guide for future testing
- Update with any new auth features
- Document any specific issues found
- Use this for regression testing after changes
