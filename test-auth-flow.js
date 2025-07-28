// Comprehensive authentication flow test script
// Run this in the browser console or as a Node.js script

const BASE_URL = 'http://localhost:3002'

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...')
  
  try {
    // Test 1: Check if login page is accessible
    console.log('\n1️⃣ Testing login page accessibility...')
    const loginResponse = await fetch(`${BASE_URL}/en/auth/login`)
    console.log('Login page status:', loginResponse.status)
    console.log('Login page accessible:', loginResponse.ok)
    
    // Test 2: Check if dashboard redirects to login when not authenticated
    console.log('\n2️⃣ Testing dashboard redirect when not authenticated...')
    const dashboardResponse = await fetch(`${BASE_URL}/en/dashboard`, {
      redirect: 'manual' // Don't follow redirects automatically
    })
    console.log('Dashboard response status:', dashboardResponse.status)
    console.log('Dashboard redirects to login:', dashboardResponse.status === 302 || dashboardResponse.status === 307)
    
    if (dashboardResponse.headers.get('location')) {
      console.log('Redirect location:', dashboardResponse.headers.get('location'))
    }
    
    // Test 3: Check if root path redirects correctly
    console.log('\n3️⃣ Testing root path redirect...')
    const rootResponse = await fetch(`${BASE_URL}/`, {
      redirect: 'manual'
    })
    console.log('Root response status:', rootResponse.status)
    console.log('Root redirects correctly:', rootResponse.status === 302 || rootResponse.status === 307)
    
    if (rootResponse.headers.get('location')) {
      console.log('Root redirect location:', rootResponse.headers.get('location'))
    }
    
    // Test 4: Check if middleware is working
    console.log('\n4️⃣ Testing middleware functionality...')
    const protectedResponse = await fetch(`${BASE_URL}/en/generate-contract`, {
      redirect: 'manual'
    })
    console.log('Protected route status:', protectedResponse.status)
    console.log('Protected route redirects to login:', protectedResponse.status === 302 || protectedResponse.status === 307)
    
    // Test 5: Check authentication API endpoints
    console.log('\n5️⃣ Testing authentication API endpoints...')
    
    // Test session check API
    try {
      const sessionCheckResponse = await fetch(`${BASE_URL}/api/auth/check-session`)
      const sessionData = await sessionCheckResponse.json()
      console.log('Session check API response:', sessionData)
    } catch (error) {
      console.log('Session check API error:', error.message)
    }
    
    // Test debug session API
    try {
      const debugSessionResponse = await fetch(`${BASE_URL}/api/debug/session`)
      const debugData = await debugSessionResponse.json()
      console.log('Debug session API response:', debugData)
    } catch (error) {
      console.log('Debug session API error:', error.message)
    }
    
    // Test 6: Check browser cookies and localStorage
    console.log('\n6️⃣ Testing browser storage...')
    if (typeof window !== 'undefined') {
      console.log('Available cookies:', document.cookie)
      console.log('localStorage auth keys:', Object.keys(localStorage).filter(key => key.includes('auth')))
      console.log('sessionStorage auth keys:', Object.keys(sessionStorage).filter(key => key.includes('auth')))
    }
    
    // Test 7: Test authentication state in browser
    console.log('\n7️⃣ Testing client-side authentication state...')
    if (typeof window !== 'undefined') {
      // Check if auth provider is available
      if (window.__AUTH_PROVIDER__) {
        console.log('Auth provider state:', window.__AUTH_PROVIDER__)
      }
      
      // Check for any global auth state
      if (window.__SUPABASE_AUTH_STATE__) {
        console.log('Supabase auth state:', window.__SUPABASE_AUTH_STATE__)
      }
    }
    
    console.log('\n✅ Authentication flow test completed!')
    console.log('\n📋 Summary:')
    console.log('- Login page should be accessible (200)')
    console.log('- Dashboard should redirect to login when not authenticated (302/307)')
    console.log('- Root path should redirect to locale-specific login (302/307)')
    console.log('- Protected routes should redirect to login (302/307)')
    console.log('- API endpoints should return proper session data')
    console.log('- Browser storage should contain auth tokens if logged in')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Additional diagnostic functions
async function diagnoseAuthIssue() {
  console.log('🔍 Diagnosing Authentication Issue...')
  
  try {
    // Check environment variables (client-side only)
    if (typeof window !== 'undefined') {
      console.log('Environment check:')
      console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
      console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
    }
    
    // Test Supabase connection
    console.log('\n🔍 Testing Supabase connection...')
    try {
      const response = await fetch(`${BASE_URL}/api/test-connection`)
      const data = await response.json()
      console.log('Supabase connection test:', data)
    } catch (error) {
      console.log('Supabase connection test failed:', error.message)
    }
    
    // Test auth configuration
    console.log('\n🔍 Testing auth configuration...')
    try {
      const response = await fetch(`${BASE_URL}/api/test-config`)
      const data = await response.json()
      console.log('Auth configuration test:', data)
    } catch (error) {
      console.log('Auth configuration test failed:', error.message)
    }
    
    // Check for common auth issues
    console.log('\n🔍 Common auth issues checklist:')
    console.log('1. Environment variables set correctly')
    console.log('2. Supabase project configured')
    console.log('3. Auth providers enabled in Supabase')
    console.log('4. Redirect URLs configured')
    console.log('5. Database tables created')
    console.log('6. RLS policies applied')
    console.log('7. Middleware configured correctly')
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  }
}

// Export for Node.js or run directly in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAuthFlow, diagnoseAuthIssue }
} else {
  // Browser environment
  window.testAuthFlow = testAuthFlow
  window.diagnoseAuthIssue = diagnoseAuthIssue
  console.log('🧪 Test functions available:')
  console.log('- window.testAuthFlow() - Run comprehensive auth tests')
  console.log('- window.diagnoseAuthIssue() - Diagnose auth problems')
} 