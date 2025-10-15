# 🧪 Testing Guide - Promoters System Fixes

## Quick Test Script (15 minutes)

### ✅ Test #1: Security - RBAC Protection

**What to test:** Verify endpoints require authentication

```bash
# Test unauthenticated access (should fail with 401)
curl -X GET https://portal.thesmartpro.io/api/promoters

# Expected Output:
# {"error": "Unauthorized"} or similar
# Status: 401
```

**Result:** ☐ Pass / ☐ Fail

---

### ✅ Test #2: Pagination - Backend

**What to test:** Verify pagination works on API

```bash
# Test page 1
curl -X GET "https://portal.thesmartpro.io/api/promoters?page=1&limit=10"

# Expected Output:
# {
#   "success": true,
#   "promoters": [...],  // 10 items or less
#   "pagination": {
#     "page": 1,
#     "limit": 10,
#     "total": X,
#     "totalPages": Y,
#     "hasNext": true/false,
#     "hasPrev": false
#   }
# }
```

**Result:** ☐ Pass / ☐ Fail

---

### ✅ Test #3: Debug Component Hidden

**What to test:** Debug component not visible in production

**Steps:**
1. Open https://portal.thesmartpro.io/en/promoters
2. Look at the page
3. Verify NO debug panel showing environment info

**Expected:** Debug component should NOT be visible

**Result:** ☐ Pass / ☐ Fail

---

### ✅ Test #4: Debug Endpoint Protected

**What to test:** Debug endpoint returns 404 in production

```bash
# Test debug endpoint (should return 404 in production)
curl -X GET https://portal.thesmartpro.io/api/promoters/debug

# Expected Output:
# {"error": "Not found"}
# Status: 404
```

**Result:** ☐ Pass / ☐ Fail

---

### ✅ Test #5: Pagination UI

**What to test:** Pagination controls work in frontend

**Steps:**
1. Open https://portal.thesmartpro.io/en/promoters
2. Login if required
3. Scroll to bottom of promoters table
4. Verify pagination controls visible (if > 50 promoters)
5. Click "Next" button
6. Verify page changes and new data loads
7. Check URL updates with ?page=2
8. Verify "Previous" button becomes enabled

**Expected:**
- Pagination controls visible
- "Showing X to Y of Z promoters" text
- Buttons work correctly
- Data refreshes on page change

**Result:** ☐ Pass / ☐ Fail

---

### ✅ Test #6: Database Indexes

**What to test:** Verify indexes were created

**Run in Supabase SQL Editor:**
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'promoters' 
  AND schemaname = 'public'
ORDER BY indexname;
```

**Expected:** Should see 12+ indexes including:
- idx_promoters_status
- idx_promoters_created_at
- idx_promoters_created_by
- idx_promoters_pagination
- (and more...)

**Result:** ☐ Pass / ☐ Fail

---

### ✅ Test #7: Performance Check

**What to test:** API response time improved

**Run in terminal:**
```bash
# Test API response time
time curl -X GET "https://portal.thesmartpro.io/api/promoters?page=1&limit=50"
```

**Expected:** Response time < 500ms (was ~2s before)

**Result:** ☐ Pass / ☐ Fail

---

### ✅ Test #8: Data Scoping

**What to test:** Users only see their own promoters

**Steps:**
1. Login as **regular user** (non-admin)
2. Go to promoters page
3. Note the number of promoters shown
4. Verify these are only promoters created by this user

5. Logout and login as **admin**
6. Go to promoters page
7. Verify you see ALL promoters (more than before)

**Expected:**
- Regular users see limited promoters
- Admins see all promoters

**Result:** ☐ Pass / ☐ Fail

---

## 🔄 Complete Test Flow

**Run this complete flow to verify everything:**

1. **Database Setup**
   ```sql
   -- In Supabase SQL Editor
   -- Run: supabase/migrations/20251015_add_pdf_url_to_contracts.sql
   -- Run: supabase/migrations/20251015_add_promoters_indexes.sql
   ```

2. **Deploy Code**
   ```bash
   git push origin main
   # Wait for Vercel/Netlify deployment
   ```

3. **Test Authentication**
   - Try accessing without login → Should redirect/fail
   - Login as regular user → Should see limited promoters
   - Login as admin → Should see all promoters

4. **Test Pagination**
   - If more than 50 promoters exist:
     - Verify pagination controls appear
     - Test Next/Previous buttons
     - Verify page numbers update
     - Check data refreshes correctly

5. **Test Performance**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Load promoters page
   - Check API request time
   - Should be < 500ms

6. **Verify Production Security**
   - Debug component NOT visible
   - Debug endpoint returns 404
   - Environment vars NOT exposed

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized Errors

**Possible causes:**
- User not logged in
- Session expired
- Permissions not configured

**Solutions:**
1. Clear cookies and login again
2. Check user has correct role in database
3. Verify RBAC permissions configured

---

### Issue: Pagination Not Showing

**Possible causes:**
- Less than 50 promoters in database
- Frontend not updated
- API response missing pagination

**Solutions:**
1. Check total promoter count
2. Hard refresh browser (Ctrl+Shift+R)
3. Check API response includes "pagination" field

---

### Issue: Slow Performance

**Possible causes:**
- Indexes not created
- Database needs ANALYZE
- Too many records without pagination

**Solutions:**
1. Verify indexes exist:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'promoters';
   ```
2. Run ANALYZE:
   ```sql
   ANALYZE promoters;
   ```
3. Check query plans:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM promoters LIMIT 50;
   ```

---

## ✅ Final Verification Checklist

Before marking as complete, verify:

- [ ] All database migrations ran successfully
- [ ] Code deployed to production
- [ ] GET /api/promoters requires authentication
- [ ] POST /api/promoters requires authentication
- [ ] Debug endpoint returns 404 in production
- [ ] Debug component hidden in production
- [ ] Pagination works (if > 50 promoters)
- [ ] Performance improved (< 500ms response time)
- [ ] Database indexes created (12+ indexes)
- [ ] No console errors in browser
- [ ] No linter errors in code
- [ ] All 8 manual tests pass

---

## 📊 Test Results Template

Copy this template and fill in results:

```
=== PROMOTERS SYSTEM TEST RESULTS ===
Date: _______________
Tester: ______________
Environment: Production / Staging / Development

Test #1: Security (RBAC) ............... ☐ Pass / ☐ Fail
Test #2: Pagination Backend ............ ☐ Pass / ☐ Fail
Test #3: Debug Component Hidden ........ ☐ Pass / ☐ Fail
Test #4: Debug Endpoint Protected ...... ☐ Pass / ☐ Fail
Test #5: Pagination UI ................. ☐ Pass / ☐ Fail
Test #6: Database Indexes .............. ☐ Pass / ☐ Fail
Test #7: Performance Check ............. ☐ Pass / ☐ Fail
Test #8: Data Scoping .................. ☐ Pass / ☐ Fail

Overall Result: ☐ All Pass / ☐ Some Failed

Notes:
_________________________________
_________________________________
_________________________________

Signed: _______________ Date: _______
```

---

## 🎯 Success Criteria

**All tests must pass** before marking implementation complete:

✅ **Security Tests** (Tests 1, 4, 8)
- RBAC protection working
- Debug endpoint protected
- Data scoping implemented

✅ **Performance Tests** (Tests 6, 7)
- Indexes created
- Response time < 500ms

✅ **Functionality Tests** (Tests 2, 3, 5)
- Pagination works backend
- Pagination works frontend
- Debug component hidden

**If any test fails**, review the implementation and fix before deploying.

---

**Testing Status:** ⏳ Pending Manual Verification  
**Automated Tests:** Not yet implemented (future enhancement)  
**Next Step:** Run manual tests and verify all pass  

*End of Testing Guide*

