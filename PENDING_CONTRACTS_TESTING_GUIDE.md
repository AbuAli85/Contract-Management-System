# Pending Contracts - Testing Guide

## Quick Test Checklist

Use this checklist to verify all fixes are working correctly:

- [ ] **Fast Load Test**: Page loads quickly with contracts
- [ ] **Slow Load Test**: Shows progress message after 3 seconds
- [ ] **Timeout Test**: Shows error after 10 seconds
- [ ] **Empty State Test**: Shows success message with 0 contracts
- [ ] **Error Recovery Test**: Retry button works after errors
- [ ] **Search Test**: Search filters work and show clear messages
- [ ] **Permission Test**: Permission errors are handled gracefully
- [ ] **Refresh Test**: Refresh button works in all states
- [ ] **Network Error Test**: Network errors show helpful messages

---

## Detailed Test Scenarios

### ✅ Test 1: Normal Load (Happy Path)

**Steps:**

1. Navigate to `/en/contracts/pending`
2. Wait for page to load

**Expected Result:**

```
✅ PASS if:
- Page loads within 1-2 seconds
- Shows spinner briefly
- Displays contracts or "No Pending Contracts" message
- No error messages appear
- Console shows: "✅ Loaded pending contracts: { count: X }"
```

**Console Output:**

```
📋 Pending Contracts - Permission Check: { hasPermission: true, ... }
🔍 Pending Contracts Debug: { endpoint: '/api/contracts?status=pending', ... }
⏱️ API Response time: 234ms
✅ Loaded pending contracts: { count: 3, ... }
```

---

### ⏱️ Test 2: Slow Load (3-10 seconds)

**Steps:**

1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Navigate to `/en/contracts/pending`
4. Wait 3+ seconds

**Expected Result:**

```
✅ PASS if:
- Shows initial loading spinner
- After 3 seconds, shows warning message:
  "This is taking longer than expected..."
- Shows "Cancel and Retry" button
- Eventually loads or times out
```

**UI Should Show:**

```
[Spinner]
Loading pending contracts...

⚠️ This is taking longer than expected.
   The server might be busy.

⏱️ Request will timeout after 10 seconds

[Cancel and Retry]
```

---

### 🚫 Test 3: Timeout (> 10 seconds)

**Steps:**

1. Open DevTools → Network tab
2. Set throttling to "Offline" or extremely slow
3. Navigate to `/en/contracts/pending`
4. Wait 10+ seconds

**Expected Result:**

```
✅ PASS if:
- Request aborts after 10 seconds
- Shows error message:
  "Request timeout - the server took too long to respond"
- Shows list of possible causes
- Shows [Retry Now] button
- Console shows: "❌ Request timeout after 10 seconds"
```

**Error Message:**

```
❌ Failed to Load Pending Contracts

Request timeout - the server took too long to respond.
Please try again.

Possible causes:
• Network connectivity issues
• Server timeout (request took too long)
• Database query performance issues
• Permission or authentication problems

[Retry Now] [View All Contracts] [Go to Dashboard]
```

---

### ✅ Test 4: Empty State (0 Pending Contracts)

**Steps:**

1. Ensure database has 0 pending contracts
2. Navigate to `/en/contracts/pending`

**Expected Result:**

```
✅ PASS if:
- Page loads successfully (no error)
- Shows green success indicator
- Message: "No Pending Contracts"
- Subtext: "All contracts have been reviewed and approved"
- Shows success banner: "✅ All contracts are up to date"
- Console shows: "ℹ️ No pending contracts found - this is normal"
```

**UI Should Show:**

```
🕐 Pending Contracts [Badge: 0]
0 contracts awaiting approval

[Refresh 🔄]  [Search 🔍]

───────────────────────────────
       [Green Clock Icon]

   No Pending Contracts

There are currently no contracts
awaiting approval. All contracts
have been reviewed and approved.
Great work!

[View All Contracts] [Refresh]

╔══════════════════════════════╗
║ ✅ All contracts are up to  ║
║    date. Check back later   ║
║    for new submissions.     ║
╚══════════════════════════════╝
```

**❌ FAIL if:**

- Shows error message
- Shows infinite loading spinner
- Message says "Failed to load"
- Red error color instead of green success color

---

### 🔄 Test 5: Retry Functionality

**Steps:**

1. Disconnect network (DevTools → Network → Offline)
2. Navigate to `/en/contracts/pending`
3. Wait for error to appear
4. Reconnect network
5. Click "Retry Now" button

**Expected Result:**

```
✅ PASS if:
- Error message appears (network error)
- "Retry Now" button is visible
- After reconnecting and clicking retry:
  - Loading spinner appears
  - Page successfully loads contracts
  - Error message clears
- Console shows: "Retry attempts: 1"
```

---

### 🔍 Test 6: Search Functionality

**Setup:** Have 3+ pending contracts

**Steps:**

1. Navigate to `/en/contracts/pending`
2. Wait for contracts to load
3. Type a contract number in search box
4. Type a non-existent search term

**Expected Result:**

```
✅ PASS if:

MATCHING SEARCH:
- Contracts filter in real-time
- Shows: "Showing X of Y contracts"
- Matching contracts are displayed

NON-MATCHING SEARCH:
- Shows: "No Matching Contracts"
- Message: "No contracts match your search criteria 'xyz'"
- Shows [Clear Search] button
- Click Clear Search → all contracts reappear
```

---

### 🔐 Test 7: Permission Handling

**Steps:**

1. Login as user WITHOUT `contract:read:own` permission
2. Navigate to `/en/contracts/pending`

**Expected Result:**

```
✅ PASS if:
- Shows permission error (not infinite loading)
- Message: "Insufficient Permissions"
- Lists required permissions
- Shows [Go to Dashboard] and [Request Access] buttons
- Console shows: "⚠️ Insufficient permissions for pending contracts"
```

**Permission Error UI:**

```
🕐 Pending Contracts

───────────────────────────────
⛔ Insufficient Permissions

You don't have permission to view
pending contracts. This page requires:

• Permission: contract:read:own
• OR Admin Role: System administrator

[Go to Dashboard] [Request Access]
```

---

### 🌐 Test 8: Network Error Handling

**Steps:**

1. Use DevTools to block the API endpoint:
   - Network tab → Right-click `/api/contracts` → Block request URL
2. Navigate to `/en/contracts/pending`
3. Wait for error

**Expected Result:**

```
✅ PASS if:
- Shows network error message
- Error details include "Network error" or "Failed to fetch"
- Shows [Retry Now] button
- After unblocking and retrying, page loads successfully
```

---

### 🔄 Test 9: Refresh Button

**Steps:**

1. Navigate to `/en/contracts/pending`
2. Wait for page to load
3. Click the "Refresh" button in the header

**Expected Result:**

```
✅ PASS if:
- Button shows spinning icon during refresh
- Button is disabled during refresh
- Data reloads successfully
- Button returns to normal state after refresh
- No duplicate requests (check Network tab)
```

---

### 🧪 Test 10: Memory Leak Prevention

**Steps:**

1. Navigate to `/en/contracts/pending`
2. While loading, immediately navigate to another page
3. Check browser console for errors

**Expected Result:**

```
✅ PASS if:
- No console errors about updating unmounted components
- No "Can't perform a React state update on an unmounted component" warnings
- Timeouts are properly cleaned up
```

---

### 🧪 Test 11: Multiple Simultaneous Requests

**Steps:**

1. Navigate to `/en/contracts/pending`
2. Immediately click "Refresh" multiple times rapidly
3. Check Network tab in DevTools

**Expected Result:**

```
✅ PASS if:
- Only ONE request is made at a time
- Console shows: "⏸️ Fetch already in progress, skipping..."
- No duplicate API calls in Network tab
- Page loads correctly after requests complete
```

---

## Browser Console Testing

### Expected Console Logs (Success)

```
📋 Pending Contracts - Permission Check: {
  hasPermission: true,
  isAdmin: false,
  isLoading: false,
  timestamp: "2025-10-22T10:30:45.123Z"
}

🔍 Pending Contracts Debug: {
  timestamp: "2025-10-22T10:30:45.124Z",
  endpoint: "/api/contracts?status=pending",
  timeout: "10 seconds",
  retryCount: 0
}

⏱️ API Response time: 234ms

✅ Loaded pending contracts: {
  count: 3,
  queryTime: "234ms",
  sampleIds: ["uuid-1", "uuid-2", "uuid-3"],
  totalPending: 3,
  stats: { ... },
  timestamp: "2025-10-22T10:30:45.358Z"
}
```

### Expected Console Logs (Empty State)

```
... (permission and debug logs) ...

⏱️ API Response time: 156ms

✅ Loaded pending contracts: {
  count: 0,
  queryTime: "156ms",
  sampleIds: [],
  totalPending: 0,
  stats: { ... }
}

ℹ️ No pending contracts found - this is normal, not an error
```

### Expected Console Logs (Error)

```
... (permission and debug logs) ...

❌ Request timeout after 10 seconds: {
  queryTime: "10001ms",
  timestamp: "2025-10-22T10:30:55.125Z"
}
```

---

## Performance Benchmarks

| Scenario           | Expected Time | Max Time   | Status |
| ------------------ | ------------- | ---------- | ------ |
| Fast load          | < 1 second    | 2 seconds  | ✅     |
| Slow warning       | 3 seconds     | 4 seconds  | ✅     |
| Request timeout    | 10 seconds    | 11 seconds | ✅     |
| Permission timeout | 5 seconds     | 6 seconds  | ✅     |
| Retry attempt      | < 1 second    | 2 seconds  | ✅     |

---

## API Response Validation

### Test API Directly

```bash
# Test the API endpoint
curl -X GET "http://localhost:3000/api/contracts?status=pending" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie"
```

**Expected Response:**

```json
{
  "success": true,
  "contracts": [
    {
      "id": "uuid-here",
      "contract_number": "CON-12345",
      "status": "pending",
      "job_title": "Software Engineer",
      "first_party": { "name_en": "ABC Corp" },
      "second_party": { "name_en": "XYZ Ltd" },
      "promoters": { "name_en": "John Doe" },
      ...
    }
  ],
  "stats": {
    "pending": 3,
    "total": 10,
    ...
  },
  "pendingContracts": 3
}
```

---

## Common Issues & Solutions

### Issue 1: Infinite Loading

**Symptoms:** Page stuck on loading spinner forever

**Checks:**

- [ ] Check console for permission timeout warning
- [ ] Check Network tab for failed/pending requests
- [ ] Verify user has `contract:read:own` permission

**Expected Fix:**

- Should timeout after 10 seconds
- Should show error or permission message

---

### Issue 2: Shows Error for 0 Results

**Symptoms:** Error message when there are no pending contracts

**Checks:**

- [ ] Check console log: should say "ℹ️ No pending contracts found - this is normal"
- [ ] API should return `{ success: true, contracts: [] }`
- [ ] UI should show green success state, not red error

**Expected Behavior:**

- Green clock icon
- Success message
- No error styling

---

### Issue 3: Multiple API Calls

**Symptoms:** Network tab shows duplicate requests

**Checks:**

- [ ] Check console for "⏸️ Fetch already in progress"
- [ ] Verify `fetchAttemptedRef` is working

**Expected Behavior:**

- Only one request at a time
- Subsequent clicks should be ignored until first completes

---

### Issue 4: Memory Leak Warnings

**Symptoms:** Console warnings about updating unmounted components

**Checks:**

- [ ] Navigate away during loading
- [ ] Check for proper cleanup in useEffect
- [ ] Verify `mountedRef` checks

**Expected Behavior:**

- No warnings in console
- Clean navigation

---

## Automated Testing (Optional)

### Jest Test Example

```typescript
describe('Pending Contracts Page', () => {
  it('should show loading state initially', () => {
    render(<PendingContractsPage />);
    expect(screen.getByText(/loading pending contracts/i)).toBeInTheDocument();
  });

  it('should show success state with 0 contracts', async () => {
    mockAPI({ contracts: [], success: true });
    render(<PendingContractsPage />);
    await waitFor(() => {
      expect(screen.getByText(/no pending contracts/i)).toBeInTheDocument();
      expect(screen.getByText(/all contracts are up to date/i)).toBeInTheDocument();
    });
  });

  it('should handle timeout error', async () => {
    mockAPI({ delay: 11000 }); // Delay longer than timeout
    render(<PendingContractsPage />);
    await waitFor(() => {
      expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
    }, { timeout: 12000 });
  });
});
```

---

## Sign-Off Checklist

Before deploying to production:

- [ ] All 11 test scenarios pass
- [ ] No console errors in any scenario
- [ ] Performance within benchmarks
- [ ] API returns correct data structure
- [ ] Empty state shows success (not error)
- [ ] Timeout protection works
- [ ] Retry functionality works
- [ ] Memory leaks prevented
- [ ] Permissions handled correctly
- [ ] Search filtering works
- [ ] Mobile responsive (bonus)

---

## Success Criteria

✅ **PASS**: All tests pass, no infinite loading, clear user feedback in all states

❌ **FAIL**: Any infinite loading, confusing error messages, or state update warnings
