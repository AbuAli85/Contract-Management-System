#!/usr/bin/env node

/**
 * 🔒 Production Endpoint Security Verification Script
 *
 * This script verifies that all debug and test endpoints are properly
 * disabled or return 404/403 in production.
 *
 * Usage:
 *   node verify-production-endpoints.js [BASE_URL]
 *
 * Examples:
 *   node verify-production-endpoints.js http://localhost:3000
 *   node verify-production-endpoints.js https://your-domain.com
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// Endpoints that MUST return 404 (deleted)
const DELETED_ENDPOINTS = [
  '/api/test',
  '/api/test/google-docs',
  '/api/test/google-docs-simple',
  '/api/dashboard/env-check',
  '/api/debug',
  '/api/debug/auth',
  '/api/contract-generation/debug',
  '/api/contract-generation/test',
];

// Public files that MUST return 404 (deleted)
const DELETED_PUBLIC_FILES = ['/test-api.html', '/debug-promoters.html'];

// Endpoints that should return 403 in production (with auth) or 401 (without auth)
const PRODUCTION_GUARDED_ENDPOINTS = [
  { path: '/api/admin/seed-data', method: 'POST' },
];

async function testEndpoint(method, path, expectedStatuses, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   ${method} ${path}`);

    const response = await fetch(`${BASE_URL}${path}`, { method });
    const status = response.status;

    const isExpected = expectedStatuses.includes(status);

    if (isExpected) {
      console.log(
        `   ✅ PASS: Status ${status} (expected: ${expectedStatuses.join(' or ')})`
      );
      return { success: true, status, path, description };
    } else {
      console.log(
        `   ❌ FAIL: Status ${status} (expected: ${expectedStatuses.join(' or ')})`
      );

      // Try to get response body for analysis
      try {
        const text = await response.text();
        if (text) {
          console.log(`   📄 Response preview: ${text.substring(0, 100)}...`);
        }
      } catch (e) {
        // Ignore if we can't read body
      }

      return {
        success: false,
        status,
        path,
        description,
        expected: expectedStatuses,
      };
    }
  } catch (error) {
    console.log(`   ⚠️ ERROR: ${error.message}`);
    return { success: false, error: error.message, path, description };
  }
}

async function runSecurityAudit() {
  console.log(
    '╔═══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║     PRODUCTION ENDPOINT SECURITY VERIFICATION                 ║'
  );
  console.log(
    '╚═══════════════════════════════════════════════════════════════╝'
  );
  console.log(`\n🎯 Target: ${BASE_URL}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: [],
  };

  // Test 1: Verify deleted endpoints return 404
  console.log('═'.repeat(65));
  console.log('TEST SUITE 1: Deleted Debug/Test Endpoints (Must Return 404)');
  console.log('═'.repeat(65));

  for (const endpoint of DELETED_ENDPOINTS) {
    const result = await testEndpoint(
      'GET',
      endpoint,
      [404],
      `Deleted endpoint should return 404: ${endpoint}`
    );
    results.total++;
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push(result);
    }
  }

  // Test 2: Verify deleted public files return 404
  console.log('\n' + '═'.repeat(65));
  console.log('TEST SUITE 2: Deleted Public Debug Files (Must Return 404)');
  console.log('═'.repeat(65));

  for (const file of DELETED_PUBLIC_FILES) {
    const result = await testEndpoint(
      'GET',
      file,
      [404],
      `Deleted public file should return 404: ${file}`
    );
    results.total++;
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push(result);
    }
  }

  // Test 3: Verify production-guarded endpoints return 403 or 401
  console.log('\n' + '═'.repeat(65));
  console.log(
    'TEST SUITE 3: Production-Guarded Endpoints (Must Return 401/403)'
  );
  console.log('═'.repeat(65));

  for (const endpoint of PRODUCTION_GUARDED_ENDPOINTS) {
    const result = await testEndpoint(
      endpoint.method,
      endpoint.path,
      [401, 403],
      `Production-guarded endpoint: ${endpoint.path}`
    );
    results.total++;
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push(result);
    }
  }

  // Test 4: Verify critical admin endpoints are protected
  console.log('\n' + '═'.repeat(65));
  console.log(
    'TEST SUITE 4: Admin Endpoints Have Authentication (Must Not Be 200)'
  );
  console.log('═'.repeat(65));

  const adminEndpoints = [
    { path: '/api/admin/bulk-import', method: 'POST' },
    { path: '/api/admin/roles', method: 'GET' },
    { path: '/api/admin/update-roles', method: 'POST' },
  ];

  for (const endpoint of adminEndpoints) {
    const result = await testEndpoint(
      endpoint.method,
      endpoint.path,
      [401, 403],
      `Admin endpoint must require auth: ${endpoint.path}`
    );
    results.total++;
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push(result);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(65));
  console.log('SECURITY AUDIT SUMMARY');
  console.log('═'.repeat(65));
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(
    `📊 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`
  );

  if (results.failures.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.description}`);
      console.log(`   Path: ${failure.path}`);
      if (failure.status) {
        console.log(
          `   Got: ${failure.status}, Expected: ${failure.expected.join(' or ')}`
        );
      } else if (failure.error) {
        console.log(`   Error: ${failure.error}`);
      }
    });
  }

  console.log('\n📝 SECURITY NOTES:');
  console.log('   • All debug/test endpoints MUST return 404');
  console.log('   • Admin endpoints MUST require authentication (401/403)');
  console.log(
    '   • Production-guarded endpoints MUST be disabled in production'
  );
  console.log('   • Public debug files MUST be deleted');

  if (results.failed === 0) {
    console.log('\n🎉 SUCCESS! All security checks passed!');
    console.log('   Your production environment is secure.');
  } else {
    console.log('\n⚠️ WARNING! Some security checks failed!');
    console.log('   Please review the failures above and fix immediately.');
    console.log('   This is a CRITICAL security issue.');
  }

  console.log(`\n⏰ Completed: ${new Date().toLocaleString()}`);
  console.log('═'.repeat(65));

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the audit
console.log('⏳ Starting security verification...\n');
runSecurityAudit().catch(error => {
  console.error('❌ Security audit failed:', error);
  process.exit(1);
});
