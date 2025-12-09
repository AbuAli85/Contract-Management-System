# CORS Security - Quick Start Guide

## 🚀 TL;DR - What You Need to Know

The API now **ONLY accepts requests from authorized domains**. Wildcard CORS (`*`) has been completely removed.

---

## ⚡ Quick Setup

### 1. Set Environment Variable

Add to your `.env.local` (development):

```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

Add to your `.env.production` (production):

```bash
ALLOWED_ORIGINS=https://portal.thesmartpro.io,https://www.thesmartpro.io
```

### 2. That's It!

The middleware automatically protects all API routes. No code changes needed for most cases.

---

## 🔧 For API Route Developers

### Option 1: Do Nothing (Recommended)

The middleware automatically handles CORS for all `/api/*` routes.

### Option 2: Use the Utility Wrapper

For better control:

```typescript
import { withCors } from '@/lib/security/cors';

export async function GET(request: NextRequest) {
  return withCors(request, async () => {
    return NextResponse.json({ message: 'Hello World' });
  });
}
```

---

## 🧪 Quick Test

### Test Authorized Origin (Should Work)

```bash
curl -H "Origin: https://portal.thesmartpro.io" \
     http://localhost:3000/api/test
```

### Test Unauthorized Origin (Should Fail)

```bash
curl -H "Origin: https://malicious.com" \
     http://localhost:3000/api/test
```

Expected: `403 Forbidden`

---

## 🐛 Common Issues

### "403 Forbidden" on Legitimate Requests

**Solution**: Add your domain to `ALLOWED_ORIGINS`

### CSRF Token Errors

**Solution**: For state-changing requests (POST/PUT/DELETE), include:

```typescript
headers: {
  'X-CSRF-Token': getCsrfToken() // From your session
}
```

### Development Not Working

**Solution**: Make sure `NODE_ENV=development` is set

---

## 📊 What Was Fixed

| Before                           | After                                                        |
| -------------------------------- | ------------------------------------------------------------ |
| `Access-Control-Allow-Origin: *` | `Access-Control-Allow-Origin: https://portal.thesmartpro.io` |
| ANY domain could access API      | ONLY authorized domains can access                           |
| No CSRF protection               | CSRF tokens validated                                        |
| Security vulnerability           | Secure & compliant                                           |

---

## 🔒 Security Features

✅ Origin whitelisting  
✅ CSRF protection  
✅ Environment-based configuration  
✅ Security logging  
✅ Preflight request handling  
✅ Automatic protection for all API routes

---

## 📚 More Information

See `CORS_SECURITY_IMPLEMENTATION.md` for complete documentation.

---

**Status**: ✅ READY FOR PRODUCTION  
**Security Level**: 🔒 HIGH  
**Last Updated**: October 22, 2025
