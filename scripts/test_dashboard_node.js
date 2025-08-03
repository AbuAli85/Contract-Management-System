// Dashboard Testing Script for Node.js
// Run with: node scripts/test_dashboard_node.js

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'https://contract-management-system-ifmh5ucr5-abuali85s-projects.vercel.app';
// If you're testing locally, use: const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Dashboard-Test-Script/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runDashboardTests() {
  console.log('🧪 Starting Dashboard Tests (Node.js)...');
  console.log(`🔗 Testing against: ${BASE_URL}`);
  
  const results = {
    envCheck: null,
    publicStats: null,
    testEndpoint: null,
    statsEndpoint: null,
    authCheck: null,
    errors: []
  };

  // Test 1: Environment Check
  console.log('\n🔍 Test 1: Environment Variables');
  try {
    const envResponse = await makeRequest(`${BASE_URL}/api/dashboard/env-check`);
    results.envCheck = envResponse;
    
    console.log('Environment Check Status:', envResponse.status);
    console.log('Environment Check Data:', envResponse.data);
    
    if (envResponse.status === 200 && envResponse.data.hasAllRequiredVars) {
      console.log('✅ All environment variables present');
    } else {
      console.error('❌ Missing environment variables:', envResponse.data.missingVariables);
      results.errors.push(`Missing env vars: ${envResponse.data.missingVariables?.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Environment check failed:', error.message);
    results.errors.push(`Env check error: ${error.message}`);
  }

  // Test 2: Public Stats (No Authentication)
  console.log('\n🔍 Test 2: Public Stats (No Auth)');
  try {
    const publicResponse = await makeRequest(`${BASE_URL}/api/dashboard/public-stats`);
    results.publicStats = publicResponse;
    
    console.log('Public Stats Status:', publicResponse.status);
    console.log('Public Stats Data:', publicResponse.data);
    
    if (publicResponse.status === 200 && !publicResponse.data.error) {
      console.log('✅ Public stats successful');
      console.log('📊 Public data counts:');
      console.log('- Promoters:', publicResponse.data.totalPromoters, '(expected: 158)');
      console.log('- Parties:', publicResponse.data.totalParties, '(expected: 16)');
      console.log('- Contracts:', publicResponse.data.totalContracts, '(expected: 0)');
    } else {
      console.error('❌ Public stats failed:', publicResponse.data.error);
      results.errors.push(`Public stats error: ${publicResponse.data.error}`);
    }
  } catch (error) {
    console.error('❌ Public stats failed:', error.message);
    results.errors.push(`Public stats error: ${error.message}`);
  }

  // Test 3: Test Endpoint (With Auth Check)
  console.log('\n🔍 Test 3: Test Endpoint (With Auth)');
  try {
    const testResponse = await makeRequest(`${BASE_URL}/api/dashboard/test`);
    results.testEndpoint = testResponse;
    
    console.log('Test Endpoint Status:', testResponse.status);
    console.log('Test Endpoint Data:', testResponse.data);
    
    if (testResponse.status === 200 && !testResponse.data.error) {
      console.log('✅ Test endpoint successful');
      console.log('🔐 Authentication:', testResponse.data.authentication);
      console.log('📊 Database counts:');
      console.log('- Promoters:', testResponse.data.database?.promoters?.count, '(expected: 158)');
      console.log('- Parties:', testResponse.data.database?.parties?.count, '(expected: 16)');
      console.log('- Contracts:', testResponse.data.database?.contracts?.count, '(expected: 0)');
    } else {
      console.error('❌ Test endpoint failed:', testResponse.data.error);
      results.errors.push(`Test endpoint error: ${testResponse.data.error}`);
    }
  } catch (error) {
    console.error('❌ Test endpoint failed:', error.message);
    results.errors.push(`Test endpoint error: ${error.message}`);
  }

  // Test 4: Stats Endpoint (With Auth)
  console.log('\n🔍 Test 4: Stats Endpoint (With Auth)');
  try {
    const statsResponse = await makeRequest(`${BASE_URL}/api/dashboard/stats`);
    results.statsEndpoint = statsResponse;
    
    console.log('Stats Endpoint Status:', statsResponse.status);
    console.log('Stats Endpoint Data:', statsResponse.data);
    
    if (statsResponse.status === 200 && !statsResponse.data.error) {
      console.log('✅ Stats endpoint successful');
      console.log('🔐 Debug info:', statsResponse.data.debug);
      console.log('📊 Dashboard stats:');
      console.log('- Total Promoters:', statsResponse.data.totalPromoters, '(expected: 158)');
      console.log('- Total Parties:', statsResponse.data.totalParties, '(expected: 16)');
      console.log('- Total Contracts:', statsResponse.data.totalContracts, '(expected: 0)');
    } else {
      console.error('❌ Stats endpoint failed:', statsResponse.data.error);
      results.errors.push(`Stats endpoint error: ${statsResponse.data.error}`);
    }
  } catch (error) {
    console.error('❌ Stats endpoint failed:', error.message);
    results.errors.push(`Stats endpoint error: ${error.message}`);
  }

  // Test 5: Authentication Check
  console.log('\n🔍 Test 5: Authentication Status');
  try {
    const authResponse = await makeRequest(`${BASE_URL}/api/auth/user`);
    results.authCheck = authResponse;
    
    console.log('Auth Check Status:', authResponse.status);
    console.log('Auth Check Data:', authResponse.data);
    
    if (authResponse.status === 401) {
      console.warn('⚠️ User not authenticated (expected for server-side test)');
    } else if (authResponse.status === 200) {
      console.log('✅ User authenticated');
    } else {
      console.error('❌ Auth check failed:', authResponse.data.error);
      results.errors.push(`Auth check error: ${authResponse.data.error}`);
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error.message);
    results.errors.push(`Auth check error: ${error.message}`);
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('- Environment Check:', results.envCheck?.status === 200 ? '✅ Pass' : '❌ Fail');
  console.log('- Public Stats:', results.publicStats?.status === 200 ? '✅ Pass' : '❌ Fail');
  console.log('- Test Endpoint:', results.testEndpoint?.status === 200 ? '✅ Pass' : '❌ Fail');
  console.log('- Stats Endpoint:', results.statsEndpoint?.status === 200 ? '✅ Pass' : '❌ Fail');
  console.log('- Auth Check:', results.authCheck?.status === 200 || results.authCheck?.status === 401 ? '✅ Pass' : '❌ Fail');
  
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
    console.log('🔐 Authentication status:', results.testEndpoint.data.authentication.authenticated ? 'Authenticated' : 'Not authenticated');
  }
  
  if (results.statsEndpoint?.data?.debug) {
    console.log('🔍 Stats API debug:', results.statsEndpoint.data.debug);
  }

  return results;
}

// Run the tests
runDashboardTests().then(results => {
  console.log('\n🏁 Testing completed.');
  process.exit(results.errors.length > 0 ? 1 : 0);
}).catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
}); 