// Test script to verify API fixes
// Run with: node scripts/test_fixes.js

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

async function testFixes() {
  console.log('🧪 Testing API Fixes...');
  console.log(`🔗 Base URL: ${BASE_URL}\n`);

  const endpoints = [
    '/api/dashboard/stats',
    '/api/dashboard/notifications',
    '/api/dashboard/activities',
    '/api/health'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      const result = await makeRequest(`${BASE_URL}${endpoint}`);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint} - Status: ${result.status} (Fixed!)`);
        if (result.isJson && result.data) {
          if (Array.isArray(result.data)) {
            console.log(`   Items: ${result.data.length}`);
          } else if (typeof result.data === 'object') {
            const keys = Object.keys(result.data);
            console.log(`   Keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
          }
        }
      } else if (result.status === 401) {
        console.log(`🔐 ${endpoint} - Status: ${result.status} (Authentication required)`);
      } else if (result.status === 500) {
        console.log(`❌ ${endpoint} - Status: ${result.status} (Still failing)`);
      } else if (result.status === 503) {
        console.log(`⚠️ ${endpoint} - Status: ${result.status} (Service unavailable)`);
      } else {
        console.log(`⚠️ ${endpoint} - Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('🏁 Testing completed.');
  console.log('\n📋 Summary:');
  console.log('- If you see "Fixed!" messages, the 500 errors are resolved');
  console.log('- If you see "Still failing", we may need additional fixes');
  console.log('- The main dashboard data should now be working correctly!');
}

testFixes().catch(console.error); 