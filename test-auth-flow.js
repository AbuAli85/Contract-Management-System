// Test script for authentication flow
// Run this in the browser console or as a Node.js script

const testAuthFlow = async () => {
  console.log('🧪 Starting authentication flow test...')
  
  // Test 1: Check current authentication state
  console.log('\n📋 Test 1: Checking current authentication state...')
  try {
    const response = await fetch('/api/auth/check-session')
    const data = await response.json()
    console.log('✅ Session check result:', data)
  } catch (error) {
    console.error('❌ Session check failed:', error)
  }
  
  // Test 2: Check available cookies
  console.log('\n📋 Test 2: Checking available cookies...')
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';').map(c => c.trim())
    const authCookies = cookies.filter(c => 
      c.includes('auth') || c.includes('supabase') || c.includes('sb-')
    )
    console.log('✅ Auth cookies found:', authCookies)
  } else {
    console.log('⚠️ Not in browser environment, skipping cookie check')
  }
  
  // Test 3: Test login API
  console.log('\n📋 Test 3: Testing login API...')
  try {
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'luxsess2001@gmail.com',
        password: 'test123' // Replace with actual password
      }),
      credentials: 'include'
    })
    
    const loginData = await loginResponse.json()
    console.log('✅ Login API response:', loginData)
    
    if (loginData.success) {
      console.log('✅ Login successful!')
      
      // Test 4: Check session after login
      console.log('\n📋 Test 4: Checking session after login...')
      const sessionResponse = await fetch('/api/auth/check-session', {
        credentials: 'include'
      })
      const sessionData = await sessionResponse.json()
      console.log('✅ Session after login:', sessionData)
    } else {
      console.log('❌ Login failed:', loginData.error)
    }
  } catch (error) {
    console.error('❌ Login test failed:', error)
  }
  
  // Test 5: Test middleware redirects
  console.log('\n📋 Test 5: Testing middleware redirects...')
  try {
    const dashboardResponse = await fetch('/en/dashboard', {
      credentials: 'include'
    })
    console.log('✅ Dashboard response status:', dashboardResponse.status)
    console.log('✅ Dashboard response URL:', dashboardResponse.url)
  } catch (error) {
    console.error('❌ Dashboard test failed:', error)
  }
  
  console.log('\n🧪 Authentication flow test completed!')
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAuthFlow }
}

// Auto-run in browser
if (typeof window !== 'undefined') {
  console.log('🧪 Authentication test script loaded. Run testAuthFlow() to start testing.')
} 