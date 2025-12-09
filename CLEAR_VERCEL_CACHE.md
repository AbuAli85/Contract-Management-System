# 🔄 Clear Vercel Cache - Fix CORS & Cache-Control Headers

**Issue:** SecurityHeaders.com scan shows:

- `access-control-allow-origin: *` (should be restricted)
- `cache-control: public, max-age=0, must-revalidate` (should be private, no-store)
- `x-vercel-cache: HIT` (serving cached content)

**Cause:** Vercel is serving cached response with old headers

**Solution:** Clear Vercel cache and force fresh deployment

---

## 🚀 Method 1: Force Redeploy (Recommended)

```bash
# 1. Make a tiny change to force rebuild
echo "# Cache cleared $(date)" >> .vercel-cache-clear

# 2. Commit and push
git add .vercel-cache-clear
git commit -m "chore: force Vercel cache clear"
git push origin main

# 3. Wait 2-3 minutes for deployment

# 4. Verify
.\scripts\verify-security-headers.ps1
```

---

## 🔧 Method 2: Vercel CLI Cache Purge

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login
vercel login

# Purge cache for production
vercel --prod --force

# Or specific deployment
vercel ls  # Get deployment URL
vercel remove [deployment-url] --yes
vercel --prod
```

---

## 🌐 Method 3: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project: `contract-management-system`
3. Click "Deployments"
4. Find latest deployment
5. Click "..." menu
6. Select "Redeploy"
7. Check "Use existing Build Cache" = **OFF**
8. Click "Redeploy"

---

## 🧪 Method 4: Query String Cache Bust (Quick Test)

```bash
# Test with cache-busting query parameter
curl -I "https://portal.thesmartpro.io/en/dashboard?v=$(date +%s)"

# Should show fresh headers
# Look for: x-vercel-cache: MISS
```

---

## ✅ Verification After Cache Clear

### 1. Check for Fresh Response

```bash
curl -I https://portal.thesmartpro.io/en/dashboard | grep x-vercel-cache
# Should show: x-vercel-cache: MISS (first request)
# Then: x-vercel-cache: HIT (but with NEW headers)
```

### 2. Verify CORS Header

```bash
curl -I https://portal.thesmartpro.io/en/dashboard | grep -i access-control
# Should show: access-control-allow-origin: https://portal.thesmartpro.io
# Or might not show at all (which is correct for non-API routes)
```

### 3. Verify Cache-Control

```bash
curl -I https://portal.thesmartpro.io/en/dashboard | grep -i cache-control
# Should show: cache-control: private, no-store, no-cache, must-revalidate, max-age=0
```

### 4. Run Full Security Scan

```powershell
.\scripts\verify-security-headers.ps1
```

### 5. Check SecurityHeaders.com

Visit: https://securityheaders.com/?q=https://portal.thesmartpro.io/en/dashboard&hide=on&followRedirects=on

**Expected:**

- No CORS warning (or restricted origin shown)
- Cache-Control should show "private, no-store"
- Grade: Still A (due to CSP 'unsafe-inline')

---

## 🔍 Why Headers Weren't Updated

### Vercel Caching Behavior

1. **Edge Cache:** Vercel caches responses at edge locations
2. **Header Propagation:** New headers need cache invalidation
3. **Build Cache:** Build output is cached between deployments

### The Scan Showed

```
x-vercel-cache: HIT
age: 146
```

This means:

- Response was served from cache
- Content was cached 146 seconds ago
- Headers from the cached response (old headers)

---

## 📋 Expected Timeline

| Action            | Time         | Result                            |
| ----------------- | ------------ | --------------------------------- |
| Force redeploy    | 2-3 min      | New build with new headers        |
| Cache propagation | 5-10 min     | New headers at all edge locations |
| Full propagation  | Up to 1 hour | All cached responses updated      |

---

## 🎯 What Should Change

### Current (Cached)

```http
access-control-allow-origin: *
cache-control: public, max-age=0, must-revalidate
x-vercel-cache: HIT
```

### After Cache Clear

```http
cache-control: private, no-store, no-cache, must-revalidate, max-age=0
x-vercel-cache: MISS (first request)
# access-control-allow-origin should not appear for page routes (only API routes)
```

**Note:** CORS headers (`access-control-allow-origin`) should **only** appear on API routes, not on page routes like `/en/dashboard`.

---

## 🚨 If CORS Still Shows After Cache Clear

The `access-control-allow-origin: *` might be coming from:

1. **Vercel automatic headers** - Check vercel.json
2. **Next.js config** - Review next.config.js
3. **Middleware** - Check middleware.ts

### Quick Fix - Remove CORS from Page Routes

Update `next.config.js` to restrict CORS to API routes only:

```javascript
// Current - applies to all routes
{
  source: '/(.*)',
  headers: [ /* ... */ ],
}

// Should be - separate page routes from API routes
{
  source: '/:locale(en|ar|es|fr|de)/:path*',
  headers: [
    // Security headers WITHOUT CORS
    { key: 'Strict-Transport-Security', value: '...' },
    { key: 'Content-Security-Policy', value: '...' },
    // ... other headers, NO access-control-allow-origin
  ],
},
{
  source: '/api/:path*',
  headers: [
    // API routes WITH restricted CORS
    { key: 'Access-Control-Allow-Origin', value: 'https://portal.thesmartpro.io' },
    // ...
  ],
}
```

---

## ✅ Success Criteria

After cache clear, you should see:

- ✅ `x-vercel-cache: MISS` (first request after clear)
- ✅ `cache-control: private, no-store, no-cache...` (for dashboard)
- ✅ No `access-control-allow-origin` header on page routes
- ✅ `access-control-allow-origin: https://portal.thesmartpro.io` on API routes only
- ✅ SecurityHeaders.com: No CORS warning
- ✅ Grade: A (or A+ if you implement nonces)

---

**Next Step:** Force a redeploy to clear the cache!

```bash
git add .
git commit -m "chore: trigger cache clear"
git push origin main
```
