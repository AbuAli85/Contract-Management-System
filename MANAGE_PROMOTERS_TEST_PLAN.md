# 🧪 Test Plan: Manage Promoters Fix

## 📝 Overview

This document outlines the testing procedure to verify that the "Unable to load promoters from the server" error has been fixed on the Manage Promoters page.

## 🎯 Test Objectives

1. Verify permissions are correctly granted to users
2. Confirm Manage Promoters page loads without errors
3. Validate error messages are helpful and actionable
4. Ensure RLS policies and RBAC work together correctly

## 🔧 Pre-Test Setup

### 1. Run the Permission Fix Script

```sql
-- In Supabase SQL Editor, run:
scripts/fix-manage-promoters-permissions.sql
```

**Expected Output:**

- ✅ Permissions granted
- List of users with promoter permissions
- No warnings about missing permissions

### 2. Clear Browser State

```bash
# Clear cookies, cache, and local storage
# Or use incognito/private browsing mode
```

### 3. Restart Development Server (if applicable)

```bash
npm run dev
# or
yarn dev
```

## ✅ Test Cases

### Test Case 1: User WITH Permissions

**Scenario:** User has `promoter:read:own` permission

**Steps:**

1. Log in as a user with permissions
2. Navigate to `/en/manage-promoters`
3. Wait for page to load

**Expected Result:**

- ✅ Loading spinner appears briefly
- ✅ Promoters list displays successfully
- ✅ No errors in console
- ✅ API call to `/api/promoters` returns 200 OK
- ✅ Promoters data shows:
  - Name (English & Arabic)
  - ID card number
  - Status
  - Employer (if assigned)

**Verification SQL:**

```sql
-- Verify user has permission
SELECT
  p.email,
  perm.name as permission
FROM profiles p
JOIN rbac_user_role_assignments ura ON p.id = ura.user_id
JOIN rbac_role_permissions rp ON ura.role_id = rp.role_id
JOIN rbac_permissions perm ON rp.permission_id = perm.id
WHERE p.id = auth.uid()
  AND perm.resource = 'promoter'
  AND perm.action = 'read';
```

---

### Test Case 2: User WITHOUT Permissions (Error Handling)

**Scenario:** User lacks `promoter:read:own` permission

**Steps:**

1. Create a test user without permissions
2. Log in as that user
3. Navigate to `/en/manage-promoters`

**Expected Result:**

- ✅ Error message displays with amber/yellow styling
- ✅ Shows "Permission Denied" heading
- ✅ Displays required permission: `promoter:read:own`
- ✅ Shows "How to Fix This" section with 3 steps
- ✅ Includes "Retry" button
- ✅ Console shows detailed error information
- ✅ API call returns 403 Forbidden

**Create Test User Without Permissions:**

```sql
-- Remove promoter permissions from a test user
DELETE FROM rbac_user_role_assignments
WHERE user_id = 'TEST_USER_ID';
```

---

### Test Case 3: Authentication Error (401)

**Scenario:** User is not authenticated

**Steps:**

1. Log out of the application
2. Navigate to `/en/manage-promoters` (may redirect to login)
3. OR: Clear auth cookies while on the page

**Expected Result:**

- ✅ "Authentication Required" error message
- ✅ Amber/yellow styling
- ✅ Shows troubleshooting steps:
  - Log out and back in
  - Clear cookies/cache
  - Check account
- ✅ "Retry" button available

---

### Test Case 4: Compare with All Promoters Page

**Scenario:** Verify both pages work consistently

**Steps:**

1. Navigate to `/en/promoters` (All Promoters)
2. Verify it loads successfully
3. Navigate to `/en/manage-promoters` (Manage Promoters)
4. Verify it also loads successfully

**Expected Result:**

- ✅ Both pages load without errors
- ✅ Both show promoter data
- ✅ Both make successful API calls to `/api/promoters`
- ✅ Consistent data between pages

---

### Test Case 5: Browser Console Logs

**Scenario:** Verify detailed logging

**Steps:**

1. Open Browser DevTools → Console tab
2. Navigate to `/en/manage-promoters`

**Expected Console Output:**

**Success Case:**

```
🚀 PromoterManagement component mounted
🔄 useEffect triggered
📡 Fetching promoters...
📡 Response status: 200 OK
📡 API Response: { success: true, count: 112 }
📊 Promoters data: 112 items
```

**Permission Error Case:**

```
🚀 PromoterManagement component mounted
🔄 useEffect triggered
📡 Fetching promoters...
📡 Response status: 403 Forbidden
❌ API Error Response: {
  error: "Insufficient permissions",
  required_permission: "promoter:read:own",
  reason: "User does not have required permission"
}
❌ Error in fetchPromoters: {...}
```

---

### Test Case 6: Network Tab Analysis

**Scenario:** Verify API request details

**Steps:**

1. Open Browser DevTools → Network tab
2. Filter by "promoters"
3. Navigate to `/en/manage-promoters`
4. Click on `/api/promoters` request

**Expected Result:**

**Request Headers:**

```
Content-Type: application/json
Cookie: sb-access-token=... (auth token present)
```

**Success Response (200):**

```json
{
  "success": true,
  "promoters": [...],
  "count": 112,
  "total": 112,
  "pagination": {...},
  "timestamp": "2025-10-21T..."
}
```

**Permission Error Response (403):**

```json
{
  "error": "Insufficient permissions",
  "required_permission": "promoter:read:own",
  "reason": "User does not have required permission"
}
```

---

### Test Case 7: RLS Policy Check

**Scenario:** Verify RLS policies allow access

**Steps:**
Run diagnostic SQL:

```sql
-- Check RLS policies on promoters table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'promoters'
ORDER BY policyname;

-- Test actual access
SELECT COUNT(*) as accessible_promoters
FROM promoters;
```

**Expected Result:**

- ✅ RLS policies exist and are enabled
- ✅ User can access promoters via direct query
- ✅ Count matches what appears in the UI

---

### Test Case 8: Rate Limiting

**Scenario:** Verify rate limiting doesn't cause issues

**Steps:**

1. Rapidly refresh `/en/manage-promoters` page 10 times
2. Check for rate limit errors

**Expected Result:**

- ✅ First 5-10 requests succeed
- ✅ After limit, shows 429 error with clear message
- ✅ Includes "Retry-After" information
- ✅ Automatically recovers after waiting period

---

### Test Case 9: Different User Roles

**Scenario:** Test various user roles

**Test Users:**

1. **Admin** - Should have all permissions
2. **Manager** - Should have promoter access
3. **Regular User** - Should have promoter access after fix
4. **Guest/No Role** - Should get permission denied

**Verification:**

```sql
-- Check permissions for different roles
SELECT
  r.name as role_name,
  perm.name as permission
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions perm ON rp.permission_id = perm.id
WHERE perm.resource = 'promoter'
ORDER BY r.name, perm.name;
```

---

## 🐛 Regression Testing

### Check These Didn't Break

1. ✅ **All Promoters page** (`/en/promoters`) still works
2. ✅ **Individual promoter view** pages still work
3. ✅ **Promoter edit/create** functionality works
4. ✅ **Other protected pages** (contracts, parties) still work
5. ✅ **Authentication flow** works correctly
6. ✅ **API endpoints** for other resources work

---

## 📊 Performance Testing

### Load Time Benchmarks

**Acceptable Performance:**

- Initial page load: < 2 seconds
- API response time: < 1 second
- Data rendering: < 500ms

**Measure with:**

```javascript
// In browser console
performance.measure('page-load', 'navigationStart', 'loadEventEnd');
```

---

## 🔍 Debugging Commands

### If Tests Fail

**1. Check user permissions:**

```sql
-- See what the current user has
SELECT * FROM rbac_user_role_assignments
WHERE user_id = auth.uid() AND is_active = TRUE;
```

**2. Check permission cache:**

```sql
-- Clear permission cache if needed
-- (Implementation depends on your cache strategy)
```

**3. Check API logs:**

```bash
# In terminal/server logs, look for:
🔐 RBAC: BLOCKED - promoter:read:own for /api/promoters
```

**4. Test API directly:**

```bash
curl -X GET http://localhost:3000/api/promoters \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -v
```

---

## ✅ Test Completion Checklist

After running all tests, verify:

- [ ] Permission fix script executed successfully
- [ ] Users can access Manage Promoters page
- [ ] Error messages are helpful and actionable
- [ ] Console logs provide debugging information
- [ ] API returns correct status codes (200, 401, 403)
- [ ] Network requests show proper headers
- [ ] RLS policies work correctly
- [ ] No regression in other pages
- [ ] Performance is acceptable
- [ ] All user roles tested

---

## 📝 Test Report Template

```markdown
## Test Execution Report

**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**Environment:** Development / Staging / Production

### Test Results Summary

- Total Tests: 9
- Passed: X
- Failed: Y
- Blocked: Z

### Detailed Results

#### Test Case 1: User WITH Permissions

- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]
- Screenshot: [If applicable]

[Repeat for all test cases]

### Issues Found

1. [Issue description]
   - Severity: High / Medium / Low
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...

### Recommendations

- [Any suggestions for improvement]

### Sign-off

- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Ready for deployment
```

---

## 🚀 Ready for Production?

Before deploying to production:

1. ✅ All test cases pass in staging
2. ✅ Error messages reviewed and approved
3. ✅ Performance benchmarks met
4. ✅ Security review completed
5. ✅ Documentation updated
6. ✅ Team trained on new error messages
7. ✅ Rollback plan prepared

---

## 📞 Support & Escalation

If issues persist after testing:

1. **Review** console error messages
2. **Check** Supabase logs for RLS/auth issues
3. **Verify** RBAC tables are correctly set up
4. **Confirm** environment variables are set
5. **Contact** system administrator or DevOps team

---

## 📚 Related Documentation

- `MANAGE_PROMOTERS_FIX_GUIDE.md` - Fix instructions
- `scripts/fix-manage-promoters-permissions.sql` - Quick fix script
- `scripts/check-user-permissions.sql` - Diagnostic queries
- `README_RBAC.md` - RBAC system documentation
