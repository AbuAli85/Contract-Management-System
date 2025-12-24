/**
 * Refresh Session Now - Browser Console Script
 * 
 * Run this IMMEDIATELY after logging in to refresh the session and set cookies correctly
 * 
 * Copy and paste this ENTIRE script into your browser console (F12)
 */

(async function refreshSessionNow() {
  console.log('%c🔄 Refresh Session Now', 'font-size: 18px; font-weight: bold; color: #2563eb;');
  console.log('─'.repeat(70));
  
  try {
    console.log('\n📋 Step 1: Checking current session...');
    
    // Get session from localStorage
    const userSession = localStorage.getItem('userSession');
    const sbAuthToken = localStorage.getItem('sb-auth-token');
    
    if (!userSession && !sbAuthToken) {
      console.error('❌ No session found in localStorage');
      console.log('   Please log in first, then run this script');
      return { success: false, error: 'No session found' };
    }
    
    console.log('   ✅ Session found in localStorage');
    
    // Parse session
    let sessionData;
    try {
      sessionData = userSession ? JSON.parse(userSession) : JSON.parse(sbAuthToken);
    } catch (e) {
      console.error('❌ Could not parse session:', e);
      return { success: false, error: 'Invalid session format' };
    }
    
    console.log('   👤 User:', sessionData.user?.email || sessionData.email || 'Unknown');
    
    // Step 2: Call refresh session API
    console.log('\n🔄 Step 2: Calling refresh session API...');
    
    try {
      const refreshResponse = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('   ✅ Session refreshed successfully');
        console.log('   📊 Response:', refreshData);
      } else {
        console.log('   ⚠️ Refresh API returned:', refreshResponse.status);
        const errorText = await refreshResponse.text();
        console.log('   📄 Error:', errorText);
      }
    } catch (refreshError) {
      console.error('   ❌ Error calling refresh API:', refreshError);
    }
    
    // Step 3: Test API endpoint
    console.log('\n🧪 Step 3: Testing API endpoint...');
    
    try {
      const apiResponse = await fetch('/api/user/companies', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
      });
      
      if (apiResponse.ok) {
        console.log('   ✅ API endpoint works! Status:', apiResponse.status);
        const data = await apiResponse.json();
        console.log('   📊 Companies found:', data.companies?.length || 0);
        console.log('\n✅ SUCCESS! Session is working correctly');
        return { success: true, message: 'Session refreshed and API working' };
      } else {
        console.log('   ❌ API endpoint returned:', apiResponse.status);
        const errorText = await apiResponse.text();
        console.log('   📄 Error:', errorText);
        
        // Step 4: Try page refresh
        console.log('\n🔄 Step 4: Page refresh recommended...');
        console.log('   ⚠️ Cookies may not be set correctly');
        console.log('   💡 Try refreshing the page (F5 or Ctrl+R)');
        console.log('   💡 Or log out and log back in');
        
        return { 
          success: false, 
          error: `API returned ${apiResponse.status}`,
          suggestion: 'Refresh the page or log out and back in'
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

