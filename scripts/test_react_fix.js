// Test script to verify React error fix
// Run with: node scripts/test_react_fix.js

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

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testReactFix() {
  console.log('🧪 Testing React Error Fix...');
  console.log(`🔗 Testing: ${BASE_URL}/en/generate-contract\n`);

  try {
    const result = await makeRequest(`${BASE_URL}/en/generate-contract`);
    
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      // Check if the page loads without React errors
      if (result.data.includes('Something went wrong!') || result.data.includes('Minified React error #185')) {
        console.log('❌ React error still present');
        console.log('   The page is still showing React error #185');
      } else if (result.data.includes('Create New Contract') || result.data.includes('Generate Contract')) {
        console.log('✅ React error fixed!');
        console.log('   The generate-contract page is loading correctly');
      } else {
        console.log('⚠️ Page loaded but content unclear');
        console.log('   Need to check manually in browser');
      }
    } else if (result.status === 404) {
      console.log('❌ Page not found (404)');
    } else if (result.status === 500) {
      console.log('❌ Server error (500)');
    } else {
      console.log(`⚠️ Unexpected status: ${result.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Wait 2-3 minutes for Vercel deployment');
  console.log('2. Open the generate-contract page in your browser');
  console.log('3. Check if the React error is resolved');
  console.log('4. The page should load without "Something went wrong!" message');
}

testReactFix().catch(console.error); 