/**
 * Force Proper Login - Browser Console Script
 * 
 * This script clears everything and redirects to login
 * so Supabase can set cookies properly
 * 
 * Copy and paste this ENTIRE script into your browser console (F12)
 */

(function forceProperLogin() {
  console.log('%c🔄 Force Proper Login', 'font-size: 18px; font-weight: bold; color: #2563eb;');
  console.log('─'.repeat(70));
  
  console.log('\n🧹 Step 1: Clearing localStorage...');
  try {
    localStorage.clear();
    console.log('   ✅ localStorage cleared');
  } catch (e) {
    console.error('   ❌ Error clearing localStorage:', e);
  }
  
  console.log('\n🍪 Step 2: Clearing cookies...');
  try {
    if (typeof document !== 'undefined' && document.cookie) {
      const cookies = document.cookie.split(';');
      let clearedCount = 0;
      
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name) {
          // Clear cookie for current path
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
          // Clear cookie for root domain
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname}`;
          // Clear cookie for parent domain (if applicable)
          const parts = window.location.hostname.split('.');
          if (parts.length > 1) {
            const parentDomain = '.' + parts.slice(-2).join('.');
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${parentDomain}`;
          }
          clearedCount++;
        }
      });
      
      console.log(`   ✅ Cleared ${clearedCount} cookies`);
    } else {
      console.log('   ℹ️  No cookies to clear');
    }
  } catch (e) {
    console.error('   ❌ Error clearing cookies:', e);
  }
  
  console.log('\n🔄 Step 3: Redirecting to login...');
  
  // Get current locale from URL or default to 'en'
  const pathname = window.location.pathname;
  const localeMatch = pathname.match(/^\/([a-z]{2})/);
  const locale = localeMatch ? localeMatch[1] : 'en';
  const loginUrl = `/${locale}/auth/login`;
  
  console.log(`   📍 Login URL: ${loginUrl}`);
  console.log('\n✅ All cleared! Redirecting to login page...');
  console.log('   After login, Supabase will set cookies correctly');
  console.log('   and API routes should work!');
  
  // Small delay to let console messages show
  setTimeout(() => {
    window.location.href = loginUrl;
  }, 1000);
  
  return {
    success: true,
    message: 'Redirecting to login...'
  };
})();

