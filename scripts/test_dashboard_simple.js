// Simple test for dashboard stats endpoint
// Run with: node scripts/test_dashboard_simple.js

const https = require('https');

const BASE_URL =
  'https://contract-management-system-ifmh5ucr5-abuali85s-projects.vercel.app';

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
        Accept: 'application/json',
      },
    };

    const req = https.request(requestOptions, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            isJson: true,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data.substring(0, 500) + '...',
            isJson: false,
          });
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testDashboardStats() {
  console.log('🧪 Testing Dashboard Stats Endpoint...');
  console.log(`🔗 URL: ${BASE_URL}/api/dashboard/stats\n`);

  try {
    const result = await makeRequest(`${BASE_URL}/api/dashboard/stats`);

    console.log(`Status: ${result.status}`);

    if (result.status === 200) {
      console.log('✅ Success! Dashboard stats endpoint is working.');
      console.log('\n📊 Data received:');
      console.log(JSON.stringify(result.data, null, 2));

      // Check if we have real data
      if (result.data.totalPromoters > 0 || result.data.totalParties > 0) {
        console.log('\n🎉 Real data is being returned!');
        console.log(`- Promoters: ${result.data.totalPromoters}`);
        console.log(`- Parties: ${result.data.totalParties}`);
        console.log(`- Contracts: ${result.data.totalContracts}`);
      } else {
        console.log('\n⚠️ No real data returned (all zeros)');
      }
    } else if (result.status === 401) {
      console.log('❌ Still requires authentication');
      console.log('\nResponse:', result.data);
    } else {
      console.log('❌ Unexpected status');
      console.log('\nResponse:', result.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDashboardStats();
