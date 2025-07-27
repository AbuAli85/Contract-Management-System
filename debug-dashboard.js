// Dashboard Loading Diagnostic Script
// Run this in the browser console to debug dashboard loading issues

async function debugDashboard() {
  console.log('🔍 Dashboard Loading Diagnostic')
  console.log('================================')
  
  // Check 1: Environment Variables
  console.log('\n1️⃣ Checking environment variables...')
  try {
    const response = await fetch('/api/debug/env')
    const data = await response.json()
    console.log('Environment check:', data)
  } catch (error) {
    console.log('❌ Environment check failed:', error.message)
  }
  
  // Check 2: Authentication Status
  console.log('\n2️⃣ Checking authentication status...')
  try {
    const response = await fetch('/api/auth/status')
    const data = await response.json()
    console.log('Auth status:', data)
  } catch (error) {
    console.log('❌ Auth status check failed:', error.message)
  }
  
  // Check 3: Analytics API
  console.log('\n3️⃣ Testing analytics API...')
  try {
    const response = await fetch('/api/dashboard/analytics')
    console.log('Analytics API status:', response.status)
    if (response.ok) {
      const data = await response.json()
      console.log('Analytics data:', data)
    } else {
      console.log('❌ Analytics API failed:', response.statusText)
    }
  } catch (error) {
    console.log('❌ Analytics API error:', error.message)
  }
  
  // Check 4: Supabase Connection
  console.log('\n4️⃣ Testing Supabase connection...')
  try {
    const response = await fetch('/api/debug/supabase')
    const data = await response.json()
    console.log('Supabase connection:', data)
  } catch (error) {
    console.log('❌ Supabase connection check failed:', error.message)
  }
  
  // Check 5: Current Page State
  console.log('\n5️⃣ Current page state...')
  console.log('URL:', window.location.href)
  console.log('User agent:', navigator.userAgent)
  console.log('Local storage:', Object.keys(localStorage))
  console.log('Session storage:', Object.keys(sessionStorage))
  
  // Check 6: React DevTools (if available)
  console.log('\n6️⃣ React DevTools check...')
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools available')
  } else {
    console.log('❌ React DevTools not available')
  }
  
  console.log('\n🔍 Diagnostic complete!')
  console.log('Check the console for any error messages above.')
}

// Export for Node.js or run directly in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugDashboard }
} else {
  // Browser environment
  window.debugDashboard = debugDashboard
  console.log('🔍 Debug function available as window.debugDashboard()')
} 