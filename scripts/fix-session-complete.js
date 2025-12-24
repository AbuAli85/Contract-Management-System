/**
 * Complete Session Fix - Browser Console Script
 * 
 * This script will:
 * 1. Check current session state
 * 2. Try to fix cookies from localStorage
 * 3. Test API endpoint
 * 4. Provide clear next steps
 * 
 * Copy and paste this ENTIRE script into your browser console (F12)
 */

(async function fixSessionComplete() {
  console.log('%c🔧 Complete Session Fix', 'font-size: 20px; font-weight: bold; color: #2563eb;');
  console.log('═'.repeat(70));
  
  try {
    // Step 1: Check localStorage
    console.log('\n📋 Step 1: Checking localStorage...');
    const userSession = localStorage.getItem('userSession');
    const sbAuthToken = localStorage.getItem('sb-auth-token');
    
    if (!userSession && !sbAuthToken) {
      console.error('❌ No session found in localStorage');
      console.log('   → Please log in first, then run this script');
      return { success: false, error: 'No session found' };
    }
    
    console.log('   ✅ userSession exists:', !!userSession);
    console.log('   ✅ sb-auth-token exists:', !!sbAuthToken);
    
    // Step 2: Parse session
    console.log('\n📋 Step 2: Parsing session...');
    let sessionData;
    try {
      sessionData = userSession ? JSON.parse(userSession) : JSON.parse(sbAuthToken);
      console.log('   ✅ Session parsed successfully');
      console.log('   👤 User:', sessionData.user?.email || sessionData.email || 'Unknown');
    } catch (e) {
      console.error('❌ Could not parse session:', e);
      return { success: false, error: 'Invalid session format' };
    }
    
    // Step 3: Check cookies
    console.log('\n📋 Step 3: Checking cookies...');
    const allCookies = document.cookie.split(';').map(c => c.trim());
    const supabaseCookies = allCookies.filter(c => 
      c.includes('sb-') || c.includes('supabase') || c.includes('auth-token')
    );
    console.log(`   🍪 Found ${supabaseCookies.length} Supabase-related cookies`);
    supabaseCookies.forEach(c => {
      const [name] = c.split('=');
      console.log(`      - ${name}`);
    });
    
    // Step 4: Try to get Supabase client and set session
    console.log('\n🔄 Step 4: Attempting to set session via Supabase client...');
    
    // We need to import or recreate the Supabase client
    // Since we can't import in console, we'll try to call the API that does this
    
    try {
      // Try calling the refresh session API
      const refreshResponse = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const refreshData = await refreshResponse.json();
      console.log('   📊 Refresh API response:', refreshData);
      
      if (refreshData.success && refreshData.hasSession) {
        console.log('   ✅ Session refreshed successfully');
      } else {
        console.log('   ⚠️ Session refresh returned:', refreshData.error || 'No session');
      }
    } catch (refreshError) {
      console.error('   ❌ Error calling refresh API:', refreshError);
    }
    
    // Step 5: Test API endpoint
    console.log('\n🧪 Step 5: Testing API endpoint...');
    
    try {
      const apiResponse = await fetch('/api/user/companies', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (apiResponse.ok) {
        console.log('   ✅ API endpoint works! Status:', apiResponse.status);
        const data = await apiResponse.json();
        console.log('   📊 Companies found:', data.companies?.length || 0);
        console.log('\n🎉 SUCCESS! Session is working correctly');
        return { success: true, message: 'API endpoint is working' };
      } else {
        console.log('   ❌ API endpoint returned:', apiResponse.status);
        const errorText = await apiResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.log('   📄 Error:', errorData);
        
        // Step 6: Final recommendation
        console.log('\n' + '═'.repeat(70));
        console.log('%c⚠️  SESSION FIX REQUIRED', 'font-size: 16px; font-weight: bold; color: #dc2626;');
        console.log('═'.repeat(70));
        console.log('\n📌 The current session has invalid cookies.');
        console.log('📌 The middleware can refresh sessions, but can\'t create them from localStorage.');
        console.log('\n✅ SOLUTION: Log out and log back in');
        console.log('\n   Option 1: Use the force login script');
        console.log('   → Copy and paste: scripts/force-proper-login.js');
        console.log('\n   Option 2: Manual logout');
        console.log('   → Click logout button');
        console.log('   → Log back in with your credentials');
        console.log('\n   After login:');
        console.log('   ✅ Cookies will be set correctly');
        console.log('   ✅ Middleware will refresh automatically');
        console.log('   ✅ API routes will work');
        console.log('   ✅ SSO will work across platforms');
        console.log('\n' + '═'.repeat(70));
        
        return { 
          success: false, 
          error: `API returned ${apiResponse.status}`,
          recommendation: 'Log out and log back in to get fresh cookies'
        };
      }
    } catch (apiError) {
      console.error('   ❌ Error calling API:', apiError);
      return { success: false, error: apiError.message };
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
})();

