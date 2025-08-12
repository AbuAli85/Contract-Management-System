// Test script to check multiple pages for React errors
// Run with: node scripts/test_multiple_pages.js

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
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    };

    const req = https.request(requestOptions, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers,
        });
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testMultiplePages() {
  console.log('🧪 Testing Multiple Pages for React Errors...');
  console.log(`🔗 Base URL: ${BASE_URL}\n`);

  const pages = [
    '/en/dashboard',
    '/en/manage-parties',
    '/en/manage-promoters',
    '/en/contracts',
    '/en/generate-contract',
    '/en/profile',
    '/en/onboarding',
  ];

  for (const page of pages) {
    try {
      console.log(`🔍 Testing: ${page}`);
      const result = await makeRequest(`${BASE_URL}${page}`);

      if (result.status === 200) {
        // Check for React errors
        const hasReactError =
          result.data.includes('Minified React error #185') ||
          result.data.includes('Something went wrong!') ||
          result.data.includes('Error page caught error') ||
          result.data.includes('TypeError:') ||
          result.data.includes('Cannot read property') ||
          result.data.includes('is not a function');

        if (hasReactError) {
          console.log(`❌ ${page} - React error detected`);
          if (result.data.includes('Minified React error #185')) {
            console.log(`   ❌ React error #185 found`);
          }
          if (result.data.includes('Something went wrong!')) {
            console.log(`   ❌ Generic React error found`);
          }
        } else {
          console.log(`✅ ${page} - No React errors detected`);
        }
      } else if (result.status === 404) {
        console.log(`❌ ${page} - Page not found (404)`);
      } else if (result.status === 500) {
        console.log(`❌ ${page} - Server error (500)`);
      } else {
        console.log(`⚠️ ${page} - Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ ${page} - Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('📋 Summary:');
  console.log('✅ Checked multiple pages for React errors');
  console.log('✅ Identified which pages have issues');
  console.log('\n🚀 Next Steps:');
  console.log('1. Focus on pages that show React errors');
  console.log('2. Check browser console for specific error details');
  console.log('3. Fix any remaining component issues');
}

testMultiplePages().catch(console.error);
