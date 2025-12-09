# 🔐 CSP Nonce Implementation Guide (A+ Grade)

**Goal:** Remove 'unsafe-inline' and 'unsafe-eval' from CSP to achieve A+ grade

**Current Grade:** A  
**Target Grade:** A+  
**Difficulty:** Advanced  
**Time Required:** 2-4 hours

---

## 🎯 Why Implement Nonces?

### Current CSP Issue

```javascript
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live ...
```

**Problem:**

- `'unsafe-inline'` allows ANY inline script (XSS risk)
- `'unsafe-eval'` allows eval() (injection risk)
- Grade capped at **A** instead of **A+**

### With Nonces

```javascript
script-src 'self' 'nonce-{RANDOM}' https://vercel.live ...
```

**Benefit:**

- Only scripts with matching nonce attribute execute
- No 'unsafe-inline' or 'unsafe-eval' needed
- Achieves **A+ grade**

---

## 📋 Implementation Steps

### Step 1: Generate Nonce in Middleware

Create or update `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  // Generate unique nonce for this request
  const nonce = crypto.randomBytes(16).toString('base64');

  // Clone response headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Get response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Build CSP with nonce
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://vercel.live https://*.google-analytics.com https://*.googletagmanager.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "img-src 'self' data: blob: https://*.supabase.co https://*.google-analytics.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.sentry.io wss://*.supabase.co",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    'upgrade-insecure-requests',
    "form-action 'self'",
    "media-src 'self' https://*.supabase.co",
    "manifest-src 'self'",
  ].join('; ');

  // Set CSP header with nonce
  response.headers.set('Content-Security-Policy', csp);

  // Store nonce for use in components
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Step 2: Create Nonce Context

Create `lib/nonce-context.tsx`:

```typescript
'use client';

import { createContext, useContext } from 'react';

const NonceContext = createContext<string | undefined>(undefined);

export function NonceProvider({
  nonce,
  children
}: {
  nonce: string;
  children: React.ReactNode
}) {
  return (
    <NonceContext.Provider value={nonce}>
      {children}
    </NonceContext.Provider>
  );
}

export function useNonce() {
  const nonce = useContext(NonceContext);
  if (nonce === undefined) {
    throw new Error('useNonce must be used within NonceProvider');
  }
  return nonce;
}
```

### Step 3: Update Root Layout

Update `app/layout.tsx`:

```typescript
import { headers } from 'next/headers';
import { NonceProvider } from '@/lib/nonce-context';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get nonce from headers
  const headersList = headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* External resources with nonce */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          nonce={nonce}
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
          nonce={nonce}
        />
      </head>
      <body>
        <NonceProvider nonce={nonce}>
          {children}
        </NonceProvider>
      </body>
    </html>
  );
}
```

### Step 4: Update All Inline Scripts

For any inline scripts in your codebase, add the nonce attribute:

```typescript
import { useNonce } from '@/lib/nonce-context';

export function MyComponent() {
  const nonce = useNonce();

  return (
    <>
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            console.log('This script has a nonce');
          `,
        }}
      />
    </>
  );
}
```

### Step 5: Handle Next.js Scripts

For Next.js `<Script>` components:

```typescript
import Script from 'next/script';
import { useNonce } from '@/lib/nonce-context';

export function MyComponent() {
  const nonce = useNonce();

  return (
    <Script
      src="https://example.com/script.js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
```

### Step 6: Remove 'unsafe-eval' (Tricky)

Next.js heavily relies on `eval()` for:

- React Fast Refresh (development)
- Code splitting
- Dynamic imports

**Options:**

1. **Keep 'unsafe-eval' in development only:**

```typescript
const csp = [
  `script-src 'self' 'nonce-${nonce}' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''} https://vercel.live`,
  // ...
].join('; ');
```

2. **Completely remove (may break features):**

- Test extensively
- May need webpack configuration changes
- Some Next.js features might not work

---

## 🧪 Testing

### 1. Check Console for CSP Violations

```
Refused to execute inline script because it violates the following
Content Security Policy directive: "script-src 'self' 'nonce-...'".
```

**Fix:** Add `nonce` attribute to the violating script

### 2. Test All Pages

- Login page
- Dashboard
- Contracts
- Promoters
- Forms with client-side validation

### 3. Check Third-Party Scripts

- Google Analytics
- Sentry error tracking
- Any other external scripts

### 4. Verify Nonce Uniqueness

```bash
# Each request should have a different nonce
curl -I https://portal.thesmartpro.io/en/dashboard | grep -i content-security-policy
curl -I https://portal.thesmartpro.io/en/dashboard | grep -i content-security-policy
# The nonce values should be different
```

---

## 📊 Expected Results

### Before (Grade A)

```
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live ...
Warning: This policy contains 'unsafe-inline' which is dangerous
Warning: This policy contains 'unsafe-eval' which is dangerous
Grade: A
```

### After (Grade A+)

```
script-src 'self' 'nonce-abc123...' https://vercel.live ...
No warnings
Grade: A+
```

---

## ⚠️ Potential Issues

### 1. Next.js Framework Scripts

**Problem:** Next.js injects inline scripts for hydration  
**Solution:** May need to patch Next.js or accept 'unsafe-inline' for framework scripts

### 2. Third-Party Libraries

**Problem:** Some libraries use `eval()` or inline scripts  
**Solution:** Find alternatives or whitelist specific scripts

### 3. Development vs. Production

**Problem:** Different CSP needed for development (Fast Refresh)  
**Solution:** Environment-based CSP configuration

### 4. Server Components

**Problem:** Nonce must be available server-side  
**Solution:** Use `headers()` in server components

---

## 🎯 Recommendation

### For Most Applications: Keep Grade A ✅

- Grade A is excellent
- 'unsafe-inline' and 'unsafe-eval' are needed for Next.js functionality
- Focus on other security measures (authentication, rate limiting, etc.)

### For Maximum Security: Implement Nonces (A+)

- High-security applications (finance, healthcare, government)
- Willing to invest 2-4 hours of implementation time
- Can handle potential compatibility issues
- Want maximum XSS protection

---

## 📚 Resources

- [MDN: CSP Nonces](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script)
- [Next.js CSP Documentation](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

**Bottom Line:** Grade A is excellent for a Next.js application. Grade A+ requires significant effort and may impact functionality. Choose based on your security requirements.
