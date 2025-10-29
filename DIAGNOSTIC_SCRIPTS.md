# Diagnostic Scripts for Production Issues

**Date:** October 29, 2025  
**Purpose:** Identify root causes of reported bugs in production

---

## 🔍 Diagnostic Script 1: Test Metrics API

Run this in your browser console on the production site:

```javascript
// Test the metrics API endpoint
async function testMetricsAPI() {
  console.log('🧪 Testing Metrics API...');
  
  try {
    const response = await fetch('/api/dashboard/promoter-metrics');
    const data = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Metrics Data:', data);
    
    if (data.success) {
      console.log('');
      console.log('📈 Metric Values:');
      console.log('  Total:', data.metrics.total);
      console.log('  Active:', data.metrics.active);
      console.log('  Critical:', data.metrics.critical);
      console.log('  Expiring:', data.metrics.expiring);
      console.log('  Unassigned:', data.metrics.unassigned);
      console.log('  Compliance Rate:', data.metrics.complianceRate + '%');
      
      // Validate data consistency
      if (data.metrics.total >= data.metrics.active) {
        console.log('✅ Data consistent: Total >= Active');
      } else {
        console.error('❌ DATA INCONSISTENCY: Active count exceeds total!');
      }
      
      if (data.metrics.complianceRate <= 100) {
        console.log('✅ Compliance rate valid (<=100%)');
      } else {
        console.error('❌ INVALID: Compliance rate >100%');
      }
    } else {
      console.error('❌ API returned error:', data.error);
    }
  } catch (error) {
    console.error('❌ API Request Failed:', error);
  }
}

// Run the test
testMetricsAPI();
```

**Expected Output:**
```
✅ API Response Status: 200
📊 Metrics Data: { success: true, metrics: {...}, timestamp: "..." }
📈 Metric Values:
  Total: 181
  Active: 127
  Critical: 12
  Expiring: 23
  Unassigned: 45
  Compliance Rate: 72%
✅ Data consistent: Total >= Active
✅ Compliance rate valid (<=100%)
```

**If API fails:**
- Check if user is logged in
- Check if `/api/dashboard/promoter-metrics` returns 401/403
- Check browser Network tab for error details

---

## 🔍 Diagnostic Script 2: Test View Mode Switching

Run this in browser console:

```javascript
// Test view mode state management
function testViewModeSwitching() {
  console.log('🧪 Testing View Mode Switching...');
  
  // Check current view mode from localStorage
  const savedView = localStorage.getItem('promoters-view-mode');
  console.log('📦 Saved view mode in localStorage:', savedView);
  
  // Check if view mode buttons exist
  const viewModeButtons = document.querySelectorAll('[value="grid"], [value="cards"]');
  console.log('🔘 View mode buttons found:', viewModeButtons.length);
  
  if (viewModeButtons.length > 0) {
    console.log('✅ View mode buttons exist');
    
    // Check if they're clickable
    viewModeButtons.forEach((btn, index) => {
      console.log(`  Button ${index + 1}: value="${btn.getAttribute('value')}", role="${btn.getAttribute('role')}"`);
    });
  } else {
    console.error('❌ View mode buttons not found in DOM');
  }
  
  // Check if Grid/Cards components are loaded
  const hasGridView = window.PromotersGridView !== undefined;
  const hasCardsView = window.PromotersCardsView !== undefined;
  
  console.log('📦 Grid View Component:', hasGridView ? '✅ Loaded' : '❌ Not found');
  console.log('📦 Cards View Component:', hasCardsView ? '✅ Loaded' : '❌ Not found');
  
  // Test switching to grid view
  console.log('');
  console.log('🔄 Testing view mode switch to Grid...');
  localStorage.setItem('promoters-view-mode', 'grid');
  console.log('✅ Set localStorage to "grid", please refresh the page');
  console.log('   Expected: Page should load in Grid view');
}

// Run the test
testViewModeSwitching();
```

**Expected Output:**
```
📦 Saved view mode in localStorage: table
🔘 View mode buttons found: 4
✅ View mode buttons exist
  Button 1: value="table", role="tab"
  Button 2: value="grid", role="tab"
  Button 3: value="cards", role="tab"
  Button 4: value="analytics", role="tab"
🔄 Testing view mode switch to Grid...
✅ Set localStorage to "grid", please refresh the page
```

**If view doesn't change after refresh:**
1. Check browser console for React errors
2. Check if `promoters` array is empty when view switches
3. Check React DevTools for `viewMode` state value

---

## 🔍 Diagnostic Script 3: Test Filter Dropdowns

Run this in browser console:

```javascript
// Test filter dropdown rendering
function testFilterDropdowns() {
  console.log('🧪 Testing Filter Dropdowns...');
  
  // Find filter dropdown triggers
  const filterTriggers = document.querySelectorAll('[role="combobox"]');
  console.log('🔍 Found', filterTriggers.length, 'dropdown triggers');
  
  filterTriggers.forEach((trigger, index) => {
    const ariaLabel = trigger.getAttribute('aria-label');
    const value = trigger.textContent?.trim();
    console.log(`  Filter ${index + 1}: "${ariaLabel || 'Unknown'}" = "${value}"`);
  });
  
  // Check z-index stacking
  console.log('');
  console.log('📐 Checking z-index stacking...');
  
  const highZIndexElements = [];
  document.querySelectorAll('*').forEach(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    if (zIndex !== 'auto' && parseInt(zIndex) > 1000) {
      highZIndexElements.push({
        element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
        zIndex: parseInt(zIndex)
      });
    }
  });
  
  // Sort by z-index
  highZIndexElements.sort((a, b) => b.zIndex - a.zIndex);
  
  console.log('🔝 Top 10 highest z-index elements:');
  highZIndexElements.slice(0, 10).forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.element}: z-index ${item.zIndex}`);
  });
  
  // Test clicking a filter dropdown
  console.log('');
  console.log('🖱️ Click a filter dropdown and run this next:');
  console.log('   testDropdownContent()');
}

// Test if dropdown content appears
function testDropdownContent() {
  console.log('🧪 Testing Dropdown Content...');
  
  // Look for Radix UI portal content
  const portals = document.querySelectorAll('[data-radix-portal]');
  console.log('🚪 Found', portals.length, 'Radix portals');
  
  // Look for SelectContent
  const selectContent = document.querySelectorAll('[role="listbox"]');
  console.log('📋 Found', selectContent.length, 'listbox elements (SelectContent)');
  
  if (selectContent.length > 0) {
    selectContent.forEach((content, index) => {
      const items = content.querySelectorAll('[role="option"]');
      const display = window.getComputedStyle(content).display;
      const visibility = window.getComputedStyle(content).visibility;
      const zIndex = window.getComputedStyle(content).zIndex;
      
      console.log(`  Listbox ${index + 1}:`);
      console.log(`    Items: ${items.length}`);
      console.log(`    Display: ${display}`);
      console.log(`    Visibility: ${visibility}`);
      console.log(`    Z-index: ${zIndex}`);
      
      if (items.length > 0) {
        console.log('    ✅ Options are present');
      } else {
        console.error('    ❌ No options found!');
      }
    });
  } else {
    console.error('❌ No dropdown content found - dropdown may not be open');
  }
}

// Run the test
testFilterDropdowns();
```

**Expected Output:**
```
🔍 Found 3 dropdown triggers
  Filter 1: "Lifecycle filter" = "All statuses"
  Filter 2: "Document health" = "All documents"
  Filter 3: "Assignment" = "All assignments"

📐 Checking z-index stacking...
🔝 Top 10 highest z-index elements:
  1. DIV.notification-panel: z-index 9999
  2. DIV.dialog-overlay: z-index 5000
  3. DIV.select-content: z-index 1000
  ...
```

**If filter options don't show:**
1. Check if SelectContent has `display: none`
2. Check if z-index is too low (should be > 1000)
3. Check browser console for Radix UI errors

---

## 🔍 Diagnostic Script 4: Test Search Functionality

Run this in browser console:

```javascript
// Test search input and event handling
function testSearchFunctionality() {
  console.log('🧪 Testing Search Functionality...');
  
  // Find search input
  const searchInput = document.getElementById('promoter-search');
  
  if (!searchInput) {
    console.error('❌ Search input not found!');
    return;
  }
  
  console.log('✅ Search input found');
  console.log('  Current value:', searchInput.value);
  console.log('  Placeholder:', searchInput.placeholder);
  
  // Check for notifications panel
  const notificationPanel = document.querySelector('[class*="notification"]');
  const notificationButton = document.querySelector('button[aria-label*="notification" i]');
  
  console.log('');
  console.log('🔔 Notification elements:');
  console.log('  Panel:', notificationPanel ? '✅ Found' : '❌ Not found');
  console.log('  Button:', notificationButton ? '✅ Found' : '❌ Not found');
  
  if (notificationPanel) {
    const panelZIndex = window.getComputedStyle(notificationPanel).zIndex;
    console.log('  Panel z-index:', panelZIndex);
  }
  
  // Check search input z-index and position
  const searchContainer = searchInput.closest('.relative');
  if (searchContainer) {
    const containerZIndex = window.getComputedStyle(searchContainer).zIndex;
    console.log('');
    console.log('🔍 Search container:');
    console.log('  Z-index:', containerZIndex);
    console.log('  Position:', window.getComputedStyle(searchContainer).position);
  }
  
  // Test search input typing
  console.log('');
  console.log('⌨️ Simulating search input...');
  
  // Store original value
  const originalValue = searchInput.value;
  
  // Simulate typing
  searchInput.value = 'test search';
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    console.log('✅ Search value changed to:', searchInput.value);
    
    // Check if notification panel opened unexpectedly
    const panelAfter = document.querySelector('[class*="notification"][style*="display"]');
    if (panelAfter) {
      const display = window.getComputedStyle(panelAfter).display;
      if (display !== 'none') {
        console.error('❌ ISSUE FOUND: Notification panel opened when typing!');
      } else {
        console.log('✅ Notification panel stayed closed');
      }
    } else {
      console.log('✅ No notification panel interference');
    }
    
    // Restore original value
    searchInput.value = originalValue;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  }, 100);
}

// Run the test
testSearchFunctionality();
```

**Expected Output:**
```
✅ Search input found
  Current value: 
  Placeholder: Search by name, contact, ID...

🔔 Notification elements:
  Panel: ✅ Found
  Button: ✅ Found
  Panel z-index: 9999

🔍 Search container:
  Z-index: auto
  Position: relative

⌨️ Simulating search input...
✅ Search value changed to: test search
✅ No notification panel interference
```

**If notification panel opens:**
- There's a JavaScript event handler conflict
- Check for keyboard shortcut conflicts (Ctrl+K, etc.)
- Check if notification panel has a global click listener

---

## 🔧 Quick Fixes

### Fix 1: Force Clear All Caches

```javascript
// Clear all localStorage and caches
function clearAllCaches() {
  console.log('🧹 Clearing all caches...');
  
  // Clear localStorage
  localStorage.clear();
  console.log('✅ localStorage cleared');
  
  // Clear sessionStorage
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');
  
  // Clear service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
      console.log('✅ Service workers cleared');
    });
  }
  
  console.log('');
  console.log('✅ All caches cleared!');
  console.log('🔄 Please refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
}

clearAllCaches();
```

---

### Fix 2: Force Grid View

```javascript
// Force grid view mode
function forceGridView() {
  localStorage.setItem('promoters-view-mode', 'grid');
  window.location.href = window.location.pathname + '?view=grid';
}

forceGridView();
```

---

### Fix 3: Test Database Query Directly

Run this SQL query in your Supabase dashboard to verify data:

```sql
-- Get promoter counts directly from database
SELECT 
  COUNT(*) as total_promoters,
  COUNT(*) FILTER (WHERE status = 'active') as active_promoters,
  COUNT(*) FILTER (WHERE id_card_expiry_date < NOW()) as expired_ids,
  COUNT(*) FILTER (WHERE passport_expiry_date < NOW()) as expired_passports,
  COUNT(*) FILTER (
    WHERE id_card_expiry_date < NOW() + INTERVAL '30 days'
    OR passport_expiry_date < NOW() + INTERVAL '30 days'
  ) as expiring_soon
FROM promoters;
```

Compare these numbers with what the UI shows.

---

## 📋 Checklist for User

After running all diagnostic scripts, answer these questions:

### Metrics Issue:
- [ ] Does `/api/dashboard/promoter-metrics` return data?
- [ ] Are the numbers from the API correct?
- [ ] Do the API numbers match the SQL query results?
- [ ] Is the frontend using the API data or calculating locally?

### View Mode Issue:
- [ ] Do the Grid/Cards buttons exist in the DOM?
- [ ] Does clicking them update localStorage?
- [ ] Does refreshing the page respect the localStorage value?
- [ ] Are there any React errors in the console when switching views?

### Filter Dropdowns Issue:
- [ ] Do the dropdown triggers exist?
- [ ] Does clicking them show the SelectContent?
- [ ] Are there options inside the SelectContent?
- [ ] Is the z-index high enough (>1000)?

### Search Issue:
- [ ] Does the search input exist?
- [ ] Does typing in it trigger any unexpected events?
- [ ] Does the notification panel open when typing?
- [ ] Are there any keyboard shortcut conflicts?

---

## 🚀 Next Steps

1. **Run all 4 diagnostic scripts** in production
2. **Copy the console output** and share with developers
3. **Answer the checklist** questions above
4. **Share any error messages** from browser console

This will help identify the exact root cause of each issue!

---

**Created by:** AI Diagnostic System  
**Date:** October 29, 2025  
**Version:** 1.0


