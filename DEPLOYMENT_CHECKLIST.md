# Deployment Checklist & Monitoring Guide

## Pre-Deployment Validation

### 1. Local Testing (15 minutes)

```bash
# Start development server
npm run dev

# Test authentication flow
# 1. Go to http://localhost:3000/en/auth/login
# 2. Log in with test credentials
# 3. Navigate to dashboard
# 4. Check browser console for correlation IDs
# 5. Check terminal logs for retry patterns
```

**Expected Logs**:
```
[cms-1234567890-abc] Middleware: Session check succeeded
[cms-1234567890-abc] API /user/companies: Auth succeeded
```

**With Retry** (simulated network issue):
```
[cms-1234567890-abc] Auth retry 1: Connection timeout
[cms-1234567890-abc] Auth succeeded on attempt 2
```

---

### 2. Build Verification (5 minutes)

```bash
# Build production bundle
npm run build

# Check for TypeScript errors
npm run typecheck

# Check bundle size
npx next info
```

**Verify**:
- ✅ No TypeScript errors
- ✅ No build warnings about retry/correlation modules
- ✅ Bundle size is reasonable (should add ~2KB)

---

### 3. Environment Variables Check (5 minutes)

Verify in Vercel/production environment:

```bash
# Required (already set)
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY

# Optional (for enhanced retry)
RETRY_MAX_ATTEMPTS=3          # Default: 3
RETRY_INITIAL_DELAY_MS=100    # Default: 100
RETRY_MAX_DELAY_MS=1000       # Default: 1000
```

---

## Deployment Steps

### Option A: Vercel (Recommended)

```bash
# 1. Commit changes
git add .
git commit -m "feat: Add retry logic and correlation IDs for auth resilience"
git push origin main

# 2. Vercel will auto-deploy
# Monitor: https://vercel.com/your-team/contract-management-system/deployments

# 3. Wait for deployment to complete (~2-3 minutes)
```

### Option B: Manual Deployment

```bash
# 1. Build
npm run build

# 2. Test production build locally
npm start

# 3. Deploy to your hosting provider
# (Follow your specific deployment process)
```

---

## Post-Deployment Validation

### 1. Smoke Tests (10 minutes)

**Test 1: Login Flow**
```bash
# 1. Go to https://portal.thesmartpro.io/en/auth/login
# 2. Open Browser DevTools → Network tab
# 3. Log in
# 4. Check for X-Correlation-ID in response headers
```

**Expected**:
```
Response Headers:
  X-Correlation-ID: cms-1705847321000-xyz123
  Set-Cookie: sb-reootcngcptfogfozlmz-auth-token=...
```

---

**Test 2: Protected Route Access**
```bash
# 1. Navigate to https://portal.thesmartpro.io/en/dashboard
# 2. Check Network tab
# 3. Look for correlation IDs in requests
```

**Expected**:
```
Request Headers:
  X-Correlation-ID: cms-1705847321000-xyz123

Response:
  Status: 200 OK
  X-Correlation-ID: cms-1705847321000-xyz123
```

---

**Test 3: API Endpoint**
```bash
# Using curl
curl -X GET https://portal.thesmartpro.io/api/user/companies \
  -H "Cookie: sb-reootcngcptfogfozlmz-auth-token=YOUR_TOKEN" \
  -v

# Check for X-Correlation-ID in response headers
```

---

### 2. Error Scenarios (5 minutes)

**Test Session Expiry**:
```bash
# 1. Log in
# 2. Wait for session to expire (or manually delete cookie)
# 3. Try to access dashboard
# 4. Should redirect to login with returnUrl
```

**Expected**:
```
Redirect to: /en/auth/login?returnUrl=/en/dashboard
```

---

**Test Network Failure Simulation**:
```javascript
// In browser console (to simulate slow network)
// Chrome DevTools → Network → Throttling → Slow 3G

// Then try:
await fetch('/api/user/companies')

// Check console for retry logs
```

---

### 3. Log Verification (10 minutes)

**Check Vercel Logs**:
```bash
# View recent logs
vercel logs production --follow

# Filter for correlation IDs
vercel logs production | grep "cms-"

# Filter for retries
vercel logs production | grep "retry"
```

**Expected Patterns**:
```
[cms-1705847321-abc] Middleware: Session check succeeded
[cms-1705847322-def] API /user/companies: Auth succeeded
[cms-1705847323-ghi] Auth retry 1: Token expired
[cms-1705847323-ghi] Auth succeeded on attempt 2
```

---

## Monitoring Setup

### 1. Error Tracking

Add to your monitoring service (Sentry/DataDog/etc):

```typescript
// lib/monitoring/sentry.ts (if using Sentry)
import * as Sentry from "@sentry/nextjs";

export function captureAuthError(
  correlationId: string,
  error: Error,
  context?: Record<string, any>
) {
  Sentry.captureException(error, {
    tags: {
      correlationId,
      type: "auth_error",
    },
    extra: context,
  });
}

export function captureRetryEvent(
  correlationId: string,
  attempt: number,
  error: Error
) {
  // Track retry patterns
  Sentry.captureMessage(
    `Auth retry ${attempt}: ${error.message}`,
    {
      level: "warning",
      tags: {
        correlationId,
        attempt,
        type: "auth_retry",
      },
    }
  );
}
```

---

### 2. Performance Metrics

Track auth performance:

```typescript
// lib/monitoring/metrics.ts
export function trackAuthDuration(
  correlationId: string,
  operation: string,
  duration: number
) {
  // Send to your analytics service
  console.log(JSON.stringify({
    type: "metric",
    correlationId,
    operation,
    duration,
    timestamp: Date.now(),
  }));
}

// Usage in middleware
const start = Date.now();
const result = await retrySupabaseAuth(...);
trackAuthDuration(correlationId, "session_check", Date.now() - start);
```

---

### 3. Alert Rules

Set up alerts for:

**High Retry Rate** (indicates network issues):
```
Query: Count of "Auth retry" logs > 100 in 5 minutes
Action: Alert team
```

**Auth Failures** (after all retries):
```
Query: Count of "Auth failed" logs > 50 in 5 minutes
Action: Page on-call
```

**Session Refresh Failures**:
```
Query: Count of "Session refresh failed" > 20 in 5 minutes
Action: Alert team
```

---

## Debugging Guide

### Common Issues & Solutions

#### Issue 1: Still seeing 401 errors
**Diagnosis**:
```bash
# Check correlation ID in error response
curl -v https://portal.thesmartpro.io/api/user/companies

# Find correlation ID in logs
vercel logs production | grep "cms-CORRELATION_ID"
```

**Common Causes**:
- Session expired (expected behavior)
- Cookie not being sent (check SameSite/Secure flags)
- Database RLS blocking query

**Solution**:
```typescript
// Check RLS policies in Supabase
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON companies
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

#### Issue 2: Retries exhausted
**Diagnosis**:
```bash
# Look for "retry" patterns in logs
vercel logs production | grep "retry"

# Check for correlation ID
vercel logs production | grep "cms-CORRELATION_ID"
```

**Common Causes**:
- Supabase service temporarily down
- Network partition
- Rate limiting

**Solution**:
- Increase retry attempts (set `RETRY_MAX_ATTEMPTS=5`)
- Check Supabase status: https://status.supabase.com
- Verify network connectivity

---

#### Issue 3: Correlation IDs not appearing
**Diagnosis**:
```javascript
// In browser console
fetch('/api/user/companies').then(r => {
  console.log('Correlation ID:', r.headers.get('X-Correlation-ID'));
});
```

**Solution**:
```typescript
// Ensure middleware is running
// Check middleware.ts config.matcher
export const config = {
  matcher: [
    "/en/dashboard/:path*",
    "/api/:path*",
  ],
};
```

---

## Performance Benchmarks

### Expected Performance

**Without Retries** (baseline):
- Auth check: 50-100ms
- API call: 100-200ms
- Total: 150-300ms

**With Retries** (no failures):
- Auth check: 50-100ms (same)
- API call: 100-200ms (same)
- Total: 150-300ms (same)

**With Retries** (1 failure):
- Retry delay: 100ms
- Second attempt: 50-100ms
- Total: 250-400ms

**With Retries** (2 failures):
- First retry: 100ms delay + 50-100ms
- Second retry: 200ms delay + 50-100ms
- Total: 500-700ms

---

## Success Metrics

### Week 1 Goals
- ✅ 401 errors reduced by 80%+
- ✅ Correlation IDs in all logs
- ✅ Retry patterns visible in logs
- ✅ No increase in P95 latency

### Week 2 Goals
- ✅ 401 errors reduced by 95%+
- ✅ Alert rules configured
- ✅ Monitoring dashboard created
- ✅ User reports of auth issues decreased

---

## Rollback Plan

If issues arise:

### Quick Rollback (2 minutes)
```bash
# Vercel: Instant rollback to previous deployment
# Go to: https://vercel.com/your-team/contract-management-system/deployments
# Click: "Promote to Production" on previous deployment
```

### Git Rollback (5 minutes)
```bash
# Revert the commit
git revert HEAD
git push origin main

# Vercel will auto-deploy the reverted version
```

### Files to Revert
If partial rollback needed:
1. `lib/auth/retry.ts` (can remove - safe)
2. `lib/utils/correlation.ts` (can remove - safe)
3. `middleware.ts` (revert to previous version)
4. `app/api/user/companies/route.ts` (revert to previous version)

---

## Maintenance

### Weekly Tasks
- [ ] Review correlation ID patterns in logs
- [ ] Check retry rate trends
- [ ] Monitor auth failure rates
- [ ] Review alert frequency

### Monthly Tasks
- [ ] Analyze retry patterns by time of day
- [ ] Optimize retry delays if needed
- [ ] Review and update alert thresholds
- [ ] Test rollback procedure

---

## Quick Reference

### Log Search Patterns

```bash
# All auth operations
vercel logs production | grep "cms-"

# Retries only
vercel logs production | grep "retry"

# Failures only
vercel logs production | grep "failed"

# Specific correlation ID
vercel logs production | grep "cms-1705847321000-xyz123"

# Last 100 auth events
vercel logs production --limit 100 | grep "Auth"
```

### Response Header Check

```bash
# Check correlation ID in response
curl -I https://portal.thesmartpro.io/api/user/companies \
  -H "Cookie: $(echo document.cookie | pbcopy)" \
  | grep "X-Correlation-ID"
```

### Browser Console Commands

```javascript
// Get current correlation ID
fetch('/api/user/companies')
  .then(r => console.log('Correlation ID:', r.headers.get('X-Correlation-ID')));

// Test retry behavior (with DevTools throttling)
// 1. Chrome DevTools → Network → Throttling → Offline
// 2. Run: fetch('/api/user/companies')
// 3. Set to: No throttling
// 4. Check console for retry logs
```

---

## Summary

### Implementation Complete ✅
- ✅ Retry logic with exponential backoff
- ✅ Correlation ID tracking
- ✅ Enhanced error messages
- ✅ Session refresh component
- ✅ Structured logging

### Deploy Now ✅
1. Commit and push changes
2. Wait for Vercel deployment
3. Run smoke tests
4. Monitor logs for 24 hours

### Success Indicators
- Correlation IDs appear in logs
- Retry patterns visible (when needed)
- 401 errors significantly reduced
- Better error messages for debugging

**Your authentication is now production-ready with resilience patterns from the MCP server!** 🚀
