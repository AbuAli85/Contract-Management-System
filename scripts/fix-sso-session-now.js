/**
 * Quick Fix: Sync Current Session to SSO
 * 
 * Copy and paste this ENTIRE script into your browser console (F12)
 * to immediately sync your current userSession to sb-auth-token for SSO
 */

(function fixSSOSessionNow() {
  console.log('%c🔧 Quick SSO Session Fix', 'font-size: 18px; font-weight: bold; color: #10b981;');
  console.log('─'.repeat(70));
  
  try {
    // Get the existing userSession
    const userSession = localStorage.getItem('userSession');
    
    if (!userSession) {
      console.log('❌ No userSession found. Please login first.');
      return;
    }
    
    console.log('✅ Found userSession');
    
    // Parse the session data
    let sessionData;
    try {
      sessionData = JSON.parse(userSession);
      console.log('✅ Parsed session data');
    } catch (e) {
      console.error('❌ Could not parse userSession:', e);
      return;
    }
    
    // Check if it's a valid session
    if (!sessionData || (!sessionData.user && !sessionData.access_token && !sessionData.session)) {
      console.error('❌ Invalid session data structure');
      return;
    }
    
    // Extract session information
    let supabaseSession;
    
    if (sessionData.session) {
      // If it has a session object, use that
      supabaseSession = sessionData.session;
      console.log('✅ Using session.session');
    } else if (sessionData.access_token) {
      // If it has access_token directly, wrap it in session format
      supabaseSession = {
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at,
        expires_in: sessionData.expires_in,
        token_type: sessionData.token_type || 'bearer',
        user: sessionData.user,
      };
      console.log('✅ Using session.access_token');
    } else if (sessionData.user) {
      // If it only has user, try to construct minimal session
      supabaseSession = {
        user: sessionData.user,
        access_token: sessionData.access_token || '',
        refresh_token: sessionData.refresh_token || '',
      };
      console.log('✅ Using session.user');
    } else {
      console.error('❌ Could not extract session data');
      return;
    }
    
    // Store in sb-auth-token for SSO
    localStorage.setItem('sb-auth-token', JSON.stringify(supabaseSession));
    console.log('✅ Synced to sb-auth-token');
    
    // Verify it was stored
    const verify = localStorage.getItem('sb-auth-token');
    if (verify) {
      console.log('✅ Verification: sb-auth-token is now set');
      console.log('📝 Session preview:', verify.substring(0, 100) + '...');
      
      // Test if it's valid JSON
      try {
        const parsed = JSON.parse(verify);
        if (parsed.user || parsed.access_token) {
          console.log('✅ Session is valid and ready for SSO!');
          console.log('\n🎉 Success! Your session is now synced for SSO.');
          console.log('   - Refresh the page to see if 401 errors are fixed');
          console.log('   - Check other platforms - they should now recognize your session');
        }
      } catch (e) {
        console.warn('⚠️  Stored but may not be valid JSON:', e);
      }
    } else {
      console.error('❌ Failed to store sb-auth-token');
    }
    
    // Also check if we need to update the format
    console.log('\n📊 Session Summary:');
    console.log('   userSession:', userSession ? '✅ Exists' : '❌ Missing');
    console.log('   sb-auth-token:', localStorage.getItem('sb-auth-token') ? '✅ Exists' : '❌ Missing');
    
    return {
      success: true,
      userSession: !!userSession,
      ssoToken: !!localStorage.getItem('sb-auth-token'),
    };
    
  } catch (error) {
    console.error('❌ Error fixing SSO session:', error);
    return {
      success: false,
      error: error.message,
    };
  }
})();

