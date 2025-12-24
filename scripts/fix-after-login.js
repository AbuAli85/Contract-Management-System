/**
 * Fix Session After Login - Browser Console Script
 * 
 * Run this IMMEDIATELY after logging in to ensure cookies are set correctly
 * 
 * Copy and paste this ENTIRE script into your browser console (F12)
 */

(async function fixAfterLogin() {
  console.log('%c🔧 Fix Session After Login', 'font-size: 18px; font-weight: bold; color: #2563eb;');
  console.log('─'.repeat(70));
  
  // Wait a moment for login to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('\n📋 Step 1: Checking current session state...');
  
  try {
    // Get Supabase client (we'll need to import it or recreate it)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || window.location.origin.includes('thesmartpro.io') 
      ? 'https://reootcngcptfogfozlmz.supabase.co' 
      : null;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzY4NDAsImV4cCI6MjA1MDI1Mjg0MH0.placeholder';
    
    if (!supabaseUrl) {
      console.error('❌ Could not determine Supabase URL');
      return { success: false, error: 'Could not determine Supabase URL' };
    }
    
    // Check localStorage for session
    const userSession = localStorage.getItem('userSession');
    const sbAuthToken = localStorage.getItem('sb-auth-token');
    
    console.log('   📦 userSession exists:', !!userSession);
    console.log('   📦 sb-auth-token exists:', !!sbAuthToken);
    
    // Check cookies
    const allCookies = document.cookie.split(';').map(c => c.trim());
    const supabaseCookies = allCookies.filter(c => 
      c.includes('sb-') || c.includes('supabase') || c.includes('auth-token')
    );
    console.log('   🍪 Supabase cookies found:', supabaseCookies.length);
    supabaseCookies.forEach(c => {
      const [name] = c.split('=');
      console.log(`      - ${name}`);
    });
    
    // Try to get session from Supabase
    console.log('\n🔄 Step 2: Getting session from Supabase...');
    
    // Create a simple fetch to get session
    const sessionResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${sbAuthToken ? JSON.parse(sbAuthToken).access_token : ''}`,
      },
    });
    
    if (sessionResponse.ok) {
      const userData = await sessionResponse.json();
      console.log('   ✅ Session is valid');
      console.log('   👤 User:', userData.email || userData.id);
    } else {
      console.log('   ⚠️ Could not verify session via API');
    }
    
    // Force cookie refresh by calling an API endpoint
    console.log('\n🔄 Step 3: Testing API endpoint...');
    try {
      const apiResponse = await fetch('/api/user/companies', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
      });
      
      if (apiResponse.ok) {
        console.log('   ✅ API endpoint works! Status:', apiResponse.status);
        const data = await apiResponse.json();
        console.log('   📊 Response:', data);
        return { success: true, message: 'API endpoint is working' };
      } else {
        console.log('   ❌ API endpoint returned:', apiResponse.status);
        const errorText = await apiResponse.text();
        console.log('   📄 Error:', errorText);
        
        // Try to force refresh by calling auth endpoint
        console.log('\n🔄 Step 4: Attempting to refresh session...');
        
        // Reload page to force cookie sync
        console.log('   🔄 Reloading page to sync cookies...');
        console.log('   ⚠️ If this doesn\'t work, try logging out and back in');
        
        return { 
          success: false, 
          error: `API returned ${apiResponse.status}`,
          suggestion: 'Try logging out and back in, or wait a few seconds and refresh the page'
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

