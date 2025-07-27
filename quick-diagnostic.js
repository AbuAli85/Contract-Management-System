// Quick Diagnostic for Dashboard Redirect Issue
// Run this in your browser console

async function quickDiagnostic() {
  console.log('🔍 Quick Diagnostic for Dashboard Redirect Issue')
  console.log('================================================')
  
  // Test 1: Check current URL and redirects
  console.log('\n1️⃣ Current URL Analysis:')
  console.log('Current URL:', window.location.href)
  console.log('Pathname:', window.location.pathname)
  console.log('Search params:', window.location.search)
  
  // Test 2: Check if we're in a redirect loop
  const redirectCount = sessionStorage.getItem('redirectCount') || 0
  console.log('Redirect count:', redirectCount)
  
  // Test 3: Test basic API endpoints
  console.log('\n2️⃣ Testing API Endpoints:')
  
  try {
    // Test environment variables
    const envResponse = await fetch('/api/debug/env')
    console.log('Environment API:', envResponse.status, envResponse.ok ? '✅' : '❌')
    
    // Test auth status
    const authResponse = await fetch('/api/auth/status')
    console.log('Auth API:', authResponse.status, authResponse.ok ? '✅' : '❌')
    
    // Test Supabase connection
    const supabaseResponse = await fetch('/api/debug/supabase')
    console.log('Supabase API:', supabaseResponse.status, supabaseResponse.ok ? '✅' : '❌')
    
  } catch (error) {
    console.log('❌ API test failed:', error.message)
  }
  
  // Test 4: Check browser storage
  console.log('\n3️⃣ Browser Storage:')
  console.log('Local storage keys:', Object.keys(localStorage))
  console.log('Session storage keys:', Object.keys(sessionStorage))
  
  // Test 5: Check for auth tokens
  const authToken = localStorage.getItem('sb-auth-token')
  console.log('Auth token exists:', !!authToken)
  
  // Test 6: Check if we're on the right page
  console.log('\n4️⃣ Page Analysis:')
  console.log('Page title:', document.title)
  console.log('Body content length:', document.body.textContent.length)
  console.log('Loading indicators found:', document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="animate-spin"]').length)
  
  // Test 7: Check for console errors
  console.log('\n5️⃣ Console Errors:')
  console.log('Check the console above for any red error messages')
  
  console.log('\n🔍 Diagnostic Complete!')
  console.log('\n📋 Next Steps:')
  console.log('1. If APIs are failing (❌), check environment variables')
  console.log('2. If auth token missing, you need to log in')
  console.log('3. If redirect count is high, there\'s a redirect loop')
  console.log('4. Visit /en/dashboard/debug for detailed analysis')
}

// Export for browser
window.quickDiagnostic = quickDiagnostic
console.log('🔍 Quick diagnostic available as window.quickDiagnostic()') 