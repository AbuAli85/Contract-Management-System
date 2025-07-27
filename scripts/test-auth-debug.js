// Node.js test script to debug authentication flow
// Run with: node scripts/test-auth-debug.js

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Auth-Test-Script/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  
  try {
    // Test 1: Check if server is running
    console.log('\n1️⃣ Testing server availability...');
    try {
      const response = await makeRequest(`${BASE_URL}/api/health`);
      console.log('✅ Server is running, health check status:', response.status);
    } catch (error) {
      console.log('❌ Server is not running or health endpoint not available');
      console.log('💡 Please start the development server with: pnpm dev');
      return;
    }

    // Test 2: Check session endpoint
    console.log('\n2️⃣ Testing session check endpoint...');
    try {
      const response = await makeRequest(`${BASE_URL}/api/auth/check-session`);
      console.log('✅ Session check endpoint status:', response.status);
      if (response.data) {
        const sessionData = JSON.parse(response.data);
        console.log('📋 Session data:', sessionData);
      }
    } catch (error) {
      console.log('❌ Session check endpoint failed:', error.message);
    }

    // Test 3: Check login page accessibility
    console.log('\n3️⃣ Testing login page accessibility...');
    try {
      const response = await makeRequest(`${BASE_URL}/en/auth/login`);
      console.log('✅ Login page status:', response.status);
      console.log('📋 Login page accessible:', response.status === 200);
    } catch (error) {
      console.log('❌ Login page failed:', error.message);
    }

    // Test 4: Check dashboard redirect when not authenticated
    console.log('\n4️⃣ Testing dashboard redirect when not authenticated...');
    try {
      const response = await makeRequest(`${BASE_URL}/en/dashboard`);
      console.log('✅ Dashboard response status:', response.status);
      console.log('📋 Dashboard redirects to login:', response.status === 302 || response.status === 307);
      
      if (response.headers.location) {
        console.log('📍 Redirect location:', response.headers.location);
      }
    } catch (error) {
      console.log('❌ Dashboard test failed:', error.message);
    }

    // Test 5: Check root path redirect
    console.log('\n5️⃣ Testing root path redirect...');
    try {
      const response = await makeRequest(`${BASE_URL}/`);
      console.log('✅ Root path status:', response.status);
      console.log('📋 Root path redirects correctly:', response.status === 302 || response.status === 307);
      
      if (response.headers.location) {
        console.log('📍 Root redirect location:', response.headers.location);
      }
    } catch (error) {
      console.log('❌ Root path test failed:', error.message);
    }

    // Test 6: Test login API endpoint
    console.log('\n6️⃣ Testing login API endpoint...');
    try {
      const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        })
      });
      console.log('✅ Login API status:', response.status);
      if (response.data) {
        const loginData = JSON.parse(response.data);
        console.log('📋 Login response:', loginData);
      }
    } catch (error) {
      console.log('❌ Login API test failed:', error.message);
    }

    console.log('\n🎉 Authentication flow test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Start the development server: pnpm dev');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Try logging in with valid credentials');
    console.log('4. Check browser console for debug logs');
    console.log('5. Verify redirects work properly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAuthFlow();
}

module.exports = { testAuthFlow }; 