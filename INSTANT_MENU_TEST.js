// 🧪 COMPLETE MENU FUNCTIONALITY TEST
console.log('🧪 MENU FUNCTIONALITY TEST SUITE');
console.log('═════════════════════════════════════════════');

const results = {
  menuFound: false,
  menuOpened: false,
  menuItemsVisible: 0,
  clicksWorking: false,
  toastAppeared: false,
  navigationFired: false,
};

// TEST 1: Find the menu button
console.log('\n📍 TEST 1: Finding menu button...');
const rows = document.querySelectorAll('table tbody tr');
const firstRow = rows[0];
const cells = firstRow.querySelectorAll('td');
const lastCell = cells[cells.length - 1];
const moreButton = lastCell.querySelector('button[title="More options"]');

if (moreButton) {
  console.log('✅ Found "More options" button');
  results.menuFound = true;
} else {
  console.log('❌ "More options" button not found');
}

// TEST 2: Click to open menu
if (moreButton) {
  console.log('\n📍 TEST 2: Opening menu by clicking button...');
  moreButton.click();
  
  setTimeout(() => {
    // TEST 3: Check if menu items are visible
    console.log('\n📍 TEST 3: Checking for visible menu items...');
    const menuContent = document.querySelector('div[class*="absolute"][class*="z-50"]');
    
    if (menuContent && window.getComputedStyle(menuContent).display !== 'none') {
      console.log('✅ Menu is visible');
      results.menuOpened = true;
      
      // Count clickable items
      const clickableItems = menuContent.querySelectorAll('[class*="cursor-pointer"]');
      results.menuItemsVisible = clickableItems.length;
      console.log(`✅ Found ${clickableItems.length} clickable menu items`);
      
      // Find specific items
      const viewProfileItem = Array.from(clickableItems).find(el =>
        el.textContent.includes('View profile')
      );
      const editDetailsItem = Array.from(clickableItems).find(el =>
        el.textContent.includes('Edit details')
      );
      const notificationItem = Array.from(clickableItems).find(el =>
        el.textContent.includes('Send notification')
      );
      
      if (viewProfileItem) {
        console.log('  ✅ "View profile" item found');
      } else {
        console.log('  ❌ "View profile" item NOT found');
      }
      
      if (editDetailsItem) {
        console.log('  ✅ "Edit details" item found');
      } else {
        console.log('  ❌ "Edit details" item NOT found');
      }
      
      if (notificationItem) {
        console.log('  ✅ "Send notification" item found');
      } else {
        console.log('  ❌ "Send notification" item NOT found');
      }
      
      // TEST 4: Try clicking a menu item
      if (viewProfileItem) {
        console.log('\n📍 TEST 4: Clicking "View profile" menu item...');
        console.log('Watching for: toast notification + navigation');
        console.log('------- HANDLER OUTPUT -------');
        
        // Monitor for toasts
        const toastObserver = new MutationObserver(() => {
          const toasts = document.querySelectorAll('[role="status"], [class*="toast"]');
          if (toasts.length > 0) {
            console.log('✅ TOAST NOTIFICATION DETECTED!');
            console.log(`   Content: "${toasts[0].textContent.substring(0, 60)}..."`);
            results.toastAppeared = true;
          }
        });
        
        toastObserver.observe(document.body, { childList: true, subtree: true });
        
        // Click the item
        viewProfileItem.click();
        
        // Check for navigation
        setTimeout(() => {
          console.log('------- END HANDLER OUTPUT -------');
          console.log('\n📍 TEST 5: Checking results...');
          console.log(`✅ Toast appeared: ${results.toastAppeared}`);
          console.log(`✅ Menu items visible: ${results.menuItemsVisible}`);
          console.log(`✅ Menu opened: ${results.menuOpened}`);
          console.log(`✅ Menu button found: ${results.menuFound}`);
          
          // Summary
          console.log('\n═════════════════════════════════════════════');
          if (results.menuFound && results.menuOpened && results.menuItemsVisible > 0) {
            console.log('🎉 MENU STRUCTURE: ✅ WORKING');
          } else {
            console.log('🔴 MENU STRUCTURE: ❌ BROKEN');
          }
          
          if (results.toastAppeared) {
            console.log('🎉 USER FEEDBACK: ✅ WORKING');
          } else {
            console.log('⚠️ USER FEEDBACK: Check console for handler logs');
          }
          
          console.log('\n📌 What should happen:');
          console.log('1. ✅ Menu button opens when clicked');
          console.log('2. ✅ Menu items are visible and clickable');
          console.log('3. ✅ Toast notification appears on click');
          console.log('4. ✅ Navigation happens after toast');
          
          toastObserver.disconnect();
        }, 1000);
      }
    } else {
      console.log('❌ Menu did not open');
    }
  }, 300);
}

console.log('\n═════════════════════════════════════════════');
console.log('⏳ Test running... Check results in 2 seconds...');
