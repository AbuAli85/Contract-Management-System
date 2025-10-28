# Performance and Data Consistency Tests

This directory contains automated tests to validate the SmartPro Contract Management System's data consistency, performance, and API reliability.

## Running the Tests

### Prerequisites

1. **Running Application**: Ensure your Next.js application is running locally or accessible at the target URL
2. **Authentication Token**: Obtain a valid Supabase authentication token

### Getting an Authentication Token

#### Option 1: From Browser (Recommended for Development)

1. Open your application in the browser and log in
2. Open browser DevTools (F12)
3. Go to the **Application** or **Storage** tab
4. Find **Cookies** or **Local Storage**
5. Look for the Supabase auth token (usually named `sb-*-auth-token` or similar)
6. Copy the `access_token` value from the JSON

#### Option 2: Using Supabase CLI

```bash
npx supabase login
npx supabase auth login --email your-email@example.com
```

#### Option 3: Programmatically (for CI/CD)

Create a script to generate a token:

```javascript
// get-auth-token.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
  });

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(data.session.access_token);
}

getToken();
```

### Running the Tests

#### Basic Run (No Authentication)

```bash
node tests/performance-validation.js
```

**Note**: Some tests will fail without authentication.

#### With Authentication Token

```bash
# Set token as environment variable
export SUPABASE_AUTH_TOKEN="your-token-here"
node tests/performance-validation.js
```

Or inline:

```bash
SUPABASE_AUTH_TOKEN="your-token-here" node tests/performance-validation.js
```

#### Against Production

```bash
API_BASE_URL="https://portal.thesmartpro.io" \
SUPABASE_AUTH_TOKEN="your-token-here" \
node tests/performance-validation.js
```

### Setting Up for CI/CD

For automated testing in CI/CD pipelines:

1. **Create a test user** in your Supabase project
2. **Store credentials** as environment secrets:
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`
   - Or pre-generate a long-lived token (not recommended for security)

3. **Generate token in CI pipeline**:

```yaml
# Example: GitHub Actions
- name: Get Auth Token
  run: |
    TOKEN=$(node tests/get-auth-token.js)
    echo "SUPABASE_AUTH_TOKEN=$TOKEN" >> $GITHUB_ENV

- name: Run Validation Tests
  run: node tests/performance-validation.js
```

## Test Coverage

The validation script tests the following:

### 1. API Availability
- Verifies the API endpoint is accessible
- Checks response format is correct
- **Status**: Basic connectivity test

### 2. Data Consistency
- **Critical Test**: Verifies count queries match data queries
- Detects the "2 contracts shown, 0 returned" issue
- Ensures `totalContracts` matches `contracts.length` appropriately

### 3. Filter Consistency
- Tests status filters: `all`, `active`, `pending`, `completed`
- Verifies filtered results match the filter criteria
- Ensures active count doesn't exceed total

### 4. Pagination Accuracy
- Tests multi-page results
- Checks for duplicate records across pages
- Validates page size limits

### 5. Response Time Performance
- Measures API response time
- **Pass**: < 2000ms (optimal)
- **Warning**: 2000-5000ms (acceptable but consider optimization)
- **Fail**: > 5000ms (too slow)

### 6. Metrics Consistency
- Validates that sum of status counts matches totals
- Ensures no mathematical impossibilities
- Checks `active + pending + completed + cancelled ≤ total`

## Understanding Test Results

### Sample Output

```
====================================
Performance and Data Consistency Test
====================================
Base URL: http://localhost:3000
Endpoint: /api/contracts
Timeout: 5000ms
====================================

📡 Testing API Availability...
✅ API Availability: API is available and responding correctly
   Details: { "statusCode": 200 }

🔍 Testing Data Consistency...
✅ Data Consistency: Count and data are consistent (2 total, 2 returned)
   Details: { "total": 2, "returned": 2 }

🔍 Testing Filter Consistency...
✅ Filter Consistency: All status filters work correctly

📄 Testing Pagination...
✅ Pagination: Not enough data to test pagination (only one page needed)
   Details: { "totalContracts": 2, "page1Count": 2 }

⏱️ Testing Response Time...
  Response time: 456ms
✅ Response Time: Response time is acceptable: 456ms
   Details: { "duration": 456 }

📊 Testing Metrics Consistency...
✅ Metrics Consistency: Metrics are consistent
   Details: { "total": 2, "active": 0, "pending": 0, ... }

====================================
Test Summary
====================================
Total Tests: 6
✅ Passed: 6
⚠️ Warnings: 0
❌ Failed: 0
====================================
```

### Exit Codes

- **0**: All tests passed
- **1**: One or more tests failed

Use in CI/CD to fail builds on test failures.

## Troubleshooting

### "Request timeout" Error

**Cause**: Application not running or unreachable

**Solutions**:
- Ensure `npm run dev` is running
- Check the `API_BASE_URL` is correct
- Verify firewall/network settings

### "Insufficient permissions" Error

**Cause**: Missing or invalid authentication token

**Solutions**:
- Set `SUPABASE_AUTH_TOKEN` environment variable
- Verify the token is valid and not expired
- Check RBAC permissions for the test user

### "Count/Data mismatch" Error

**Cause**: The data inconsistency issue described in the analysis document

**Solutions**:
- Run database migrations
- Check RLS policies
- Verify metrics service is using same filters as API

### Slow Response Times

**Cause**: Missing database indexes or large dataset

**Solutions**:
- Run `database/optimizations/add-performance-indexes.sql`
- Check for slow queries in Supabase dashboard
- Consider pagination limits

## Related Documentation

- **[DEPLOYMENT_READY.md](../DEPLOYMENT_READY.md)**: Deployment checklist and data fix verification
- **[Data Inconsistency Analysis](../docs/data-inconsistency-analysis.md)**: Root cause analysis and resolution
- **[API Documentation](../docs/api.md)**: API endpoint specifications

## Contributing

To add new tests:

1. Create a new `async function testYourFeature()`
2. Use `recordTest()` to log results
3. Add the test to `runAllTests()`
4. Update this README with test description

Example:

```javascript
async function testYourFeature() {
  console.log('\n🧪 Testing Your Feature...');
  
  try {
    // Test logic here
    const result = await makeRequest(`${BASE_URL}/api/your-endpoint`);
    
    if (result.data.success) {
      recordTest(
        'Your Feature',
        'PASS',
        'Feature works correctly',
        { details: result.data }
      );
    } else {
      recordTest(
        'Your Feature',
        'FAIL',
        'Feature returned error',
        { error: result.data.error }
      );
    }
  } catch (error) {
    recordTest(
      'Your Feature',
      'FAIL',
      `Error testing feature: ${error.message}`,
      { error: error.message }
    );
  }
}
```

