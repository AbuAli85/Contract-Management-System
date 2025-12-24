/**
 * SSO Session Diagnostic - Browser Console Script
 * 
 * Copy and paste this ENTIRE script into your browser console (F12)
 * to diagnose why localStorage.getItem('sb-auth-token') returns null
 */

(function diagnoseSSOSession() {
  console.log('%c🔍 SSO Session Diagnostic', 'font-size: 18px; font-weight: bold; color: #2563eb;');
  console.log('─'.repeat(70));
  
  const diagnostics = {
    localStorageKeys: [],
    supabaseKeys: [],
    sessionFound: false,
    sessionLocation: null,
    isLoggedIn: false,
    recommendations: []
  };

  // Step 1: Check all localStorage keys
  console.log('\n📦 Step 1: Checking localStorage...');
  if (typeof localStorage !== 'undefined') {
    const allKeys = Object.keys(localStorage);
    console.log(`   Found ${allKeys.length} keys in localStorage`);
    
    // Find auth-related keys
    const authKeys = allKeys.filter(key => 
      key.toLowerCase().includes('auth') || 
      key.toLowerCase().includes('supabase') ||
      key.toLowerCase().includes('sb-') ||
      key.toLowerCase().includes('session')
    );
    
    diagnostics.localStorageKeys = authKeys;
    
    if (authKeys.length > 0) {
      console.log(`   ✅ Found ${authKeys.length} auth-related keys:`);
      authKeys.forEach(key => {
        const value = localStorage.getItem(key);
        const preview = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null';
        console.log(`      - ${key}: ${preview}`);
        
        // Check if this looks like a session
        try {
          const parsed = JSON.parse(value);
          if (parsed.access_token || parsed.session || parsed.user) {
            diagnostics.sessionFound = true;
            diagnostics.sessionLocation = key;
            console.log(`         ✅ This appears to be a session!`);
          }
        } catch (e) {
          // Not JSON, might still be a token
          if (value && value.length > 20) {
            console.log(`         ⚠️  Non-JSON value (might be encoded token)`);
          }
        }
      });
    } else {
      console.log('   ❌ No auth-related keys found in localStorage');
      diagnostics.recommendations.push('No session found - you may need to login first');
    }
  } else {
    console.log('   ❌ localStorage is not available');
  }

  // Step 2: Check for sb-auth-token specifically
  console.log('\n🔑 Step 2: Checking for sb-auth-token...');
  const sbAuthToken = localStorage.getItem('sb-auth-token');
  if (sbAuthToken) {
    console.log('   ✅ Found sb-auth-token!');
    try {
      const parsed = JSON.parse(sbAuthToken);
      console.log('   ✅ Valid JSON session data');
      if (parsed.access_token) {
        console.log(`   ✅ Access token present: ${parsed.access_token.substring(0, 30)}...`);
        diagnostics.isLoggedIn = true;
      }
    } catch (e) {
      console.log('   ⚠️  Value exists but is not JSON:', e.message);
    }
  } else {
    console.log('   ❌ sb-auth-token not found');
    diagnostics.recommendations.push('sb-auth-token not found - SSO may not be configured or you need to login');
  }

  // Step 3: Check for Supabase default keys
  console.log('\n🔍 Step 3: Checking for Supabase default keys...');
  const supabaseDefaultKeys = [
    'supabase.auth.token',
    'supabase.auth.token.ACCESS_TOKEN',
    'supabase.auth.token.REFRESH_TOKEN',
    'sb-<project-ref>-auth-token',
  ];
  
  supabaseDefaultKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`   ✅ Found: ${key}`);
      diagnostics.supabaseKeys.push(key);
      diagnostics.sessionFound = true;
      diagnostics.sessionLocation = key;
    }
  });

  // Step 4: Check cookies (SSR might use cookies)
  console.log('\n🍪 Step 4: Checking cookies...');
  if (typeof document !== 'undefined' && document.cookie) {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const authCookies = cookies.filter(c => 
      c.toLowerCase().includes('auth') || 
      c.toLowerCase().includes('supabase') ||
      c.toLowerCase().includes('sb-')
    );
    
    if (authCookies.length > 0) {
      console.log(`   ✅ Found ${authCookies.length} auth-related cookies:`);
      authCookies.forEach(cookie => {
        const [name] = cookie.split('=');
        console.log(`      - ${name}`);
      });
      diagnostics.recommendations.push('Session found in cookies - SSR client is working, but localStorage sync may not be active');
    } else {
      console.log('   ℹ️  No auth-related cookies found');
    }
  }

  // Step 5: Check if user appears to be logged in
  console.log('\n👤 Step 5: Checking login status...');
  if (diagnostics.sessionFound || diagnostics.isLoggedIn) {
    console.log('   ✅ Session data found - you appear to be logged in');
  } else {
    console.log('   ❌ No session data found - you may not be logged in');
    diagnostics.recommendations.push('Try logging in first, then check again');
  }

  // Step 6: Recommendations
  console.log('\n' + '─'.repeat(70));
  console.log('\n📊 Diagnostic Summary:');
  console.log(`   localStorage keys found: ${diagnostics.localStorageKeys.length}`);
  console.log(`   Session found: ${diagnostics.sessionFound ? '✅ Yes' : '❌ No'}`);
  console.log(`   Session location: ${diagnostics.sessionLocation || 'None'}`);
  console.log(`   Logged in: ${diagnostics.isLoggedIn ? '✅ Yes' : '❌ No'}`);

  if (diagnostics.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    diagnostics.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }

  // Step 7: Quick fixes
  console.log('\n🔧 Quick Fixes:');
  
  if (!diagnostics.isLoggedIn && !diagnostics.sessionFound) {
    console.log('   1. Try logging in first:');
    console.log('      - Go to the login page');
    console.log('      - Enter your credentials');
    console.log('      - After login, run this script again');
  }
  
  if (diagnostics.sessionLocation && diagnostics.sessionLocation !== 'sb-auth-token') {
    console.log(`   2. Session found at: ${diagnostics.sessionLocation}`);
    console.log('      - This platform may be using a different storage key');
    console.log('      - Update Supabase client to use storageKey: "sb-auth-token"');
  }
  
  if (diagnostics.supabaseKeys.length > 0) {
    console.log('   3. Found Supabase default keys - platform may need SSO configuration');
    console.log('      - Update Supabase client to use storageKey: "sb-auth-token"');
  }

  // Step 8: Test commands
  console.log('\n🧪 Test Commands:');
  console.log('   Check all auth keys:');
  console.log('   Object.keys(localStorage).filter(k => k.includes("auth") || k.includes("supabase"))');
  console.log('\n   Check specific key:');
  console.log('   localStorage.getItem("sb-auth-token")');
  console.log('\n   List all keys:');
  console.log('   Object.keys(localStorage)');

  return diagnostics;
})();

