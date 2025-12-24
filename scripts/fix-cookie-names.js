/**
 * Fix Cookie Names Script
 * 
 * This script fixes Supabase cookie names to include the project reference.
 * Supabase SSR expects cookies named: sb-{project-ref}-auth-token.0 and sb-{project-ref}-auth-token.1
 * But sometimes they're set as: sb-auth-token.0 and sb-auth-token.1
 * 
 * Run this in your browser console (F12) after logging in.
 */

(async function fixCookieNames() {
  console.log('%c🔧 Fixing Cookie Names', 'font-size: 20px; font-weight: bold; color: #2563eb;');
  console.log('═'.repeat(70));
  
  try {
    // Extract project reference from Supabase URL
    // First, try to extract from existing cookies (most reliable)
    let projectRef = null;
    const allCookies = document.cookie.split(';').map(c => c.trim());
    
    // Look for any Supabase cookie to extract project ref
    for (const cookie of allCookies) {
      if (cookie.includes('sb-') && cookie.includes('auth-token')) {
        // Extract project ref from cookie name like "sb-reootcngcptfogfozlmz-auth-token.0"
        const match = cookie.match(/sb-([^-]+)-auth-token/);
        if (match && match[1]) {
          projectRef = match[1];
          break;
        }
        // Or if it's the old format "sb-auth-token.0", we'll use hardcoded value
      }
    }
    
    // Fallback: hardcode based on domain (for thesmartpro.io)
    if (!projectRef && window.location.origin.includes('thesmartpro.io')) {
      projectRef = 'reootcngcptfogfozlmz';
    }
    
    if (!projectRef) {
      console.error('❌ Could not determine project reference');
      console.log('💡 Please manually set: const projectRef = "your-project-ref";');
      console.log('   Then run the rest of the script');
      return { success: false, error: 'Project reference not found' };
    }
    
    console.log(`📋 Project Reference: ${projectRef}`);
    console.log(`📋 Expected cookie names: sb-${projectRef}-auth-token.0, sb-${projectRef}-auth-token.1`);
    
    // Build cookie map
    const cookieMap = {};
    allCookies.forEach(c => {
      const [name, ...valueParts] = c.split('=');
      const value = valueParts.join('=');
      cookieMap[name] = value;
    });
    
    // Check for old format cookies
    const oldCookies = ['sb-auth-token.0', 'sb-auth-token.1'];
    const newCookieNames = [`sb-${projectRef}-auth-token.0`, `sb-${projectRef}-auth-token.1`];
    
    let fixed = false;
    
    // If old format cookies exist, rename them
    for (let i = 0; i < oldCookies.length; i++) {
      const oldName = oldCookies[i];
      const newName = newCookieNames[i];
      
      if (cookieMap[oldName]) {
        console.log(`🔄 Renaming cookie: ${oldName} → ${newName}`);
        console.log(`   Old value length: ${cookieMap[oldName].length} chars`);
        
        // Set new cookie with correct name
        const isProduction = window.location.protocol === 'https:';
        const secureFlag = isProduction ? '; Secure' : '';
        const cookieValue = cookieMap[oldName];
        
        // Set the new cookie (don't encode, it's already encoded)
        document.cookie = `${newName}=${cookieValue}; path=/; max-age=31536000${secureFlag}; SameSite=Lax`;
        console.log(`   ✅ New cookie set: ${newName}`);
        
        // Delete old cookie
        document.cookie = `${oldName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        console.log(`   ✅ Old cookie deleted: ${oldName}`);
        
        fixed = true;
      }
    }
    
    // Wait a moment for cookies to be set
    if (fixed) {
      console.log('\n⏳ Waiting 100ms for cookies to update...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Also check if we need to create cookies from localStorage
    const sbAuthToken = localStorage.getItem('sb-auth-token');
    if (sbAuthToken && !cookieMap[newCookieNames[0]] && !cookieMap[newCookieNames[1]]) {
      console.log('📦 Creating cookies from localStorage...');
      try {
        const sessionData = JSON.parse(sbAuthToken);
        if (sessionData && sessionData.access_token) {
          console.log('📦 Creating cookies from localStorage session...');
          // Manually create cookies with correct names from localStorage session
          // The Supabase client will handle the cookie format correctly on next request
          const sessionString = JSON.stringify(sessionData);
          const isProduction = window.location.protocol === 'https:';
          const secureFlag = isProduction ? '; Secure' : '';
          
          // Split large session into multiple cookies if needed (Supabase format)
          const maxCookieSize = 4000; // Conservative limit
          if (sessionString.length > maxCookieSize) {
            // Split into chunks (Supabase uses .0, .1 format)
            const chunks = [];
            for (let i = 0; i < sessionString.length; i += maxCookieSize) {
              chunks.push(sessionString.substring(i, i + maxCookieSize));
            }
            chunks.forEach((chunk, index) => {
              document.cookie = `${newCookieNames[index]}=${encodeURIComponent(chunk)}; path=/; max-age=31536000${secureFlag}; SameSite=Lax`;
            });
          } else {
            document.cookie = `${newCookieNames[0]}=${encodeURIComponent(sessionString)}; path=/; max-age=31536000${secureFlag}; SameSite=Lax`;
          }
          
          console.log('✅ Cookies created from localStorage');
          fixed = true;
        }
      } catch (e) {
        console.error('❌ Error parsing localStorage session:', e);
      }
    }
    
    // Verify cookies after fix
    const updatedCookies = document.cookie.split(';').map(c => c.trim());
    const updatedCookieMap = {};
    updatedCookies.forEach(c => {
      const [name, ...valueParts] = c.split('=');
      const value = valueParts.join('=');
      updatedCookieMap[name] = value;
    });
    
    const hasCorrectCookies = newCookieNames.every(name => updatedCookieMap[name]);
    
    if (hasCorrectCookies) {
      console.log('\n✅ SUCCESS! Cookies are now correctly named:');
      newCookieNames.forEach(name => {
        console.log(`   ✅ ${name}: ${updatedCookieMap[name] ? 'Exists' : 'Missing'}`);
      });
      
      // Test API endpoint
      console.log('\n🧪 Testing API endpoint...');
      try {
        const response = await fetch('/api/user/companies', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          console.log('🎉 API endpoint is now working!');
          return { success: true, fixed };
        } else {
          console.log(`⚠️  API endpoint returned ${response.status}`);
          const errorText = await response.text();
          console.log(`   Error: ${errorText}`);
          return { success: false, status: response.status, fixed };
        }
      } catch (apiError) {
        console.error('❌ Error testing API:', apiError);
        return { success: false, error: apiError.message, fixed };
      }
    } else {
      console.log('\n⚠️  Cookies still not correctly named. You may need to:');
      console.log('   1. Log out completely');
      console.log('   2. Clear all cookies');
      console.log('   3. Log back in');
      return { success: false, fixed };
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
})();

