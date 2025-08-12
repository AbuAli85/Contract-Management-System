// Dashboard Authentication & Database Testing Script
// Copy and paste this into your browser console

console.log('🧪 Starting Dashboard Authentication & Database Tests...');

async function runComprehensiveTests() {
  const results = {
    envCheck: null,
    publicStats: null,
    testEndpoint: null,
    statsEndpoint: null,
    authCheck: null,
    errors: [],
  };

  // Test 1: Environment Check
  console.log('\n🔍 Test 1: Environment Variables');
  try {
    const envResponse = await fetch('/api/dashboard/env-check');
    const envData = await envResponse.json();
    results.envCheck = envData;

    console.log('Environment Check:', envData);

    if (!envData.hasAllRequiredVars) {
      console.error(
        '❌ Missing environment variables:',
        envData.missingVariables
      );
      results.errors.push(
        `Missing env vars: ${envData.missingVariables.join(', ')}`
      );
    } else {
      console.log('✅ All environment variables present');
    }
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    results.errors.push(`Env check error: ${error.message}`);
  }

  // Test 2: Public Stats (No Authentication)
  console.log('\n🔍 Test 2: Public Stats (No Auth)');
  try {
    const publicResponse = await fetch('/api/dashboard/public-stats');
    const publicData = await publicResponse.json();
    results.publicStats = publicData;

    console.log('Public Stats:', publicData);

    if (publicData.error) {
      console.error('❌ Public stats failed:', publicData.error);
      results.errors.push(`Public stats error: ${publicData.error}`);
    } else {
      console.log('✅ Public stats successful');
      console.log('📊 Public data counts:');
      console.log('- Promoters:', publicData.totalPromoters, '(expected: 158)');
      console.log('- Parties:', publicData.totalParties, '(expected: 16)');
      console.log('- Contracts:', publicData.totalContracts, '(expected: 0)');
    }
  } catch (error) {
    console.error('❌ Public stats failed:', error);
    results.errors.push(`Public stats error: ${error.message}`);
  }

  // Test 3: Test Endpoint (With Auth Check)
  console.log('\n🔍 Test 3: Test Endpoint (With Auth)');
  try {
    const testResponse = await fetch('/api/dashboard/test');
    const testData = await testResponse.json();
    results.testEndpoint = testData;

    console.log('Test Endpoint:', testData);

    if (testData.error) {
      console.error('❌ Test endpoint failed:', testData.error);
      results.errors.push(`Test endpoint error: ${testData.error}`);
    } else {
      console.log('✅ Test endpoint successful');
      console.log('🔐 Authentication:', testData.authentication);
      console.log('📊 Database counts:');
      console.log(
        '- Promoters:',
        testData.database.promoters.count,
        '(expected: 158)'
      );
      console.log(
        '- Parties:',
        testData.database.parties.count,
        '(expected: 16)'
      );
      console.log(
        '- Contracts:',
        testData.database.contracts.count,
        '(expected: 0)'
      );
    }
  } catch (error) {
    console.error('❌ Test endpoint failed:', error);
    results.errors.push(`Test endpoint error: ${error.message}`);
  }

  // Test 4: Stats Endpoint (With Auth)
  console.log('\n🔍 Test 4: Stats Endpoint (With Auth)');
  try {
    const statsResponse = await fetch('/api/dashboard/stats');
    const statsData = await statsResponse.json();
    results.statsEndpoint = statsData;

    console.log('Stats Endpoint:', statsData);

    if (statsData.error) {
      console.error('❌ Stats endpoint failed:', statsData.error);
      results.errors.push(`Stats endpoint error: ${statsData.error}`);
    } else {
      console.log('✅ Stats endpoint successful');
      console.log('🔐 Debug info:', statsData.debug);
      console.log('📊 Dashboard stats:');
      console.log(
        '- Total Promoters:',
        statsData.totalPromoters,
        '(expected: 158)'
      );
      console.log('- Total Parties:', statsData.totalParties, '(expected: 16)');
      console.log(
        '- Total Contracts:',
        statsData.totalContracts,
        '(expected: 0)'
      );
    }
  } catch (error) {
    console.error('❌ Stats endpoint failed:', error);
    results.errors.push(`Stats endpoint error: ${error.message}`);
  }

  // Test 5: Authentication Check
  console.log('\n🔍 Test 5: Authentication Status');
  try {
    const authResponse = await fetch('/api/auth/user');
    const authData = await authResponse.json();
    results.authCheck = authData;

    console.log('Auth Check:', authData);

    if (authResponse.status === 401) {
      console.warn('⚠️ User not authenticated');
    } else if (authData.error) {
      console.error('❌ Auth check failed:', authData.error);
      results.errors.push(`Auth check error: ${authData.error}`);
    } else {
      console.log('✅ User authenticated');
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    results.errors.push(`Auth check error: ${error.message}`);
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log(
    '- Environment Check:',
    results.envCheck?.hasAllRequiredVars ? '✅ Pass' : '❌ Fail'
  );
  console.log(
    '- Public Stats:',
    results.publicStats?.error ? '❌ Fail' : '✅ Pass'
  );
  console.log(
    '- Test Endpoint:',
    results.testEndpoint?.error ? '❌ Fail' : '✅ Pass'
  );
  console.log(
    '- Stats Endpoint:',
    results.statsEndpoint?.error ? '❌ Fail' : '✅ Pass'
  );
  console.log(
    '- Auth Check:',
    results.authCheck?.error ? '❌ Fail' : '✅ Pass'
  );

  if (results.errors.length > 0) {
    console.log('\n❌ Errors Found:');
    results.errors.forEach(error => console.log('-', error));
  } else {
    console.log('\n🎉 All tests passed! Dashboard should be working.');
  }

  // Analysis
  console.log('\n🔍 Analysis:');
  if (results.publicStats && !results.publicStats.error) {
    console.log('✅ Database connectivity is working (public endpoint works)');
  } else {
    console.log('❌ Database connectivity issue (public endpoint fails)');
  }

  if (results.testEndpoint && results.testEndpoint.authentication) {
    console.log(
      '🔐 Authentication status:',
      results.testEndpoint.authentication.authenticated
        ? 'Authenticated'
        : 'Not authenticated'
    );
  }

  if (results.statsEndpoint && results.statsEndpoint.debug) {
    console.log('🔍 Stats API debug:', results.statsEndpoint.debug);
  }

  // Store results for debugging
  window.dashboardComprehensiveResults = results;

  return results;
}

// Run the tests
runComprehensiveTests().then(results => {
  console.log(
    '\n🏁 Comprehensive testing completed. Results stored in window.dashboardComprehensiveResults'
  );
});

// Quick individual tests
console.log('\n🚀 Quick Tests (run individually):');
console.log(
  'fetch("/api/dashboard/env-check").then(r => r.json()).then(console.log)'
);
console.log(
  'fetch("/api/dashboard/public-stats").then(r => r.json()).then(console.log)'
);
console.log(
  'fetch("/api/dashboard/test").then(r => r.json()).then(console.log)'
);
console.log(
  'fetch("/api/dashboard/stats").then(r => r.json()).then(console.log)'
);
console.log('fetch("/api/auth/user").then(r => r.json()).then(console.log)');
