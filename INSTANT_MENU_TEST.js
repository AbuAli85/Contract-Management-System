// INSTANT MENU TEST - Paste this entire script into your browser console (F12)
// This will add click logging to all menu items

console.log('🧪 MENU TEST STARTED');
console.log('============================================');

// Test 1: Find all menu items
const menuItems = document.querySelectorAll('[role="menuitem"]');
console.log(`✅ Found ${menuItems.length} menu items`);

// Test 2: Add click listeners to all menu items
menuItems.forEach((item, index) => {
  const originalOnClick = item.onclick;
  item.onclick = function(e) {
    console.log(`🖱️ MENU CLICK #${index + 1}:`, item.textContent.trim());
    console.log('   Element:', item);
    console.log('   Event:', e);
    if (originalOnClick) {
      return originalOnClick.call(this, e);
    }
  };
});

console.log('============================================');
console.log('✅ TEST READY - Now try clicking menu items');
console.log('Watch the console for CLICK messages below');
console.log('============================================');

// Test 3: Show what to do
console.log(`
📋 NEXT STEPS:
1. Click the three-dots (...) button on any promoter row
2. A menu will appear
3. Click any menu item (View profile, Edit, Send notification, Archive)
4. Watch this console for the CLICK message

If you see "🖱️ MENU CLICK" - the onClick IS firing ✅
If you DON'T see it - the onClick is NOT firing ❌

IMPORTANT: Take a screenshot of this console after clicking!
`);
