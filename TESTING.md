# Testing Guide - SmartPro Contract Management System

This guide explains how to run validation tests to ensure data consistency and API performance.

## Quick Start

### Windows

```powershell
# Add test credentials to .env.local
echo TEST_USER_EMAIL=your-email@example.com >> .env.local
echo TEST_USER_PASSWORD=your-password >> .env.local

# Run tests
.\tests\run-with-auth.bat
```

### Linux/macOS

```bash
# Add test credentials to .env.local
echo 'TEST_USER_EMAIL=your-email@example.com' >> .env.local
echo 'TEST_USER_PASSWORD=your-password' >> .env.local

# Run tests
chmod +x tests/run-with-auth.sh
./tests/run-with-auth.sh
```

### Using npm scripts

```bash
# Get authentication token
npm run test:get-token

# Run validation tests (requires AUTH_TOKEN environment variable)
npm run test:validation

# Run against production
npm run test:validation:prod
```

## What Gets Tested

The validation suite tests for the data inconsistency issue described in the [Data Inconsistency Analysis](./docs/data-inconsistency-analysis.md).

### Test Coverage

1. **API Availability** - Ensures the API is accessible
2. **Data Consistency** ⭐ - Detects count/data mismatches
3. **Filter Consistency** - Validates status filters work correctly
4. **Pagination** - Ensures no duplicate records across pages
5. **Response Time** - Monitors API performance
6. **Metrics Consistency** - Validates statistics are mathematically sound

### Expected Results

When the system is working correctly, you should see:

```
====================================
Test Summary
====================================
Total Tests: 6
✅ Passed: 6
⚠️ Warnings: 0
❌ Failed: 0
====================================
```

## Manual Testing

If you prefer to run tests manually:

### Step 1: Get Authentication Token

```bash
node tests/get-auth-token.js
```

Copy the token from the output.

### Step 2: Set Environment Variable

**Windows (PowerShell):**

```powershell
$env:SUPABASE_AUTH_TOKEN="paste-token-here"
```

**Linux/macOS:**

```bash
export SUPABASE_AUTH_TOKEN="paste-token-here"
```

### Step 3: Run Tests

```bash
node tests/performance-validation.js
```

## Environment Setup

### Required .env.local Variables

```env
# Supabase Configuration (already required for the app)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Test User Credentials (add these for testing)
TEST_USER_EMAIL=test-user@example.com
TEST_USER_PASSWORD=secure-password
```

### Creating a Test User

1. Sign up a new user in your application
2. Assign appropriate roles/permissions
3. Add credentials to `.env.local`

**Security Note**: Use a dedicated test account, not your production admin account.

## Troubleshooting

### "Request timeout" Error

**Problem**: Application not responding

**Solutions**:

- Ensure `npm run dev` is running
- Check that port 3000 is not blocked
- Verify network connectivity

### "Insufficient permissions" Error

**Problem**: Authentication failed or token expired

**Solutions**:

```bash
# Regenerate token
node tests/get-auth-token.js

# Check credentials in .env.local
cat .env.local | grep TEST_USER

# Verify user has correct permissions
npm run auth:diagnose
```

### "Count/Data mismatch" Error

**Problem**: This is the critical bug the tests are designed to detect

**Solutions**:

1. Review the [Data Inconsistency Analysis](./docs/data-inconsistency-analysis.md)
2. Run database optimizations:

   ```bash
   # Apply performance indexes
   psql -f database/optimizations/add-performance-indexes.sql

   # Or via Supabase Studio:
   # Copy and paste the SQL from the file
   ```

3. Check the API implementation in `app/api/contracts/route.ts`
4. Verify metrics service is using same filters

### Slow Response Times

**Problem**: Response time > 2000ms

**Solutions**:

- Run performance indexes SQL
- Check Supabase dashboard for slow queries
- Review pagination settings
- Enable query optimization

## Testing Against Production

**⚠️ Important**: Only run tests against production with a test account, not real user data.

### Windows

```powershell
.\tests\run-with-auth.bat production
```

### Linux/macOS

```bash
./tests/run-with-auth.sh production
```

### Manually

```bash
API_BASE_URL=https://portal.thesmartpro.io \
SUPABASE_AUTH_TOKEN="your-token" \
node tests/performance-validation.js
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Validation Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Get Auth Token
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
        run: |
          TOKEN=$(node tests/get-auth-token.js 2>/dev/null)
          echo "SUPABASE_AUTH_TOKEN=$TOKEN" >> $GITHUB_ENV

      - name: Run Validation Tests
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
        run: node tests/performance-validation.js
```

### Required Secrets

Add these to your GitHub repository secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`
- `API_BASE_URL` (optional, defaults to localhost)

## Test Development

### Adding New Tests

See [tests/README.md](./tests/README.md) for detailed instructions on creating new validation tests.

Example:

```javascript
async function testMyFeature() {
  console.log('\n🧪 Testing My Feature...');

  try {
    const result = await makeRequest(`${BASE_URL}/api/my-endpoint`);

    if (result.data.success) {
      recordTest('My Feature', 'PASS', 'Feature works');
    } else {
      recordTest('My Feature', 'FAIL', 'Feature failed');
    }
  } catch (error) {
    recordTest('My Feature', 'FAIL', error.message);
  }
}

// Add to runAllTests()
async function runAllTests() {
  // ... existing tests
  await testMyFeature();
}
```

## Related Documentation

- **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** - Pre-deployment checklist
- **[Data Inconsistency Analysis](./docs/data-inconsistency-analysis.md)** - Technical deep-dive
- **[tests/README.md](./tests/README.md)** - Detailed test documentation

## Support

If tests fail and you need help:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review recent changes to `app/api/contracts/route.ts`
3. Verify database migrations are applied
4. Check Supabase logs for errors
5. Consult the team or create an issue

## Best Practices

✅ **Do:**

- Run tests before deploying
- Use dedicated test accounts
- Monitor test results in CI/CD
- Add new tests for new features
- Keep authentication tokens secure

❌ **Don't:**

- Use production admin accounts for testing
- Commit `.env.local` to git
- Share authentication tokens
- Skip tests before deployment
- Ignore test failures

---

**Last Updated**: October 28, 2025  
**Version**: 1.0.0
