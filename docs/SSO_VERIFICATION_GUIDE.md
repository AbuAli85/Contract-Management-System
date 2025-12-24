# 🔍 SSO Configuration Verification Guide

**Purpose:** Verify that all platforms are correctly configured for Single Sign-On (SSO)

---

## ✅ Contract-Management-System Status

**Status:** ✅ **CONFIGURED**

All Supabase client files have been updated with:
- ✅ `storageKey: 'sb-auth-token'`
- ✅ `localStorage` storage configuration
- ✅ Required auth settings (persistSession, autoRefreshToken, detectSessionInUrl)

**Files Updated:**
- `lib/supabase/client.ts` (SSR client with localStorage sync)
- `lib/supabaseClient.ts` (Standard client)
- `lib/supabase/client-pages.ts` (Pages directory client)

---

## 🔍 Verification Methods

### Method 1: Browser Console Check (Quickest)

**Step 1:** Open any platform in your browser

**Step 2:** Open browser console (F12)

**Step 3:** Run this command:
```javascript
localStorage.getItem('sb-auth-token')
```

**Expected Results:**
- ✅ **After login:** Returns JSON string with session data
- ❌ **Not configured:** Returns `null`
- ❌ **Wrong key:** Returns `null` (check what key is being used)

**Step 4:** Compare across platforms
```javascript
// Run on BusinessHub (after login)
localStorage.getItem('sb-auth-token')
// Copy the result

// Run on Contract-Management-System
localStorage.getItem('sb-auth-token')
// Should return the SAME value ✅
```

---

### Method 2: Automated Script Check

**For Contract-Management-System:**

```bash
npx tsx scripts/verify-sso-config.ts
```

**Expected Output:**
```
🔍 SSO Configuration Verification

Checking Supabase client files for SSO configuration...

Required storageKey: 'sb-auth-token'

────────────────────────────────────────────────────────────────────────────────

📄 lib/supabase/client.ts
   Status: ✅ PASS
   ✅ File exists
   ✅ Has storageKey: 'sb-auth-token'
   ✅ Has auth configuration

📄 lib/supabaseClient.ts
   Status: ✅ PASS
   ✅ File exists
   ✅ Has storageKey: 'sb-auth-token'
   ✅ Has auth configuration

📄 lib/supabase/client-pages.ts
   Status: ✅ PASS
   ✅ File exists
   ✅ Has storageKey: 'sb-auth-token'
   ✅ Has auth configuration

────────────────────────────────────────────────────────────────────────────────

📊 Summary:
   ✅ Pass: 3
   ⚠️  Warning: 0
   ❌ Fail: 0

🎉 All files are correctly configured for SSO!
```

---

### Method 3: Browser Diagnostic Script

**Step 1:** Open browser console (F12) on any platform

**Step 2:** Copy and paste the entire contents of `scripts/check-sso-browser.js`

**Step 3:** Press Enter

**Expected Output:**
```
🔍 SSO Configuration Diagnostic
────────────────────────────────────────────

📦 Checking localStorage...
   ✅ Found 'sb-auth-token' in localStorage
   ✅ Session data is valid JSON
   ✅ Active session detected
   📝 Access token: eyJhbGciOiJIUzI1NiIsInR...

🔗 Checking Supabase configuration...
   📍 Current URL: https://portal.thesmartpro.io/...

🔧 Checking Supabase client...
   ℹ️  Supabase client not exposed on window (this is normal)

🌐 Cross-platform SSO check...
   ℹ️  To verify SSO:
      1. Login on BusinessHub
      2. Open this platform in another tab
      3. Run this script again
      4. Should see the same session data

────────────────────────────────────────────

📊 Diagnostic Summary:
   Storage Key: ✅ Found
   Active Session: ✅ Yes
   Issues Found: 0
```

---

## 🧪 Testing SSO

### Test 1: Same Browser, Different Tabs

1. **Login** on BusinessHub (Tab 1)
2. **Open** Contract-Management-System in new tab (Tab 2)
3. **Expected:** Should be automatically logged in ✅

**If not working:**
- Check browser console for errors
- Verify `localStorage.getItem('sb-auth-token')` returns data on both tabs
- Clear cache and try again

---

### Test 2: After Page Refresh

1. **Login** on BusinessHub
2. **Open** Contract-Management-System
3. **Refresh** the page (F5)
4. **Expected:** Should still be logged in ✅

**If not working:**
- Session might not be persisting
- Check if `persistSession: true` is configured
- Verify localStorage is not being cleared

---

### Test 3: Cross-Platform

1. **Login** on BusinessHub
2. **Open** business-services-hub
3. **Expected:** Should be logged in ✅

**If not working:**
- business-services-hub might not be configured
- Check its Supabase client configuration
- Verify it uses `storageKey: 'sb-auth-token'`

---

## 🐛 Troubleshooting

### Issue: `localStorage.getItem('sb-auth-token')` returns `null`

**Possible Causes:**
1. Platform not configured with `storageKey: 'sb-auth-token'`
2. User not logged in
3. localStorage cleared
4. Different storage key being used

**Solutions:**
1. Check Supabase client configuration file
2. Verify `storageKey: 'sb-auth-token'` is set
3. Login again and check
4. Check what keys exist: `Object.keys(localStorage).filter(k => k.includes('auth'))`

---

### Issue: Different session data on different platforms

**Possible Causes:**
1. Different Supabase projects
2. Different storage keys
3. Session not syncing

**Solutions:**
1. Verify all platforms use same Supabase URL
2. Verify all platforms use same `storageKey`
3. Check browser console for errors
4. Try clearing localStorage and logging in again

---

### Issue: Session works on one platform but not others

**Possible Causes:**
1. Other platforms not configured
2. Different storage keys
3. CORS issues

**Solutions:**
1. Update other platforms' Supabase client configuration
2. Ensure all use `storageKey: 'sb-auth-token'`
3. Check browser console for CORS errors
4. Verify all platforms are on same domain (or configure CORS)

---

## 📋 Checklist for Other Platforms

When checking **business-services-hub** or other platforms:

- [ ] Find Supabase client file (usually `lib/supabase/client.ts` or similar)
- [ ] Verify it has `storageKey: 'sb-auth-token'`
- [ ] Verify it has `storage: typeof window !== 'undefined' ? window.localStorage : undefined`
- [ ] Verify it has `persistSession: true`
- [ ] Verify it has `autoRefreshToken: true`
- [ ] Verify it has `detectSessionInUrl: true`
- [ ] Run browser console check: `localStorage.getItem('sb-auth-token')`
- [ ] Test cross-platform login

---

## 🔗 Related Files

- `lib/supabase/client.ts` - Main SSR client (Contract-Management-System)
- `lib/supabaseClient.ts` - Standard client (Contract-Management-System)
- `lib/supabase/client-pages.ts` - Pages directory client (Contract-Management-System)
- `scripts/verify-sso-config.ts` - Automated verification script
- `scripts/check-sso-browser.js` - Browser console diagnostic

---

## ✅ Success Criteria

SSO is working correctly when:

1. ✅ Login on BusinessHub
2. ✅ Open Contract-Management-System → Automatically logged in
3. ✅ Open business-services-hub → Automatically logged in
4. ✅ Refresh any page → Still logged in
5. ✅ `localStorage.getItem('sb-auth-token')` returns same value on all platforms
6. ✅ Session persists across browser tabs

---

## 📞 Next Steps

1. **Verify Contract-Management-System:** ✅ Already done
2. **Verify business-services-hub:** Check its configuration
3. **Test SSO:** Login on one platform, check others
4. **Monitor:** Check browser console for any errors

---

**Last Updated:** After SSO configuration update
**Status:** Contract-Management-System ✅ Configured

