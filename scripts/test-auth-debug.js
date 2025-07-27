// Test script to debug authentication flow
// Run this in the browser console

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...')
  
  try {
    // Test 1: Check current session
    console.log('\n1️⃣ Checking current session...')
    const sessionResponse = await fetch('/api/auth/check-session')
    const sessionData = await sessionResponse.json()
    console.log('Session check result:', sessionData)
    
    // Test 2: Check if we're on login page
    console.log('\n2️⃣ Checking current page...')
    console.log('Current URL:', window.location.href)
    console.log('Current pathname:', window.location.pathname)
    
    // Test 3: Check auth provider state
    console.log('\n3️⃣ Checking auth provider state...')
    // This will be available if the auth provider is loaded
    if (typeof window !== 'undefined' && window.__AUTH_STATE__) {
      console.log('Auth state:', window.__AUTH_STATE__)
    } else {
      console.log('Auth state not available in window object')
    }
    
    // Test 4: Check cookies
    console.log('\n4️⃣ Checking auth cookies...')
    const cookies = document.cookie.split(';').map(c => c.trim())
    const authCookies = cookies.filter(c => c.includes('auth-token') || c.includes('sb-'))
    console.log('Auth cookies:', authCookies)
    
    // Test 5: Try to access dashboard directly
    console.log('\n5️⃣ Testing dashboard access...')
    const dashboardResponse = await fetch('/en/dashboard', {
      redirect: 'manual'
    })
    console.log('Dashboard response status:', dashboardResponse.status)
    console.log('Dashboard response headers:', Object.fromEntries(dashboardResponse.headers.entries()))
    
    if (dashboardResponse.headers.get('location')) {
      console.log('Dashboard redirects to:', dashboardResponse.headers.get('location'))
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Add to window for easy access
if (typeof window !== 'undefined') {
  window.testAuthFlow = testAuthFlow
}

console.log('🧪 Auth debug script loaded. Run testAuthFlow() to test the authentication flow.') 