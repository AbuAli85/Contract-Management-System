// Test script to check if 404 page is causing React error
// Run with: node scripts/test_404_page.js

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

async function test404Page() {
  console.log('🧪 Testing 404 Page for React Errors...');
  console.log(`🔗 Testing: ${BASE_URL}/en/non-existent-page\n`);

  try {
    const result = await makeRequest(`${BASE_URL}/en/non-existent-page`);
    
    console.log(`Status: ${result.status}`);
    
    if (result.status === 404) {
      console.log('✅ 404 status returned correctly');
      
      // Check for React errors
      const hasReactError = result.data.includes('Minified React error #185') ||
                           result.data.includes('Something went wrong!') ||
                           result.data.includes('Error page caught error') ||
                           result.data.includes('TypeError:') ||
                           result.data.includes('Cannot read property') ||
                           result.data.includes('is not a function');
      
      if (hasReactError) {
        console.log('❌ 404 page has React errors:');
        if (result.data.includes('Minified React error #185')) {
          console.log('   ❌ React error #185 found');
        }
        if (result.data.includes('Something went wrong!')) {
          console.log('   ❌ Generic React error found');
        }
      } else {
        console.log('✅ 404 page is working correctly');
        console.log('   ✅ No React errors detected');
      }
      
      // Check for positive indicators
      if (result.data.includes('404') || 
          result.data.includes('Page Not Found') ||
          result.data.includes('doesn\'t exist')) {
        console.log('\n✅ 404 page content is loading correctly');
      } else {
        console.log('\n⚠️ 404 page content unclear');
      }
    } else if (result.status === 200) {
      console.log('⚠️ Page exists (not a 404)');
    } else {
      console.log(`⚠️ Unexpected status: ${result.status}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('✅ Tested 404 page for React errors');
  console.log('✅ Checked if not-found component is causing issues');
  console.log('\n🚀 Next Steps:');
  console.log('1. If 404 page has errors, check not-found.tsx');
  console.log('2. If other pages have errors, check sidebar or navigation');
  console.log('3. Check browser console for specific error details');
}

test404Page().catch(console.error); 