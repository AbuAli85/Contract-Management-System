// Dashboard Fix Testing Script
// Copy and paste this into your browser console

console.log('🧪 Starting Dashboard Fix Tests...');

async function runDashboardTests() {
  const results = {
    envCheck: null,
    testEndpoint: null,
    statsEndpoint: null,
    errors: []
  };

  // Test 1: Environment Check
  console.log('\n🔍 Test 1: Environment Variables');
  try {
    const envResponse = await fetch('/api/dashboard/env-check');
    const envData = await envResponse.json();
    results.envCheck = envData;
    
    console.log('Environment Check:', envData);
    
    if (!envData.hasAllRequiredVars) {
      console.error('❌ Missing environment variables:', envData.missingVariables);
      results.errors.push(`Missing env vars: ${envData.missingVariables.join(', ')}`);
    } else {
      console.log('✅ All environment variables present');
    }
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    results.errors.push(`Env check error: ${error.message}`);
  }

  // Test 2: Basic Test Endpoint
  console.log('\n🔍 Test 2: Basic Database Test');
  try {
    const testResponse = await fetch('/api/dashboard/test');
    const testData = await testResponse.json();
    results.testEndpoint = testData;
    
    console.log('Database Test:', testData);
    
    if (testData.error) {
      console.error('❌ Database test failed:', testData.error);
      results.errors.push(`Database test error: ${testData.error}`);
    } else {
      console.log('✅ Database test successful');
      console.log('📊 Data counts:');
      console.log('- Promoters:', testData.database.promoters.count, '(expected: 158)');
      console.log('- Parties:', testData.database.parties.count, '(expected: 16)');
      console.log('- Contracts:', testData.database.contracts.count, '(expected: 0)');
    }
  } catch (error) {
    console.error('❌ Database test failed:', error);
    results.errors.push(`Database test error: ${error.message}`);
  }

  // Test 3: Stats Endpoint
  console.log('\n🔍 Test 3: Dashboard Stats API');
  try {
    const statsResponse = await fetch('/api/dashboard/stats');
    const statsData = await statsResponse.json();
    results.statsEndpoint = statsData;
    
    console.log('Stats API:', statsData);
    
    if (statsData.error) {
      console.error('❌ Stats API failed:', statsData.error);
      results.errors.push(`Stats API error: ${statsData.error}`);
    } else {
      console.log('✅ Stats API successful');
      console.log('📊 Dashboard stats:');
      console.log('- Total Promoters:', statsData.totalPromoters, '(expected: 158)');
      console.log('- Total Parties:', statsData.totalParties, '(expected: 16)');
      console.log('- Total Contracts:', statsData.totalContracts, '(expected: 0)');
    }
  } catch (error) {
    console.error('❌ Stats API failed:', error);
    results.errors.push(`Stats API error: ${error.message}`);
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('- Environment Check:', results.envCheck?.hasAllRequiredVars ? '✅ Pass' : '❌ Fail');
  console.log('- Database Test:', results.testEndpoint?.error ? '❌ Fail' : '✅ Pass');
  console.log('- Stats API:', results.statsEndpoint?.error ? '❌ Fail' : '✅ Pass');
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors Found:');
    results.errors.forEach(error => console.log('-', error));
  } else {
    console.log('\n🎉 All tests passed! Dashboard should be working.');
  }

  // Store results for debugging
  window.dashboardTestResults = results;
  
  return results;
}

// Run the tests
runDashboardTests().then(results => {
  console.log('\n🏁 Testing completed. Results stored in window.dashboardTestResults');
});

// Quick individual tests
console.log('\n🚀 Quick Tests (run individually):');
console.log('fetch("/api/dashboard/env-check").then(r => r.json()).then(console.log)');
console.log('fetch("/api/dashboard/test").then(r => r.json()).then(console.log)');
console.log('fetch("/api/dashboard/stats").then(r => r.json()).then(console.log)'); 