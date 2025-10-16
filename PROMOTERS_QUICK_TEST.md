# Promoters Page - Quick 30-Second Test

## 🚀 RUN THIS NOW IN BROWSER CONSOLE (F12)

```javascript
// =====================================
// PROMOTERS PAGE QUICK TEST
// Copy-paste this entire block
// =====================================

console.clear();
console.log('🧪 PROMOTERS PAGE QUICK TEST STARTED\n');

// STAGE 1: Check page rendering
const header = document.querySelector('h1, [class*="CardTitle"]');
const table = document.querySelector('table, tbody');
const moreBtn = document.querySelector('button[title="More options"]');

console.log('📍 STAGE 1: Page Rendering');
console.log('   Header found:', !!header);
console.log('   Table found:', !!table);
console.log('   More buttons:', document.querySelectorAll('button[title="More options"]').length);

// STAGE 2: Check API
console.log('\n📍 STAGE 2: Testing API');
fetch('/api/promoters?page=1&limit=10&_t=' + Date.now(), { cache: 'no-store' })
  .then(r => {
    console.log('   HTTP Status:', r.status);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(d => {
    console.log('   ✅ API OK');
    console.log('   Promoters:', d.promoters?.length || 0);
  })
  .catch(e => console.log('   ❌ API Error:', e.message));

// STAGE 3: Test menu click
console.log('\n📍 STAGE 3: Testing Menu Click');
if (moreBtn) {
  console.log('   Clicking menu button...');
  moreBtn.click();
  
  setTimeout(() => {
    const items = document.querySelectorAll('[role="menuitem"], [class*="menuitem"]');
    console.log('   Menu items appeared:', items.length);
    if (items.length > 0) {
      console.log('   ✅ MENU WORKS');
    } else {
      console.log('   ⚠️ Menu may not have opened');
    }
  }, 500);
} else {
  console.log('   ❌ No menu button found');
}

console.log('\n✅ Quick test complete. Check results above.\n');
```

---

## 📊 EXPECTED OUTPUT

### ✅ If Everything Works:
```
📍 STAGE 1: Page Rendering
   Header found: true
   Table found: true
   More buttons: 50

📍 STAGE 2: Testing API
   HTTP Status: 200
   ✅ API OK
   Promoters: 10

📍 STAGE 3: Testing Menu Click
   Clicking menu button...
   Menu items appeared: 6
   ✅ MENU WORKS

✅ Quick test complete.
```

### ❌ If API Fails:
```
   HTTP Status: 401
   ❌ API Error: HTTP 401
```
→ **Issue: Not authenticated**

### ❌ If Menu Doesn't Open:
```
   Menu items appeared: 0
   ⚠️ Menu may not have opened
```
→ **Issue: Menu interaction problem**

---

## 🎯 WHAT TO DO BASED ON RESULTS

| Result | Issue | Action |
|--------|-------|--------|
| ✅ All green | Working! | No fixes needed |
| ❌ HTTP 401 | Not logged in | Log out, log back in |
| ❌ HTTP 403 | No permission | Check user role |
| ❌ HTTP 500 | Server error | Restart server |
| ⚠️ Menu not opening | Click issue | Check Step 2 in diagnostic |
| ⚠️ Header/table missing | Rendering issue | Check browser errors |

---

## 🔧 If You See Errors in Console

**Look for messages like:**
- `❌ API request failed`
- `ReferenceError: document is not defined`
- `TypeError: Cannot read property...`
- `NetworkError: ...`

**Share these with me along with:**
1. Your HTTP status (if any)
2. The exact error message
3. What stage failed

---

## 💡 Quick Fixes to Try

**If API returns 401:**
```javascript
// Option 1: Check your token
console.log('Cookie:', document.cookie.includes('auth') ? 'Found' : 'Missing');

// Option 2: Log out and back in
window.location.href = '/en/auth/logout';
```

**If menu doesn't respond:**
```javascript
// Check if buttons are disabled
const btn = document.querySelector('button[title="More options"]');
console.log('Button disabled:', btn?.disabled);
console.log('Button visible:', btn?.offsetParent !== null);
```

---

## 📞 Report Back With

1. **Full console output** (screenshot or copy-paste)
2. **What stage passed?** (1/2/3 or all)
3. **What error message?** (if any)
4. **What did you see on page?** (data/error/empty/loading)

That's it! This quick test will tell us everything we need to know. 🚀
