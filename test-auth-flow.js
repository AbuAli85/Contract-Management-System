// Simple test script to verify authentication flow
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
    
    console.log('\n✅ Authentication flow test completed!')
    console.log('\n📋 Summary:')
    console.log('- Login page should be accessible (200)')
    console.log('- Dashboard should redirect to login when not authenticated (302/307)')
    console.log('- Root path should redirect to locale-specific login (302/307)')
    console.log('- Protected routes should redirect to login (302/307)')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Export for Node.js or run directly in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAuthFlow }
} else {
  // Browser environment
  window.testAuthFlow = testAuthFlow
  console.log('🧪 Test function available as window.testAuthFlow()')
} 