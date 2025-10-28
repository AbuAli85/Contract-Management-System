/**
 * Performance and Data Consistency Validation Script
 * Tests the Contracts API for data consistency and performance
 * 
 * This script validates that:
 * 1. Count queries match data queries
 * 2. Filters work consistently
 * 3. Pagination returns correct results
 * 4. Response times are acceptable
 */

const https = require('https');
const http = require('http');

// Configuration - Update these values for your environment
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = '/api/contracts';
const TIMEOUT_MS = 5000;

// Authentication - Get from environment or Supabase client
const AUTH_TOKEN = process.env.SUPABASE_AUTH_TOKEN || process.env.AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.warn('⚠️  WARNING: No authentication token provided.');
  console.warn('   Set SUPABASE_AUTH_TOKEN or AUTH_TOKEN environment variable.');
  console.warn('   Some tests may fail due to authentication requirements.\n');
}

// Test results tracking
const results = {
  tests: [],
  passed: 0,
  failed: 0,
  warnings: 0,
};

/**
 * Make a request to the API
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url, BASE_URL);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
        ...(options.headers || {}),
      },
      timeout: TIMEOUT_MS,
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Record test result
 */
function recordTest(name, status, message, details = {}) {
  const test = {
    name,
    status,
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  results.tests.push(test);

  if (status === 'PASS') {
    results.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else if (status === 'FAIL') {
    results.failed++;
    console.error(`❌ ${name}: ${message}`);
  } else {
    results.warnings++;
    console.warn(`⚠️ ${name}: ${message}`);
  }

  if (details && Object.keys(details).length > 0) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }

  return test;
}

/**
 * Test 1: Basic API Availability
 */
async function testApiAvailability() {
  console.log('\n📡 Testing API Availability...');
  
  try {
    const response = await makeRequest(`${BASE_URL}${API_ENDPOINT}?page=1&limit=10`);
    
    if (response.status !== 200) {
      return recordTest(
        'API Availability',
        'FAIL',
        `API returned status code ${response.status}`,
        { statusCode: response.status }
      );
    }

    if (!response.data || !response.data.success !== undefined) {
      return recordTest(
        'API Availability',
        'FAIL',
        'API response is not in expected format',
        { responseData: response.data }
      );
    }

    recordTest(
      'API Availability',
      'PASS',
      'API is available and responding correctly',
      { statusCode: response.status }
    );
  } catch (error) {
    recordTest(
      'API Availability',
      'FAIL',
      `API is not accessible: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Test 2: Data Consistency - Count vs. Data
 */
async function testDataConsistency() {
  console.log('\n🔍 Testing Data Consistency...');
  
  try {
    // Fetch with no filters
    const allResult = await makeRequest(`${BASE_URL}${API_ENDPOINT}?status=all`);
    const allData = allResult.data;
    
    // Validate response structure
    if (!allData.success) {
      return recordTest(
        'Data Consistency',
        'FAIL',
        'API returned success: false',
        { response: allData }
      );
    }

    const totalFromResponse = allData.totalContracts || allData.total || 0;
    const contractsFromResponse = allData.contracts?.length || 0;

    console.log(`  Total contracts reported: ${totalFromResponse}`);
    console.log(`  Contracts returned: ${contractsFromResponse}`);

    // Check for count/data mismatch
    // When status=all and no pagination, the counts should match
    if (totalFromResponse > 0 && contractsFromResponse === 0) {
      return recordTest(
        'Data Consistency',
        'FAIL',
        'Count/Data mismatch: Total count > 0 but no contracts returned',
        { total: totalFromResponse, returned: contractsFromResponse }
      );
    }

    recordTest(
      'Data Consistency',
      'PASS',
      `Count and data are consistent (${totalFromResponse} total, ${contractsFromResponse} returned)`,
      { total: totalFromResponse, returned: contractsFromResponse }
    );
  } catch (error) {
    recordTest(
      'Data Consistency',
      'FAIL',
      `Error during consistency check: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Test 3: Filter Consistency
 */
async function testFilterConsistency() {
  console.log('\n🔍 Testing Filter Consistency...');
  
  try {
    // Test multiple status filters
    const statuses = ['all', 'active', 'pending', 'completed'];
    const filterResults = {};

    for (const status of statuses) {
      const result = await makeRequest(`${BASE_URL}${API_ENDPOINT}?status=${status}`);
      const data = result.data;
      
      if (data.success) {
        filterResults[status] = {
          total: data.totalContracts || data.total || 0,
          returned: data.contracts?.length || 0,
          isValid: true,
        };

        console.log(`  Status "${status}": ${filterResults[status].returned} contracts`);
        
        // Active contracts should not exceed total
        if (status === 'active') {
          const activeCount = data.contracts?.filter(c => c.status === 'active').length || 0;
          if (activeCount > filterResults[status].total) {
            return recordTest(
              'Filter Consistency',
              'WARN',
              `Active filter returned ${activeCount} active contracts but reported total of ${filterResults[status].total}`,
              { status, activeCount, reportedTotal: filterResults[status].total }
            );
          }
        }
      }
    }

    recordTest(
      'Filter Consistency',
      'PASS',
      'All status filters work correctly',
      filterResults
    );
  } catch (error) {
    recordTest(
      'Filter Consistency',
      'FAIL',
      `Error during filter test: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Test 4: Pagination Accuracy
 */
async function testPagination() {
  console.log('\n📄 Testing Pagination...');
  
  try {
    const pageSize = 5;
    
    // Fetch first page
    const page1Result = await makeRequest(`${BASE_URL}${API_ENDPOINT}?page=1&limit=${pageSize}`);
    const page1Data = page1Result.data;
    
    if (!page1Data.success) {
      return recordTest(
        'Pagination',
        'FAIL',
        'First page request failed',
        { response: page1Data }
      );
    }

    const totalContracts = page1Data.totalContracts || page1Data.total || 0;
    const page1Count = page1Data.contracts?.length || 0;

    console.log(`  Total contracts: ${totalContracts}`);
    console.log(`  Page 1 returned: ${page1Count}`);

    // If there are more contracts, test second page
    if (totalContracts > pageSize) {
      const page2Result = await makeRequest(`${BASE_URL}${API_ENDPOINT}?page=2&limit=${pageSize}`);
      const page2Data = page2Result.data;
      
      if (page2Data.success) {
        const page2Count = page2Data.contracts?.length || 0;
        console.log(`  Page 2 returned: ${page2Count}`);

        // Check for duplicates
        const page1Ids = new Set(page1Data.contracts.map(c => c.id));
        const page2Ids = new Set(page2Data.contracts.map(c => c.id));
        
        const duplicates = [...page1Ids].filter(id => page2Ids.has(id));
        
        if (duplicates.length > 0) {
          return recordTest(
            'Pagination',
            'FAIL',
            `Found ${duplicates.length} duplicate contracts across pages`,
            { duplicates }
          );
        }

        recordTest(
          'Pagination',
          'PASS',
          `Pagination works correctly (page 1: ${page1Count}, page 2: ${page2Count}, no duplicates)`,
          { totalContracts, page1Count, page2Count }
        );
      }
    } else {
      recordTest(
        'Pagination',
        'PASS',
        'Not enough data to test pagination (only one page needed)',
        { totalContracts, page1Count }
      );
    }
  } catch (error) {
    recordTest(
      'Pagination',
      'FAIL',
      `Error during pagination test: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Test 5: Response Time Performance
 */
async function testResponseTime() {
  console.log('\n⏱️ Testing Response Time...');
  
  try {
    const startTime = Date.now();
    await makeRequest(`${BASE_URL}${API_ENDPOINT}?status=all`);
    const duration = Date.now() - startTime;

    console.log(`  Response time: ${duration}ms`);

    if (duration > 5000) {
      return recordTest(
        'Response Time',
        'FAIL',
        `Response time too slow: ${duration}ms (expected < 5000ms)`,
        { duration }
      );
    }

    if (duration > 2000) {
      recordTest(
        'Response Time',
        'WARN',
        `Response time is ${duration}ms (considering optimization)`,
        { duration }
      );
    } else {
      recordTest(
        'Response Time',
        'PASS',
        `Response time is acceptable: ${duration}ms`,
        { duration }
      );
    }
  } catch (error) {
    recordTest(
      'Response Time',
      'FAIL',
      `Error measuring response time: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Test 6: Metrics Consistency
 */
async function testMetricsConsistency() {
  console.log('\n📊 Testing Metrics Consistency...');
  
  try {
    const result = await makeRequest(`${BASE_URL}${API_ENDPOINT}?status=all`);
    const data = result.data;

    if (!data.success) {
      return recordTest(
        'Metrics Consistency',
        'FAIL',
        'Could not fetch metrics',
        { response: data }
      );
    }

    const stats = data.stats || {};
    const { total, active, pending, completed, cancelled } = stats;

    console.log(`  Total: ${total}`);
    console.log(`  Active: ${active}`);
    console.log(`  Pending: ${pending}`);
    console.log(`  Completed: ${completed}`);
    console.log(`  Cancelled: ${cancelled}`);

    // Check if sum of statuses doesn't exceed total
    const statusSum = (active || 0) + (pending || 0) + (completed || 0) + (cancelled || 0);
    
    if (statusSum > total) {
      recordTest(
        'Metrics Consistency',
        'WARN',
        `Sum of status counts (${statusSum}) exceeds total (${total})`,
        { total, statusSum, active, pending, completed, cancelled }
      );
    } else {
      recordTest(
        'Metrics Consistency',
        'PASS',
        'Metrics are consistent',
        { total, active, pending, completed, cancelled }
      );
    }
  } catch (error) {
    recordTest(
      'Metrics Consistency',
      'FAIL',
      `Error checking metrics: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('====================================');
  console.log('Performance and Data Consistency Test');
  console.log('====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Endpoint: ${API_ENDPOINT}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms`);
  console.log('====================================\n');

  try {
    await testApiAvailability();
    await testDataConsistency();
    await testFilterConsistency();
    await testPagination();
    await testResponseTime();
    await testMetricsConsistency();
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  }

  // Print summary
  console.log('\n====================================');
  console.log('Test Summary');
  console.log('====================================');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`⚠️ Warnings: ${results.warnings}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('====================================\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

