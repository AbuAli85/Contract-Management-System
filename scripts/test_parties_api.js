// Test script to verify parties API is working
// Run with: node scripts/test_parties_api.js

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
            data: data.substring(0, 200) + '...',
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

async function testPartiesAPI() {
  console.log('🧪 Testing Parties API...');
  console.log(`🔗 Base URL: ${BASE_URL}\n`);

  const endpoints = ['/api/parties', '/en/manage-parties'];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      const result = await makeRequest(`${BASE_URL}${endpoint}`);

      if (result.status === 200) {
        console.log(`✅ ${endpoint} - Status: ${result.status} (PASS)`);

        if (result.isJson && result.data) {
          if (Array.isArray(result.data)) {
            console.log(`   📊 Found ${result.data.length} parties`);
            if (result.data.length > 0) {
              const firstParty = result.data[0];
              console.log(
                `   📋 Sample party: ${firstParty.name_en || firstParty.name}`
              );
              console.log(
                `   🔍 Has cr_expiry_date: ${firstParty.cr_expiry_date ? 'Yes' : 'No'}`
              );
              console.log(
                `   🔍 Has license_expiry_date: ${firstParty.license_expiry_date ? 'Yes' : 'No'}`
              );
            }
          } else if (result.data.error) {
            console.log(`   ❌ API Error: ${result.data.error}`);
          }
        }
      } else if (result.status === 401) {
        console.log(
          `🔐 ${endpoint} - Status: ${result.status} (Authentication required)`
        );
      } else if (result.status === 404) {
        console.log(`❌ ${endpoint} - Status: ${result.status} (Not found)`);
      } else if (result.status === 500) {
        console.log(`❌ ${endpoint} - Status: ${result.status} (Server error)`);
        if (
          result.data &&
          typeof result.data === 'string' &&
          result.data.includes('cr_expiry')
        ) {
          console.log(`   ❌ Still has cr_expiry column error`);
        }
      } else {
        console.log(`⚠️ ${endpoint} - Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message} (FAIL)`);
    }
    console.log('');
  }

  console.log('📋 Summary:');
  console.log('✅ Fixed column name issues:');
  console.log('   - Changed cr_expiry to cr_expiry_date');
  console.log('   - Changed license_expiry to license_expiry_date');
  console.log('   - Updated Party type definition');
  console.log('   - Updated manage-parties page references');
  console.log('\n🚀 Next Steps:');
  console.log('1. Wait 2-3 minutes for Vercel deployment');
  console.log('2. Check the manage-parties page in your browser');
  console.log('3. Verify no more "column does not exist" errors');
  console.log('4. Confirm parties data loads correctly');
}

testPartiesAPI().catch(console.error);
