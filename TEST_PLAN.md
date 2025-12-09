# Manage Parties Page - Error Handling Test Plan

## Overview

This document outlines test cases to verify the error handling improvements for the Manage Parties page.

## Test Environment Setup

### Prerequisites

- Development server running (`npm run dev`)
- Browser with Developer Tools open
- Supabase connection configured
- Valid authentication credentials

### Testing Tools

- Browser DevTools (Network tab)
- React Query DevTools (if installed)
- Server console logs

---

## Test Cases

### ✅ Test Case 1: Normal Page Load (Happy Path)

**Objective:** Verify the page loads successfully with valid data

**Steps:**

1. Navigate to `/[locale]/manage-parties`
2. Wait for page to load

**Expected Result:**

- Loading spinner appears briefly
- Parties table renders with data
- No errors in console
- Server logs show successful request with timing:
  ```
  [req_xxx] 🚀 Parties API Request started
  [req_xxx] 🔐 Auth check completed in XXms
  [req_xxx] ✅ Request completed successfully
  ```

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 2: Network Timeout

**Objective:** Verify timeout handling and retry logic

**Steps:**

1. Open Browser DevTools → Network tab
2. Throttle network to "Slow 3G" or "Offline"
3. Navigate to `/[locale]/manage-parties`
4. Wait 15+ seconds

**Expected Result:**

- Loading state persists during retry attempts
- After 3 retries (at 1s, 2s, 4s), error card displays:
  - Title: "Failed to Load Parties"
  - Message: "Request timeout: The server took too long to respond"
  - "Try Again" button visible
- Console shows retry attempts
- Server logs show request timeout or no request received

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 3: API Error (500 Internal Server Error)

**Objective:** Verify API error handling and display

**Steps:**

1. Temporarily modify API route to throw an error:
   ```typescript
   // In app/api/parties/route.ts, add at start of GET handler
   throw new Error('Test database connection failure');
   ```
2. Navigate to `/[locale]/manage-parties`
3. Observe error handling

**Expected Result:**

- Error card displays with:
  - Title: "Failed to Load Parties"
  - Error message: "Internal server error"
  - Development details visible (if NODE_ENV=development)
- Console shows error details
- Server logs show:
  ```
  [req_xxx] 💥 Unexpected error: {
    message: "Test database connection failure",
    stack: "...",
  }
  ```
- "Try Again" button works when error is fixed

**Cleanup:** Remove the test error from API route

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 4: Authentication Error (401 Unauthorized)

**Objective:** Verify authentication error handling

**Steps:**

1. Clear browser cookies/session
2. OR temporarily modify API to simulate auth failure:
   ```typescript
   // In app/api/parties/route.ts
   return NextResponse.json(
     {
       success: false,
       error: 'Unauthorized',
     },
     { status: 401 }
   );
   ```
3. Navigate to `/[locale]/manage-parties`

**Expected Result:**

- Error card displays with:
  - Authentication-related error message
  - "Back to Home" option prominent
- Server logs show:
  ```
  [req_xxx] ⚠️ No authenticated user found
  ```
- User redirected to login (if middleware configured)

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 5: Empty Database (No Parties)

**Objective:** Verify empty state handling

**Steps:**

1. Clear all parties from database OR use clean test database
2. Navigate to `/[locale]/manage-parties`

**Expected Result:**

- Page loads successfully (no error)
- Empty state card displays:
  - "No parties found" message
  - "Add New Party" button visible
- Server logs show:
  ```
  [req_xxx] ℹ️ No parties found (empty result set)
  [req_xxx] ✅ Request completed successfully { resultCount: 0 }
  ```

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 6: Manual Retry After Error

**Objective:** Verify manual retry functionality

**Steps:**

1. Simulate any error condition (e.g., disconnect network)
2. Wait for error card to display
3. Reconnect network or fix error condition
4. Click "Try Again" button

**Expected Result:**

- Loading spinner appears
- API request re-initiated
- On success, parties table loads normally
- On continued failure, error card reappears
- Console shows new request with fresh request ID

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 7: Automatic Retry with Exponential Backoff

**Objective:** Verify React Query retry logic

**Steps:**

1. Open Browser DevTools → Network tab
2. Set network to "Offline"
3. Navigate to `/[locale]/manage-parties`
4. Watch Network tab for retry attempts
5. In console, log retry attempts with timing

**Expected Result:**

- First attempt: immediate (0s)
- Second attempt: ~1 second delay
- Third attempt: ~2 seconds delay
- Fourth attempt: ~4 seconds delay
- After 3 retries, error displays
- Total time: ~7-8 seconds before error

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 8: Database Query Timeout

**Objective:** Verify slow query handling

**Steps:**

1. Simulate slow database query (modify Supabase query to add delay)
2. OR test with large dataset (1000+ records)
3. Navigate to `/[locale]/manage-parties`

**Expected Result:**

- If query takes <15s: page loads successfully
- If query takes >15s: timeout error displays
- Server logs show query duration:
  ```
  [req_xxx] 📝 Database query completed in XXXXms
  ```
- If slow, consider adding pagination or optimization

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 9: Malformed API Response

**Objective:** Verify response validation

**Steps:**

1. Temporarily modify API to return malformed data:
   ```typescript
   // Return invalid structure
   return NextResponse.json({ wrong: 'format' });
   ```
2. Navigate to `/[locale]/manage-parties`

**Expected Result:**

- Error card displays
- Console shows validation error
- Frontend doesn't crash (graceful degradation)

**Cleanup:** Fix API response format

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 10: JavaScript Runtime Error

**Objective:** Verify Error Boundary catches component errors

**Steps:**

1. Temporarily add code that throws error in component:
   ```typescript
   // In page.tsx render method
   throw new Error('Test component error');
   ```
2. Navigate to `/[locale]/manage-parties`

**Expected Result:**

- Error Boundary catches error
- Friendly error UI displays:
  - "Oops! Something went wrong"
  - Error details shown
  - "Reload Page" button works
  - "Go to Home" button works
- Stack trace visible in development mode
- Console logs error with component stack

**Cleanup:** Remove test error

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 11: Concurrent Users / Load Test

**Objective:** Verify error handling under load

**Steps:**

1. Use tool like Apache Bench or k6 to simulate concurrent requests:
   ```bash
   ab -n 100 -c 10 http://localhost:3000/api/parties?page=1&limit=20
   ```
2. Monitor server logs and response times

**Expected Result:**

- All requests complete successfully OR fail gracefully
- Server logs show individual request IDs
- No crashed requests
- Average response time logged
- Rate limiting activates if configured

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 12: Page Navigation After Error

**Objective:** Verify navigation works from error state

**Steps:**

1. Trigger any error to display error card
2. Click "Back to Home" button

**Expected Result:**

- Navigation to home page successful
- No errors in console
- Clean state (no leftover error state)

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 13: Error Details Toast (Development)

**Objective:** Verify detailed error viewing

**Steps:**

1. Ensure NODE_ENV=development
2. Trigger any error
3. Click "View Details" button

**Expected Result:**

- Toast notification appears with:
  - Full error message
  - Stack trace (if available)
  - Detailed error object
- Toast dismissible
- Does not crash application

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 14: Production Error Messages

**Objective:** Verify no sensitive data exposed in production

**Steps:**

1. Set NODE_ENV=production
2. Trigger various errors
3. Inspect error messages and responses

**Expected Result:**

- Generic error messages (no stack traces)
- No database credentials or internal paths exposed
- No detailed error objects in API responses
- User-friendly messages only
- Request IDs not exposed in production

**Status:** 🟢 PASS / 🔴 FAIL

---

### ✅ Test Case 15: Mobile Responsiveness

**Objective:** Verify error UI works on mobile

**Steps:**

1. Open DevTools → Toggle device toolbar
2. Select mobile device (iPhone, Android)
3. Trigger error scenarios
4. Test button interactions

**Expected Result:**

- Error card displays properly on small screens
- Buttons stack vertically if needed
- Text readable without zooming
- Touch targets adequate size
- No horizontal scrolling

**Status:** 🟢 PASS / 🔴 FAIL

---

## Performance Benchmarks

### Target Metrics

- **Initial Load:** < 2 seconds
- **Auth Check:** < 100ms
- **Database Query:** < 500ms
- **Total API Response:** < 1 second
- **Retry Timeout:** 15 seconds max
- **Max Retries:** 3 attempts

### Monitoring

Check server logs for timing information:

```
[req_xxx] ✅ Request completed successfully {
  resultCount: 15,
  totalCount: 45,
  duration: "178ms",
  breakdown: {
    auth: "45ms",
    query: "123ms"
  }
}
```

---

## Test Execution Summary

| Test Case             | Status | Notes | Date |
| --------------------- | ------ | ----- | ---- |
| 1. Normal Load        | ⬜     |       |      |
| 2. Network Timeout    | ⬜     |       |      |
| 3. API Error (500)    | ⬜     |       |      |
| 4. Auth Error (401)   | ⬜     |       |      |
| 5. Empty Database     | ⬜     |       |      |
| 6. Manual Retry       | ⬜     |       |      |
| 7. Auto Retry         | ⬜     |       |      |
| 8. DB Timeout         | ⬜     |       |      |
| 9. Malformed Response | ⬜     |       |      |
| 10. JS Runtime Error  | ⬜     |       |      |
| 11. Load Test         | ⬜     |       |      |
| 12. Navigation        | ⬜     |       |      |
| 13. Error Details     | ⬜     |       |      |
| 14. Production Mode   | ⬜     |       |      |
| 15. Mobile            | ⬜     |       |      |

**Legend:** ⬜ Not Tested | 🟢 PASS | 🔴 FAIL

---

## Regression Testing

After any future changes to:

- API routes (`/api/parties`)
- React Query hooks (`use-parties-query.ts`)
- Manage Parties page (`manage-parties/page.tsx`)
- Error Boundary component

Re-run all test cases to ensure no regressions.

---

## Known Issues / Limitations

Document any discovered issues here:

1. **Issue:** [Description]
   - **Impact:** [Severity]
   - **Workaround:** [Temporary fix]
   - **Status:** [Open/In Progress/Resolved]

---

## Test Sign-off

**Tested By:** ********\_********  
**Date:** ********\_********  
**Environment:** Development / Staging / Production  
**Result:** All Pass / Partial Pass / Fail  
**Notes:** ********\_********

---

## Automated Testing (Future)

Consider implementing:

- Jest unit tests for error handlers
- Cypress E2E tests for error scenarios
- API integration tests with error mocking
- Performance regression tests
- Accessibility testing for error states

**Priority:** Medium  
**Estimated Effort:** 3-5 days
