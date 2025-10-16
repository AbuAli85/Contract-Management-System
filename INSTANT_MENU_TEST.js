// FINAL TEST - Click menu item and check for handler output
console.log('🎯 FINAL CLICK HANDLER TEST');
console.log('============================================');

const rows = document.querySelectorAll('table tbody tr');
if (rows.length > 0) {
  const moreBtn = rows[0].querySelector('button[title="More options"]');
  
  if (moreBtn) {
    console.log('1️⃣ Opening menu...');
    moreBtn.click();
    
    setTimeout(() => {
      console.log('2️⃣ Looking for menu content...');
      
      const menuContent = document.querySelector('div[class*="absolute"][class*="z-50"]');
      if (menuContent) {
        // Find the "View profile" div (Child 1 based on previous output)
        const viewProfileDiv = Array.from(menuContent.children).find(child => 
          child.textContent.includes('View profileFull details')
        );
        
        if (viewProfileDiv) {
          console.log('3️⃣ Found "View profile" menu item');
          console.log(`   Classes: ${viewProfileDiv.className}`);
          
          // Log the current console to see if handler fires
          console.log('\n4️⃣ CLICKING "View profile" - watching for handler output...\n');
          console.log('------- HANDLER OUTPUT BELOW -------');
          
          // Just click it directly
          viewProfileDiv.click();
          
          // Also try triggering the onclick if it exists
          if (viewProfileDiv.onclick) {
            console.log('   (also calling .onclick directly)');
            viewProfileDiv.onclick({
              type: 'click',
              target: viewProfileDiv,
              preventDefault: () => {},
              stopPropagation: () => {}
            });
          }
          
          setTimeout(() => {
            console.log('------- END HANDLER OUTPUT -------\n');
            console.log('✅ Click test complete');
            console.log('\n📌 Did you see "[CLICK] View profile for:" output?');
            console.log('   If YES → handlers are working');
            console.log('   If NO → click events not reaching handlers');
          }, 200);
          
        } else {
          console.log('❌ Could not find "View profile" in menu');
        }
      } else {
        console.log('❌ Menu not found');
      }
      
    }, 300);
  }
}

console.log('\n============================================');
