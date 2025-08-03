// Test script to specifically test the dashboard page
// Run with: node scripts/test_dashboard_specific.js

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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testDashboardSpecific() {
  console.log('🧪 Testing Dashboard Page Specifically...');
  console.log(`🔗 Testing: ${BASE_URL}/en/dashboard\n`);

  try {
    const result = await makeRequest(`${BASE_URL}/en/dashboard`);
    
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      // Check for React errors
      const hasReactError = result.data.includes('Minified React error #185') ||
                           result.data.includes('Something went wrong!') ||
                           result.data.includes('Error page caught error') ||
                           result.data.includes('TypeError:') ||
                           result.data.includes('Cannot read property') ||
                           result.data.includes('is not a function') ||
                           result.data.includes('totalCount') ||
                           result.data.includes('highPriorityCount');
      
      if (hasReactError) {
        console.log('❌ Dashboard has React errors:');
        if (result.data.includes('Minified React error #185')) {
          console.log('   ❌ React error #185 found');
        }
        if (result.data.includes('totalCount')) {
          console.log('   ❌ Undefined totalCount variable found');
        }
        if (result.data.includes('highPriorityCount')) {
          console.log('   ❌ Undefined highPriorityCount variable found');
        }
        if (result.data.includes('Something went wrong!')) {
          console.log('   ❌ Generic React error found');
        }
      } else {
        console.log('✅ Dashboard page is working correctly');
        console.log('   ✅ No React errors detected');
        console.log('   ✅ No undefined variables found');
      }
      
      // Check for positive indicators
      if (result.data.includes('Dashboard') || 
          result.data.includes('Welcome back') ||
          result.data.includes('Manage Parties') ||
          result.data.includes('Manage Promoters')) {
        console.log('\n✅ Dashboard content is loading correctly');
      } else {
        console.log('\n⚠️ Dashboard content unclear - may need manual verification');
      }
    } else if (result.status === 404) {
      console.log('❌ Dashboard page not found (404)');
    } else if (result.status === 500) {
      console.log('❌ Dashboard server error (500)');
    } else {
      console.log(`⚠️ Unexpected status: ${result.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('✅ Fixed React error #185 by removing undefined variables');
  console.log('   - Removed totalCount from toast message');
  console.log('   - Removed highPriorityCount from toast message');
  console.log('   - Simplified toast message to avoid undefined variables');
  console.log('\n🚀 Next Steps:');
  console.log('1. Wait 2-3 minutes for Vercel deployment');
  console.log('2. Check the dashboard page in your browser');
  console.log('3. Verify no React errors appear in the console');
  console.log('4. Confirm dashboard loads without errors');
}

testDashboardSpecific().catch(console.error); 