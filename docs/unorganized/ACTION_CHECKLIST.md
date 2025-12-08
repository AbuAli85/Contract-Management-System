# ✅ Action Checklist - Production URL Fixes

## 🚨 CRITICAL - Do These First!

### Production Environment (portal.thesmartpro.io)

#### ☑️ 1. Database Migration (5 minutes)

```bash
# Go to Supabase Dashboard → SQL Editor
# Copy & paste from: supabase/migrations/20251015_add_pdf_url_to_contracts.sql
# Click "Run"
```

**Verify:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='contracts'
AND column_name IN ('pdf_url', 'google_doc_url');
```

Expected: 2 rows returned

**Regenerate TypeScript Types (optional but recommended):**

```bash
# If using Supabase CLI
supabase gen types typescript --local > types/supabase.ts

# This fixes TypeScript linter errors
```

---

#### ☑️ 2. Add Environment Variables (3 minutes)

Go to your deployment platform (Vercel/Netlify) and add:

```env
NEXT_PUBLIC_API_URL=https://portal.thesmartpro.io
NEXT_PUBLIC_SITE_URL=https://portal.thesmartpro.io
WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
```

---

#### ☑️ 3. Deploy Changes (2 minutes)

```bash
# Option A: Git push triggers auto-deploy
git push origin main

# Option B: Manual deploy in Vercel/Netlify dashboard
```

---

#### ☑️ 4. Verify Production (5 minutes)

**Test 1: Promoters Page**

1. Visit: https://portal.thesmartpro.io/en/promoters
2. Should load without errors
3. Click "Test Direct API" button
4. Should show promoters data (not CORS error)

**Test 2: Contract Generation**

1. Create a test contract
2. Generate PDF
3. Check database: PDF URL should be saved

**Test 3: Browser Console**

1. Open DevTools (F12)
2. Navigate to promoters page
3. Should see: ✅ "Successfully fetched X promoters"
4. Should NOT see: ❌ CORS errors

---

## 📋 Development Environment

#### ☑️ 1. Update .env.local (2 minutes)

```bash
# Add these lines to .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
WEBHOOK_URL=https://hook.eu2.make.com/your-webhook-id-here
```

---

#### ☑️ 2. Run Migration (2 minutes)

```bash
supabase db push
# OR manually in Supabase dashboard
```

---

#### ☑️ 3. Restart Dev Server (1 minute)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

#### ☑️ 4. Test Locally (3 minutes)

1. Visit: http://localhost:3000/en/promoters
2. Click "Test Direct API"
3. Should work without errors

---

## 🎯 Quick Verification Commands

### Check Database Migration Applied

```sql
-- Run in Supabase SQL Editor
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'contracts'
  AND column_name IN ('pdf_url', 'google_doc_url');
```

### Check Environment Variables Set

```bash
# In terminal (development)
echo $NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_SITE_URL

# In browser console (production)
console.log(process.env.NEXT_PUBLIC_API_URL)
```

### Test API Endpoint

```bash
# Development
curl http://localhost:3000/api/promoters

# Production
curl https://portal.thesmartpro.io/api/promoters
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: CORS Error Still Appears

```bash
# Solution:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear all caches
3. Verify environment variables are set
4. Restart application
```

### Issue 2: PDF URL Not Saving

```bash
# Solution:
1. Verify migration ran: Check database columns
2. Check TypeScript: No errors in console
3. Verify API route is using updated code
```

### Issue 3: Environment Variables Not Working

```bash
# Solution:
1. Check variable names (exact match required)
2. Restart dev server after adding variables
3. Redeploy production after adding variables
4. Check deployment platform dashboard
```

---

## 📊 Success Criteria

### ✅ All Green Checklist

- [ ] Database migration applied successfully
- [ ] All environment variables added
- [ ] Production deployed with new code
- [ ] Promoters page loads without errors
- [ ] "Test Direct API" returns data (not CORS error)
- [ ] Contract generation saves PDF URL
- [ ] No TypeScript errors in console
- [ ] No runtime errors in server logs
- [ ] Browser console shows success messages
- [ ] Webhooks are triggered correctly

### 🎉 When All Checked:

**Status: ✅ READY FOR PRODUCTION USE**

---

## 📞 Emergency Rollback

If something goes wrong:

### 1. Revert Environment Variables

```bash
# Remove the new variables temporarily
# System will fall back to default behavior
```

### 2. Revert Code (if needed)

```bash
git revert HEAD
git push origin main
```

### 3. Database Rollback (if needed)

```sql
-- Only if absolutely necessary
ALTER TABLE contracts DROP COLUMN IF EXISTS pdf_url;
ALTER TABLE contracts DROP COLUMN IF EXISTS google_doc_url;
```

---

## ⏱️ Total Time Estimate

- **Production Setup:** ~15 minutes
- **Development Setup:** ~8 minutes
- **Testing & Verification:** ~10 minutes
- **Total:** ~35 minutes

---

## 📝 Notes

- **No breaking changes** - Existing functionality preserved
- **Safe migration** - Uses IF NOT EXISTS checks
- **Backward compatible** - Fallback values provided
- **Zero downtime** - Can be applied during normal operation

---

## ✨ After Completion

You should see:

- ✅ No CORS errors in any environment
- ✅ Promoters page fully functional
- ✅ Contract generation working correctly
- ✅ Clean browser console
- ✅ No TypeScript errors
- ✅ All features working as expected

---

**Priority:** 🔴 HIGH - Production fixes required  
**Difficulty:** 🟢 LOW - Straightforward configuration changes  
**Risk:** 🟢 LOW - No breaking changes, safe migrations  
**Time:** ⏱️ 35 minutes total

---

_Last Updated: October 15, 2025_  
_Status: Ready to Execute_
