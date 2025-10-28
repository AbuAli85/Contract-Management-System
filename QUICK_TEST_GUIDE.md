# Quick Test Guide - Fix for Authentication Error

## Problem
The validation tests failed because they need authentication:
```
❌ API Availability: API is not accessible
❌ Data Consistency: Insufficient permissions
```

## Solution: Run Tests with Authentication

### Option 1: Automated Script (Easiest) ⭐

**Windows:**
```powershell
# 1. Add test credentials to .env.local
echo TEST_USER_EMAIL=your-email@example.com >> .env.local
echo TEST_USER_PASSWORD=your-password >> .env.local

# 2. Run tests
.\tests\run-with-auth.bat
```

**Linux/macOS:**
```bash
# 1. Add test credentials to .env.local
echo 'TEST_USER_EMAIL=your-email@example.com' >> .env.local
echo 'TEST_USER_PASSWORD=your-password' >> .env.local

# 2. Run tests
chmod +x tests/run-with-auth.sh
./tests/run-with-auth.sh
```

### Option 2: Manual Steps

**Step 1: Add to .env.local**
```env
TEST_USER_EMAIL=your-test-account@example.com
TEST_USER_PASSWORD=your-secure-password
```

**Step 2: Get Token**
```bash
node tests/get-auth-token.js
```

**Step 3: Run Tests (Windows PowerShell)**
```powershell
$env:SUPABASE_AUTH_TOKEN="paste-token-from-step-2"
node tests/performance-validation.js
```

**Step 3: Run Tests (Linux/macOS)**
```bash
export SUPABASE_AUTH_TOKEN="paste-token-from-step-2"
node tests/performance-validation.js
```

### Option 3: NPM Scripts

```bash
# Get token manually
npm run test:get-token

# Then copy the token and:
SUPABASE_AUTH_TOKEN="your-token" npm run test:validation
```

## Creating a Test User

If you don't have a test account:

1. **Sign up** through your application
2. **Login** to ensure the account works
3. **Add credentials** to `.env.local`:
   ```env
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=YourPassword123
   ```

## Expected Output (Success)

```
====================================
Performance and Data Consistency Test
====================================

📡 Testing API Availability...
✅ API Availability: API is available and responding correctly

🔍 Testing Data Consistency...
✅ Data Consistency: Count and data are consistent (2 total, 2 returned)

🔍 Testing Filter Consistency...
✅ Filter Consistency: All status filters work correctly

📄 Testing Pagination...
✅ Pagination: Not enough data to test pagination

⏱️ Testing Response Time...
✅ Response Time: Response time is acceptable: 456ms

📊 Testing Metrics Consistency...
✅ Metrics Consistency: Metrics are consistent

====================================
Test Summary
====================================
Total Tests: 6
✅ Passed: 6
⚠️ Warnings: 0
❌ Failed: 0
====================================
```

## What These Tests Check

1. ✅ **API Availability** - Server is responding
2. ✅ **Data Consistency** - No count/data mismatches (the bug from your analysis)
3. ✅ **Filter Consistency** - Status filters work correctly
4. ✅ **Pagination** - No duplicate records
5. ✅ **Response Time** - Performance is good
6. ✅ **Metrics** - Statistics are mathematically valid

## Troubleshooting

### "Cannot find module @supabase/supabase-js"
```bash
npm install @supabase/supabase-js
```

### "Authentication failed"
- Check `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.local`
- Ensure the user exists and can log in via the web UI
- Try logging in manually first

### "Token expired"
Just run the script again - it gets a fresh token each time.

## Full Documentation

See [TESTING.md](./TESTING.md) for complete testing documentation.

---

**TL;DR**: Add test user credentials to `.env.local` and run `.\tests\run-with-auth.bat` (Windows) or `./tests/run-with-auth.sh` (Linux/macOS).
