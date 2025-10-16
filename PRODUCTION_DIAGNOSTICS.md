# Production Diagnostics - Enhanced Promoters View

## 🔍 Live Site Diagnostics (portal.thesmartpro.io/en/promoters)

### Step 1: Open Browser DevTools
```
Press F12 on your keyboard
This opens the Developer Tools
```

---

## ✅ TEST EACH FEATURE BELOW

### Test 1: VIEW PROFILE FUNCTIONALITY

**Steps:**
1. Open the promoters page
2. Find any promoter in the table
3. Look for the three-dots (•••) button at the end of the row
4. Click the three-dots button
5. Menu appears with options
6. Click "View profile"

**Expected Result:**
- Menu closes
- Page navigates to promoter's profile page
- URL changes to something like `/en/promoters/{id}`

**If NOT working:**
- Go to F12 Console tab
- Look for red error messages
- Screenshot and share the error

---

### Test 2: EDIT DETAILS FUNCTIONALITY

**Steps:**
1. Click three-dots (•••) button on any promoter
2. Click "Edit details"

**Expected Result:**
- Menu closes
- Page navigates to edit form
- URL changes to something like `/en/manage-promoters/{id}`

**If NOT working:**
- Check F12 Console for errors
- Screenshot the error

---

### Test 3: SEND NOTIFICATION FUNCTIONALITY

**Steps:**
1. Click three-dots (•••) on any promoter
2. Look for "Send notification" or "Remind to renew docs"
3. Click one of these options

**Expected Result:**
- A toast notification appears at bottom-right saying "✓ Notification sent"
- Menu closes
- No errors in console

**If NOT working:**
- Check F12 Network tab
- Look for a POST request to `/api/promoters/*/notify`
- Check if it's failing (red X status)

---

### Test 4: ARCHIVE FUNCTIONALITY

**Steps:**
1. Click three-dots (•••) on any promoter
2. Scroll down to "Archive record"
3. Click "Archive record"

**Expected Result:**
- A confirmation dialog appears
- Shows promoter name asking "Are you sure?"
- Two buttons: "Cancel" and "Archive"
- Click "Archive"
- Toast appears: "✓ Record Archived"

**If NOT working:**
- Dialog doesn't appear → Check console for errors
- Click Archive but nothing happens → Check Network tab for failed requests
- Error appears in dialog → Check `/api/promoters/:id/archive` endpoint

---

### Test 5: CONTEXT-AWARE ACTIONS

**Steps:**
1. Find a promoter with **expiring documents** (shown in yellow/amber)
2. Click three-dots
3. Look for "⚠️ At Risk" section

**Expected Result:**
- Should see "Remind to renew docs" option

**If NOT showing:**
- Promoter's documents might be valid
- Try finding a different promoter with expiring docs
- Check if `idDocument.status` or `passportDocument.status` is 'expiring'

---

### Test 6: CRITICAL ACTIONS

**Steps:**
1. Find a promoter with **expired documents** (shown in red)
2. Click three-dots
3. Look for "🚨 Critical" section

**Expected Result:**
- Should see "Urgent notification" option

**If NOT showing:**
- All documents might be valid
- Check status badges in table

---

### Test 7: UNASSIGNED ACTIONS

**Steps:**
1. Find a promoter with "○ Unassigned" status
2. Click three-dots

**Expected Result:**
- Should see "Unassigned" section
- Should see "Assign to company" option

**If NOT showing:**
- All promoters might be assigned
- Check Assignment column for "Unassigned" status

---

## 🐛 TROUBLESHOOTING GUIDE

### Problem 1: Menu Doesn't Open

**Diagnosis:**
```
1. F12 → Console tab
2. Click three-dots button
3. Look for error messages
```

**Common Causes:**
- Dropdown Menu component not imported
- Permissions issue
- JavaScript error

**Solution:**
- Check console for errors
- Report the exact error message

---

### Problem 2: Menu Opens But Items Don't Work

**Diagnosis:**
```
1. F12 → Console tab
2. Click a menu item
3. Check for "Error" messages
4. F12 → Network tab
5. Look for failed requests
```

**Common Causes:**
- `onView` or `onEdit` handlers not passed correctly
- Missing API endpoints
- Authentication issues

**Solution:**
- Check if handlers are provided
- Implement missing API endpoints

---

### Problem 3: Toast Notifications Don't Appear

**Diagnosis:**
```
1. F12 → Console tab
2. Click any action (Send notification, etc.)
3. Look for toast-related errors
```

**Common Causes:**
- Toast provider not set up
- `useToast` hook not working
- Toast style CSS missing

**Solution:**
- Verify ToastProvider is wrapping the app
- Check if toast CSS is loaded

---

### Problem 4: "Send Notification" Shows Error

**Diagnosis:**
```
1. F12 → Console tab
2. Click "Send notification"
3. Check for network error message
4. F12 → Network tab
5. Look for POST request to /api/promoters/*/notify
6. Check response status and error
```

**Common Causes:**
- API endpoint not implemented
- Authentication failed
- Email service not configured

**Solutions:**

**If 404 error:**
- Endpoint `/api/promoters/:id/notify` doesn't exist
- Implement the endpoint (see API_ENDPOINTS_REQUIRED.md)
- OR the component has fallback - should show success anyway

**If 401 error:**
- Authentication failed
- Check if auth token is valid
- Verify user permissions

**If 500 error:**
- Server error
- Check server logs
- Verify email service is running

---

### Problem 5: Archive Shows Dialog But Nothing Happens

**Diagnosis:**
```
1. F12 → Network tab
2. Click Archive button in dialog
3. Look for PUT request to /api/promoters/*/archive
4. Check response status
```

**Common Causes:**
- API endpoint not implemented
- Database error
- Permission denied

**Solution:**
- Implement `/api/promoters/:id/archive` endpoint
- Check server logs
- Verify user has permission

---

## 📊 NETWORK DIAGNOSTICS

### How to Check Network Requests

1. **Open DevTools:** F12
2. **Go to Network tab**
3. **Perform an action** (click menu item, send notification, etc.)
4. **Look for new requests**
5. **Click on the request to see:**
   - Request Headers (method, URL, auth token)
   - Request Body (data being sent)
   - Response Headers (status code, content-type)
   - Response Body (error message or success)

### Expected Network Requests

**When clicking "View profile":**
- Type: Navigation
- Should load new page
- No API call

**When clicking "Send notification":**
- Type: XHR (XMLHttpRequest)
- Method: POST
- URL: `/api/promoters/{id}/notify`
- Status: Should be 200 (or 404 if not implemented)

**When archiving:**
- Type: XHR
- Method: PUT
- URL: `/api/promoters/{id}/archive`
- Status: Should be 200 (or 404 if not implemented)

---

## 📋 CHECKLIST FOR REPORTING ISSUES

When reporting a problem, provide:

- [ ] **Specific feature broken** (View, Edit, Send, Archive)
- [ ] **Screenshot of browser console** (F12 → Console tab)
- [ ] **Screenshot of network errors** (F12 → Network tab)
- [ ] **Steps to reproduce** the issue
- [ ] **Expected vs actual behavior**
- [ ] **Browser and OS** being used
- [ ] **Any error messages** shown

---

## 🔧 POTENTIAL FIXES

### If Menu Items Don't Work

**Solution 1: Check onView and onEdit Handlers**

```typescript
// This should be in the row rendering:
<EnhancedActionsMenu
  promoter={promoter}
  onView={() => router.push(`/en/promoters/${promoter.id}`)}  // Must have
  onEdit={() => router.push(`/en/manage-promoters/${promoter.id}`)}  // Must have
/>
```

**Solution 2: Verify Navigation Functions**

```typescript
// Make sure these functions exist:
const handleViewPromoter = useCallback((promoter) => {
  router.push(`/${locale}/promoters/${promoter.id}`);
}, [router, locale]);

const handleEditPromoter = useCallback((promoter) => {
  router.push(`/${locale}/manage-promoters/${promoter.id}`);
}, [router, locale]);
```

---

### If API Calls Fail

**Solution 1: Implement Missing Endpoints**

You need these three endpoints:

```
GET    /api/promoters               ✓ Already exists
POST   /api/promoters/:id/notify    ❌ Missing - needs implementation
PUT    /api/promoters/:id/archive   ❌ Missing - needs implementation
```

**Solution 2: Check Authentication**

```typescript
// Add auth header to API calls:
const response = await fetch(`/api/promoters/${id}/notify`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,  // Add if needed
  },
  body: JSON.stringify({ type: 'standard' }),
});
```

---

### If Toast Notifications Don't Show

**Solution 1: Verify Toast Provider**

```typescript
// Check if ToastProvider is at root level:
<ToastProvider>
  <YourApp />
</ToastProvider>
```

**Solution 2: Check Import**

```typescript
// Verify correct import:
import { useToast } from '@/hooks/use-toast';

// NOT:
import { useToast } from 'sonner'; // Wrong
```

---

## 📞 SUPPORT INFORMATION

### To Get Help, Provide:

1. **Exact URL:** https://portal.thesmartpro.io/en/promoters
2. **Browser:** Chrome, Firefox, Safari, Edge
3. **Issue Description:** What doesn't work
4. **Screenshot of Console Error:** F12 → Console → Red error
5. **Network Error:** F12 → Network → Failed request details
6. **Steps to Reproduce:** Exact steps to see the problem

### Common Solutions:

| Symptom | Solution |
|---------|----------|
| Menu doesn't open | Check console for errors, verify DropdownMenu component |
| Menu opens but items don't work | Verify onView/onEdit handlers passed, check console |
| Send notification fails with 404 | Implement `/api/promoters/:id/notify` endpoint |
| Archive fails with 404 | Implement `/api/promoters/:id/archive` endpoint |
| Toast doesn't appear | Verify ToastProvider at root, check use-toast import |
| Page doesn't navigate | Verify router is provided and locale is correct |

---

## 🎯 NEXT STEPS

1. **Run through all 7 tests above**
2. **Note which ones fail**
3. **Collect console errors** (F12 → Console)
4. **Collect network errors** (F12 → Network)
5. **Share this information**
6. **I'll provide targeted fixes**

---

## ✅ VERIFICATION

Once fixed, verify:
- [ ] View Profile navigates correctly
- [ ] Edit Details opens edit form
- [ ] Send Notification shows success toast
- [ ] Archive shows confirmation dialog
- [ ] Context-aware actions show/hide correctly
- [ ] No errors in browser console
- [ ] All network requests succeed (200 status)
- [ ] Works on desktop and mobile

**Last Updated:** January 2024
**Component Version:** 2.0 Enhanced
**Status:** Ready for Production (pending backend endpoints)
