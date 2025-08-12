// Dashboard Testing Script for Browser Console
// Copy and paste this into your browser console (F12 -> Console tab)

console.log('🧪 Starting Dashboard Tests (Browser)...');

async function runDashboardTests() {
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
    results.envCheck = { status: envResponse.status, data: envData };

    console.log('Environment Check Status:', envResponse.status);
    console.log('Environment Check Data:', envData);

    if (envResponse.status === 200 && envData.hasAllRequiredVars) {
      console.log('✅ All environment variables present');
    } else {
      console.error(
        '❌ Missing environment variables:',
        envData.missingVariables
      );
      results.errors.push(
        `Missing env vars: ${envData.missingVariables?.join(', ')}`
      );
    }
  } catch (error) {
    console.error('❌ Environment check failed:', error.message);
    results.errors.push(`Env check error: ${error.message}`);
  }

  // Test 2: Public Stats (No Authentication)
  console.log('\n🔍 Test 2: Public Stats (No Auth)');
  try {
    const publicResponse = await fetch('/api/dashboard/public-stats');
    const publicData = await publicResponse.json();
    results.publicStats = { status: publicResponse.status, data: publicData };

    console.log('Public Stats Status:', publicResponse.status);
    console.log('Public Stats Data:', publicData);

    if (publicResponse.status === 200 && !publicData.error) {
      console.log('✅ Public stats successful');
      console.log('📊 Public data counts:');
      console.log('- Promoters:', publicData.totalPromoters, '(expected: 158)');
      console.log('- Parties:', publicData.totalParties, '(expected: 16)');
      console.log('- Contracts:', publicData.totalContracts, '(expected: 0)');
    } else {
      console.error('❌ Public stats failed:', publicData.error);
      results.errors.push(`Public stats error: ${publicData.error}`);
    }
  } catch (error) {
    console.error('❌ Public stats failed:', error.message);
    results.errors.push(`Public stats error: ${error.message}`);
  }

  // Test 3: Test Endpoint (With Auth Check)
  console.log('\n🔍 Test 3: Test Endpoint (With Auth)');
  try {
    const testResponse = await fetch('/api/dashboard/test');
    const testData = await testResponse.json();
    results.testEndpoint = { status: testResponse.status, data: testData };

    console.log('Test Endpoint Status:', testResponse.status);
    console.log('Test Endpoint Data:', testData);

    if (testResponse.status === 200 && !testData.error) {
      console.log('✅ Test endpoint successful');
      console.log('🔐 Authentication:', testData.authentication);
      console.log('📊 Database counts:');
      console.log(
        '- Promoters:',
        testData.database?.promoters?.count,
        '(expected: 158)'
      );
      console.log(
        '- Parties:',
        testData.database?.parties?.count,
        '(expected: 16)'
      );
      console.log(
        '- Contracts:',
        testData.database?.contracts?.count,
        '(expected: 0)'
      );
    } else {
      console.error('❌ Test endpoint failed:', testData.error);
      results.errors.push(`Test endpoint error: ${testData.error}`);
    }
  } catch (error) {
    console.error('❌ Test endpoint failed:', error.message);
    results.errors.push(`Test endpoint error: ${error.message}`);
  }

  // Test 4: Stats Endpoint (With Auth)
  console.log('\n🔍 Test 4: Stats Endpoint (With Auth)');
  try {
    const statsResponse = await fetch('/api/dashboard/stats');
    const statsData = await statsResponse.json();
    results.statsEndpoint = { status: statsResponse.status, data: statsData };

    console.log('Stats Endpoint Status:', statsResponse.status);
    console.log('Stats Endpoint Data:', statsData);

    if (statsResponse.status === 200 && !statsData.error) {
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
    } else {
      console.error('❌ Stats endpoint failed:', statsData.error);
      results.errors.push(`Stats endpoint error: ${statsData.error}`);
    }
  } catch (error) {
    console.error('❌ Stats endpoint failed:', error.message);
    results.errors.push(`Stats endpoint error: ${error.message}`);
  }

  // Test 5: Authentication Check
  console.log('\n🔍 Test 5: Authentication Status');
  try {
    const authResponse = await fetch('/api/auth/user');
    const authData = await authResponse.json();
    results.authCheck = { status: authResponse.status, data: authData };

    console.log('Auth Check Status:', authResponse.status);
    console.log('Auth Check Data:', authData);

    if (authResponse.status === 401) {
      console.warn('⚠️ User not authenticated');
    } else if (authResponse.status === 200) {
      console.log('✅ User authenticated');
    } else {
      console.error('❌ Auth check failed:', authData.error);
      results.errors.push(`Auth check error: ${authData.error}`);
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error.message);
    results.errors.push(`Auth check error: ${error.message}`);
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log(
    '- Environment Check:',
    results.envCheck?.status === 200 ? '✅ Pass' : '❌ Fail'
  );
  console.log(
    '- Public Stats:',
    results.publicStats?.status === 200 ? '✅ Pass' : '❌ Fail'
  );
  console.log(
    '- Test Endpoint:',
    results.testEndpoint?.status === 200 ? '✅ Pass' : '❌ Fail'
  );
  console.log(
    '- Stats Endpoint:',
    results.statsEndpoint?.status === 200 ? '✅ Pass' : '❌ Fail'
  );
  console.log(
    '- Auth Check:',
    results.authCheck?.status === 200 || results.authCheck?.status === 401
      ? '✅ Pass'
      : '❌ Fail'
  );

  if (results.errors.length > 0) {
    console.log('\n❌ Errors Found:');
    results.errors.forEach(error => console.log('-', error));
  } else {
    console.log('\n🎉 All tests passed! Dashboard should be working.');
  }

  // Analysis
  console.log('\n🔍 Analysis:');
  if (results.publicStats?.status === 200 && !results.publicStats.data.error) {
    console.log('✅ Database connectivity is working (public endpoint works)');
  } else {
    console.log('❌ Database connectivity issue (public endpoint fails)');
  }

  if (results.testEndpoint?.data?.authentication) {
    console.log(
      '🔐 Authentication status:',
      results.testEndpoint.data.authentication.authenticated
        ? 'Authenticated'
        : 'Not authenticated'
    );
  }

  if (results.statsEndpoint?.data?.debug) {
    console.log('🔍 Stats API debug:', results.statsEndpoint.data.debug);
  }

  // Store results for debugging
  window.dashboardComprehensiveResults = results;

  return results;
}

// Run the tests
runDashboardTests().then(results => {
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
