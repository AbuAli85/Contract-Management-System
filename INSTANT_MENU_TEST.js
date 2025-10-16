// CLICK TEST - Find and click the "More options" button
console.log('🎯 CLICK TEST STARTED');
console.log('============================================');

// Find all buttons in table cells
const rows = document.querySelectorAll('table tbody tr');
console.log(`Found ${rows.length} table rows`);

if (rows.length > 0) {
  const firstRow = rows[0];
  const cells = firstRow.querySelectorAll('td');
  const lastCell = cells[cells.length - 1];
  const buttons = lastCell.querySelectorAll('button');
  
  console.log(`First row last cell has ${buttons.length} buttons`);
  
  // Find the "More options" button
  let moreButton = null;
  buttons.forEach((btn, idx) => {
    if (btn.title === 'More options') {
      console.log(`✅ Found "More options" button at index ${idx}`);
      moreButton = btn;
    }
  });
  
  if (moreButton) {
    console.log('🖱️ Clicking "More options" button...');
    moreButton.click();
    
    // Wait a bit and check what appeared
    setTimeout(() => {
      console.log('\n📊 AFTER CLICK - Checking DOM:');
      
      // Check for menu items
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      console.log(`1. Menu items [role="menuitem"]: ${menuItems.length}`);
      
      // Check for any visible divs that might be the menu
      const allDivs = document.querySelectorAll('div');
      let visibleMenuDivs = 0;
      allDivs.forEach(div => {
        const style = window.getComputedStyle(div);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          if (div.textContent.includes('View profile') || div.textContent.includes('Edit details')) {
            visibleMenuDivs++;
            console.log(`   Found menu content div: "${div.textContent.substring(0, 50)}..."`);
          }
        }
      });
      console.log(`2. Visible menu content divs: ${visibleMenuDivs}`);
      
      // Check for dialog/popover
      const dialogs = document.querySelectorAll('[role="dialog"]');
      console.log(`3. Dialog elements: ${dialogs.length}`);
      
      // Check for Radix UI popover data attribute
      const popoverElements = document.querySelectorAll('[data-radix-popover-content]');
      console.log(`4. Radix popover elements: ${popoverElements.length}`);
      if (popoverElements.length > 0) {
        console.log(`   Content: "${popoverElements[0].textContent.substring(0, 100)}..."`);
      }
      
      // Try to find elements with "View profile" text
      const allElements = document.querySelectorAll('*');
      let profileLinks = 0;
      allElements.forEach(el => {
        if (el.textContent === 'View profile' || el.textContent.includes('View profile')) {
          profileLinks++;
        }
      });
      console.log(`5. Elements with "View profile" text: ${profileLinks}`);
      
      // Check button disabled state
      console.log(`\n🔍 Button state AFTER click:`);
      console.log(`   disabled: ${moreButton.disabled}`);
      console.log(`   aria-expanded: ${moreButton.getAttribute('aria-expanded')}`);
      
    }, 500);
  } else {
    console.log('❌ Could not find "More options" button');
  }
}

console.log('\n============================================');
console.log('✅ CLICK TEST COMPLETE - Check console above');
