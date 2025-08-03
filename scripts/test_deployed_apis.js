// Simple test to check deployed API endpoints
// Run with: node scripts/test_deployed_apis.js

const https = require('https');

const BASE_URL = 'https://contract-management-system-ifmh5ucr5-abuali85s-projects.vercel.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Script/1.0',
        'Accept': 'application/json'
      }
    };

    const req = https.request(requestOptions, (res) => {
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
            isJson: true
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data.substring(0, 200) + '...',
            isJson: false
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

async function testEndpoints() {
  console.log('🧪 Testing deployed API endpoints...');
  console.log(`🔗 Base URL: ${BASE_URL}\n`);

  const endpoints = [
    '/api/dashboard/stats',
    '/api/dashboard/notifications', 
    '/api/dashboard/activities',
    '/api/dashboard/metrics',
    '/api/dashboard/analytics',
    '/api/dashboard/attendance',
    '/api/dashboard/test',
    '/api/dashboard/env-check',
    '/api/dashboard/public-stats',
    '/api/auth/user',
    '/api/health',
    '/api/users',
    '/api/contracts',
    '/api/promoters',
    '/api/parties'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      const result = await makeRequest(`${BASE_URL}${endpoint}`);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint} - Status: ${result.status}`);
        if (result.isJson) {
          console.log(`   Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
        } else {
          console.log(`   Response: ${result.data}`);
        }
      } else if (result.status === 401) {
        console.log(`🔐 ${endpoint} - Status: ${result.status} (Authentication required)`);
      } else if (result.status === 404) {
        console.log(`❌ ${endpoint} - Status: ${result.status} (Not found)`);
      } else {
        console.log(`⚠️ ${endpoint} - Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('🏁 Testing completed.');
}

testEndpoints().catch(console.error); 