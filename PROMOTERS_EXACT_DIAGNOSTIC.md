# Promoters Page Diagnostic Guide

## What to Check RIGHT NOW 🎯

Based on your screenshot, the page IS rendering with the menu visible. Let me help you identify the EXACT failure mode.

### 1. **Load the page and open browser DevTools (F12)**

Go to: `https://portal.thesmartpro.io/en/promoters`

### 2. **Check Each Stage** (in order)

---

## STAGE 1: Network Request ✅
**Purpose:** Is the API call succeeding?

```javascript
// In Console (F12), paste this:
fetch('/api/promoters?page=1&limit=50&_t=' + Date.now(), { 
  cache: 'no-store',
  headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
})
.then(r => {
  console.log('📡 Response Status:', r.status, r.statusText);
  console.log('📡 Is OK:', r.ok);
  return r.json();
})
.then(data => {
  console.log('📦 Response Data:', data);
  console.log('   - Has promoters:', !!data.promoters);
  console.log('   - Promoters count:', data.promoters?.length);
  console.log('   - Success flag:', data.success);
})
.catch(err => console.error('❌ Error:', err.message));
```

**Expected Output:**
```
📡 Response Status: 200 OK
📡 Is OK: true
📦 Response Data: { success: true, promoters: [...], pagination: {...}, ... }
   - Has promoters: true
   - Promoters count: 50
   - Success flag: true
```

**If you see:**
- `201 Unauthorized` → **Authentication issue**
- `403 Forbidden` → **Permission issue**
- `500 Internal Server Error` → **Server error**
- `Network error` → **Connectivity issue**

---

## STAGE 2: Component Render State ✅
**Purpose:** Is React rendering the component correctly?

```javascript
// Still in Console, check component logs:
// Look for these patterns in console:

// GOOD SIGNS:
// 🚀 Enhanced PromotersView component mounted
// 🔄 Fetching promoters from API (page 1, limit 50)...
// 📡 API Response: { status: 200, statusText: 'OK', ok: true, ... }
// ✅ Successfully fetched promoters: 50
// 📊 Component state: { isLoading: false, isError: false, isFetching: false, hasResponse: true, promotersCount: 50 }

// BAD SIGNS:
// ❌ API request failed: { status: 401, ... }
// ❌ API request failed: { status: 403, ... }
// 📊 Component state: { isLoading: false, isError: true, ... }
```

---

## STAGE 3: UI Display State ✅
**Purpose:** What is actually visible on the page?

Check which of these you see:

### Scenario A: ✅ **Page Loaded Successfully** (What you screenshot showed)
```
✅ Header: "Promoter Intelligence Hub"
✅ Metric Cards: (Total, Active workforce, Document alerts, Compliance rate)
✅ Filters: Search, Lifecycle, Document health, Assignment
✅ Table with rows of promoters
✅ "More options" (⋮) button on each row
```
→ **This is WORKING correctly!**

### Scenario B: ⏳ **Loading Skeleton**
```
Multiple gray loading bars/placeholders
```
→ **Component is fetching data, wait 3-5 seconds**

### Scenario C: ❌ **Error Card**
```
🔴 "Unable to Load Promoters"
Error message showing
"Try Again" and "Go to Dashboard" buttons
```
→ **API request failed - Check STAGE 1 above**

### Scenario D: ⚠️ **Empty State**
```
"No Promoters Found"
Possible reasons: No promoters have been added...
"Add First Promoter" button
```
→ **API returned successfully but no data in database**

---

## STAGE 4: Menu Interaction ✅
**Purpose:** Does clicking the menu button work?

1. **Click the "⋮" (More options) button** on any promoter row
2. **Check if dropdown appears** with these items:
   ```
   VIEW & EDIT
   - 👁️ View profile
   - ✏️ Edit details
   
   [conditional sections if applicable]
   
   ACTIONS
   - 📧 Send notification
   
   [destructive section]
   - 📦 Archive record
   ```

**Testing the click handlers:**
```javascript
// In Console, paste this:
console.log('🎯 TESTING MENU CLICKS');

// Find a "More options" button
const moreBtn = document.querySelector('button[title="More options"]');
if (moreBtn) {
  console.log('✅ Found More options button');
  
  // Simulate click
  console.log('🖱️ Simulating click...');
  moreBtn.click();
  
  // Wait and check what appears
  setTimeout(() => {
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    console.log(`📋 Menu items found: ${menuItems.length}`);
    menuItems.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.textContent.trim()}`);
    });
  }, 300);
} else {
  console.log('❌ More options button not found');
}
```

---

## STAGE 5: Click Handler Response ✅
**Purpose:** When you click a menu item, does ANYTHING happen?

1. **Click "View profile"** in the dropdown
2. **Check ONE of these:**

   **Option A: Toast notification appears**
   ```
   ✅ "Opening profile..." message appears briefly
   ```
   → **Handler fired!**

   **Option B: Page navigates**
   ```
   URL changes to something like:
   /en/promoters/[promoter-id]
   ```
   → **Click handler worked!**

   **Option C: Console shows handler output**
   ```javascript
   // Look in console for:
   [CLICK] View profile for: [Promoter Name]
   ```
   → **Handler was called!**

   **Option D: NOTHING happens**
   ```
   No toast, no navigation, no console output
   ```
   → **Click handler not firing - see TROUBLESHOOTING**

---

## TROUBLESHOOTING SPECIFIC ISSUES

### Issue: "Network Failed - 401 Unauthorized"
**Cause:** Not authenticated or session expired
**Fix:**
1. Log out completely
2. Log back in
3. Refresh `/promoters` page
4. Try again

### Issue: "Network Failed - 403 Forbidden"  
**Cause:** User doesn't have permission to view promoters
**Fix:**
1. Check your user role (must be Admin or Manager)
2. Contact system admin to grant "promoters:read" permission
3. Log out and log back in

### Issue: "API returned 500"
**Cause:** Server-side database or API error
**Fix:**
1. Check server logs
2. Verify database connection
3. Check if `/api/promoters` endpoint exists
4. Run: `npm run build` and `npm run dev` to restart

### Issue: "No Promoters Found" (empty state)
**Cause:** Database is empty or no promoters assigned to you
**Fix:**
1. Click "Add First Promoter" button
2. Or contact admin to add promoters
3. Or verify you have permission to see all promoters

### Issue: Menu clicks don't work
**Cause:** Event handlers not firing or dropdown not opening
**Fix:**
1. Run Stage 4 console test above
2. Check if button is disabled (grayed out)
3. Check if any JavaScript errors in console
4. Try: `npm run build && npm run dev` to rebuild

---

## COMPREHENSIVE CONSOLE TEST (All at once)

```javascript
console.clear();
console.log('🔍 COMPREHENSIVE PROMOTERS PAGE DIAGNOSTIC\n');

// 1. Check component render state
console.log('1️⃣ LOOKING FOR COMPONENT LOGS...');
// (scroll up in console to find 🚀 logs)

// 2. Test network request
console.log('\n2️⃣ TESTING API REQUEST...');
fetch('/api/promoters?page=1&limit=50&_t=' + Date.now(), { cache: 'no-store' })
  .then(r => {
    console.log(`   Status: ${r.status} ${r.statusText}`);
    return r.json();
  })
  .then(d => {
    console.log(`   ✅ API Success: ${d.success === true}`);
    console.log(`   Promoters: ${d.promoters?.length || 0}`);
  })
  .catch(e => console.log(`   ❌ Error: ${e.message}`));

// 3. Check DOM elements
console.log('\n3️⃣ CHECKING DOM ELEMENTS...');
console.log(`   Header present: ${!!document.querySelector('h1')}`);
console.log(`   More buttons: ${document.querySelectorAll('button[title="More options"]').length}`);
console.log(`   Table rows: ${document.querySelectorAll('tbody tr').length}`);

// 4. Test click simulation
console.log('\n4️⃣ TESTING MENU CLICK...');
const btn = document.querySelector('button[title="More options"]');
if (btn) {
  btn.click();
  setTimeout(() => {
    const items = document.querySelectorAll('[role="menuitem"]');
    console.log(`   Menu items: ${items.length}`);
  }, 300);
}
```

---

## WHAT TO REPORT BACK

Please tell me:

1. **What stage did it fail at?** (1-5 above)
2. **Exact error message** (screenshot or copy-paste from console)
3. **What does STAGE 3 show?** (Success / Skeleton / Error / Empty)
4. **If menu appears, can you click it?** (Yes / No / Unknown)
5. **What happens when you click a menu item?** (Nothing / Toast / Navigation / Error)

Once you answer these, I can give you the exact fix! ✅
