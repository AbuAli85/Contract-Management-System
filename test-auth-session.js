// Test script to verify session refresh functionality
// Run this in the browser console or as a Node.js script

const BASE_URL = 'http://localhost:3002'

async function testSessionRefresh() {
  console.log('🧪 Testing Session Refresh...')
  
  try {
    // Test 1: Check session status
    console.log('\n1️⃣ Testing session status...')
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/refresh-session`)
    const sessionData = await sessionResponse.json()
    console.log('Session status:', sessionData)
    
    // Test 2: Try to refresh session
    console.log('\n2️⃣ Testing session refresh...')
    const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const refreshData = await refreshResponse.json()
    console.log('Session refresh result:', refreshData)
    
    // Test 3: Check auth endpoints
    console.log('\n3️⃣ Testing auth endpoints...')
    
    const endpoints = [
      '/api/auth/check-session',
      '/api/debug/session',
      '/api/test-connection',
      '/api/test-config'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`)
        const data = await response.json()
        console.log(`${endpoint}:`, data.success ? '✅ Working' : '❌ Failed')
      } catch (error) {
        console.log(`${endpoint}: ❌ Error - ${error.message}`)
      }
    }
    
    // Test 4: Check browser storage
    console.log('\n4️⃣ Checking browser storage...')
    if (typeof window !== 'undefined') {
      console.log('Cookies:', document.cookie)
      console.log('localStorage auth keys:', Object.keys(localStorage).filter(key => key.includes('auth')))
      console.log('sessionStorage auth keys:', Object.keys(sessionStorage).filter(key => key.includes('auth')))
    }
    
    console.log('\n✅ Session refresh test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Additional diagnostic function
async function diagnoseSessionIssue() {
  console.log('🔍 Diagnosing Session Issue...')
  
  try {
    // Check if we have auth cookies
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').map(c => c.trim())
      const authCookies = cookies.filter(c => c.includes('auth'))
      console.log('Auth cookies found:', authCookies.length)
      authCookies.forEach(cookie => {
        console.log('  -', cookie.split('=')[0])
      })
    }
    
    // Test session refresh with detailed logging
    console.log('\n🔄 Testing session refresh with detailed logging...')
    const response = await fetch(`${BASE_URL}/api/auth/refresh-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('Response data:', data)
    
    if (data.success && data.hasSession) {
      console.log('✅ Session is working correctly!')
    } else {
      console.log('❌ Session issue detected')
      console.log('Possible causes:')
      console.log('1. Invalid or expired auth cookies')
      console.log('2. Supabase configuration issue')
      console.log('3. Environment variables not set correctly')
      console.log('4. Database connection issue')
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  }
}

// Export for Node.js or run directly in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSessionRefresh, diagnoseSessionIssue }
} else {
  // Browser environment
  window.testSessionRefresh = testSessionRefresh
  window.diagnoseSessionIssue = diagnoseSessionIssue
  console.log('🧪 Test functions available:')
  console.log('- window.testSessionRefresh() - Test session refresh')
  console.log('- window.diagnoseSessionIssue() - Diagnose session problems')
} 