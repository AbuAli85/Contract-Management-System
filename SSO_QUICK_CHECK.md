# 🔍 SSO Quick Check Guide

**Quick reference for verifying SSO configuration across platforms**

---

## ✅ Contract-Management-System Status

**✅ CONFIGURED** - All Supabase clients updated with `storageKey: 'sb-auth-token'`

---

## 🚀 Quick Browser Check (30 seconds)

### Step 1: Open Browser Console
Press `F12` on any platform

### Step 2: Run This Command
```javascript
localStorage.getItem('sb-auth-token')
```

### Step 3: Check Result

**✅ If returns JSON string:**
- SSO is configured correctly
- Session is active (if logged in)

**❌ If returns `null`:**
- Platform not configured OR
- Not logged in OR
- Wrong storage key being used

---

## 🧪 Test SSO (2 minutes)

### Test Procedure:
1. **Login** on BusinessHub
2. **Open** Contract-Management-System in new tab
3. **Check:** Should be automatically logged in ✅

### If Not Working:
```javascript
// Check storage on BusinessHub (after login)
localStorage.getItem('sb-auth-token')
// Copy the result

// Check storage on Contract-Management-System
localStorage.getItem('sb-auth-token')
// Should match ✅
```

---

## 🔧 Automated Verification

### Run This Command:
```bash
npx tsx scripts/verify-sso-config.ts
```

**Expected:** All files should show ✅ PASS

---

## 📋 What to Check on Other Platforms

When checking **business-services-hub**:

1. **Find Supabase client file:**
   - `lib/supabase/client.ts`
   - `utils/supabase/client.ts`
   - `src/lib/supabase.ts`

2. **Verify it has:**
   ```typescript
   storageKey: 'sb-auth-token',
   storage: typeof window !== 'undefined' ? window.localStorage : undefined,
   ```

3. **Run browser check:**
   ```javascript
   localStorage.getItem('sb-auth-token')
   ```

---

## 🐛 Common Issues

### Issue: Returns `null` after login
**Fix:** Platform needs `storageKey: 'sb-auth-token'` configuration

### Issue: Different values on different platforms
**Fix:** Verify all platforms use same `storageKey`

### Issue: Session not persisting
**Fix:** Check `persistSession: true` is set

---

## 📚 Full Documentation

See `docs/SSO_VERIFICATION_GUIDE.md` for complete guide

---

## ✅ Success Checklist

- [ ] Contract-Management-System configured ✅
- [ ] business-services-hub configured (check needed)
- [ ] BusinessHub configured ✅
- [ ] Login works across all platforms
- [ ] Session persists after refresh
- [ ] `localStorage.getItem('sb-auth-token')` returns same value everywhere

---

**Last Updated:** After SSO configuration
**Status:** Contract-Management-System ✅ Ready

