# Authentication System Documentation

## Overview

The Contract Management System uses **Supabase Auth** as its authentication backend, with a custom middleware layer for session management, rate limiting, CSRF protection, and role-based access control (RBAC).

---

## Architecture

```
Browser
  │
  ├─ Next.js Middleware (middleware.ts)
  │    ├─ CORS validation
  │    ├─ CSRF protection (fixed: now blocks missing tokens)
  │    ├─ Rate limiting (Upstash Redis)
  │    └─ Supabase session refresh
  │
  ├─ Auth API Routes (/app/api/auth/)
  │    ├─ /login          — Email/password sign-in with brute-force protection
  │    ├─ /logout         — Sign out + clear all cookies
  │    ├─ /register       — New user registration
  │    ├─ /callback       — OAuth callback handler
  │    ├─ /csrf           — CSRF token endpoint
  │    ├─ /check-session  — Session validation (returns 401 if unauthenticated)
  │    ├─ /refresh-session — Session refresh
  │    ├─ /mfa            — MFA management
  │    ├─ /change-password — Password change
  │    └─ /forgot-password — Password reset flow
  │
  ├─ Auth Components (/components/auth/)
  │    ├─ AuthProvider (auth-context.tsx)     — React context with real Supabase sync
  │    ├─ SecureAuthGuard                     — Route protection with role checks
  │    ├─ EnhancedLoginFormV3                 — Production login form
  │    ├─ EnhancedRegisterForm                — Registration form with strength meter
  │    └─ SessionTimeoutWarning               — Session expiry warning dialog
  │
  └─ Auth Libraries (/lib/auth/)
       ├─ brute-force-protection.ts  — Server-side login attempt tracking
       ├─ server-auth.ts             — Server-side auth helpers (getUser-based)
       ├─ mfa-service.ts             — TOTP MFA management
       └─ index.ts                   — Central exports
```

---

## Security Model

### Session Validation

**Always use `getUser()` on the server, never `getSession()` alone.**

| Method | Validates with Supabase server | Use case |
|--------|-------------------------------|----------|
| `getUser()` | Yes | Security-sensitive operations |
| `getSession()` | No (reads local cookie only) | Reading non-sensitive metadata |

```typescript
// CORRECT — server-side validation
const { data: { user } } = await supabase.auth.getUser();

// INSECURE — does not validate JWT with Supabase server
const { data: { session } } = await supabase.auth.getSession();
```

### CSRF Protection

The system uses the **double-submit cookie pattern**:

1. On page load, middleware sets a `csrf-token` cookie (non-httpOnly, so JS can read it)
2. Client reads the token from the cookie and includes it as `X-CSRF-Token` header
3. Middleware validates the header token against the cookie token on all state-changing requests
4. **Fixed bug**: Previously, requests with no CSRF token at all would pass through. Now, if a session cookie exists, a valid CSRF token is required.

```typescript
// Client-side usage
import { useCSRF } from '@/hooks/use-csrf';

const { csrfHeaders } = useCSRF();

await fetch('/api/some-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...csrfHeaders },
  body: JSON.stringify(data),
});
```

### Brute-Force Protection

Login attempts are tracked **server-side** in the `failed_login_attempts` database table.

| Threshold | Action |
|-----------|--------|
| 5 failed attempts | Account locked for 15 minutes |
| Successful login | Failed attempt counter cleared |
| 15 minutes elapsed | Attempt counter reset automatically |

This replaces the previous **client-side localStorage** approach, which could be bypassed by clearing browser storage.

### Rate Limiting

Two layers of rate limiting are applied:

1. **Middleware layer** — In-memory fallback (development) or Upstash Redis (production)
2. **Route handler layer** — Per-endpoint Upstash rate limiters

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 5 requests / minute |
| `/api/auth/register` | 3 requests / hour |
| `/api/auth/forgot-password` | 3 requests / hour |

---

## Components

### AuthProvider

Wraps the application and provides auth state via React context.

```tsx
// In your root layout
import { AuthProvider } from '@/components/auth';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### useAuthContext

Access auth state in any client component.

```tsx
import { useAuthContext } from '@/components/auth';

function MyComponent() {
  const { user, profile, isAuthenticated, isAdmin, signOut } = useAuthContext();

  if (!isAuthenticated) return <p>Not logged in</p>;
  return <p>Welcome, {profile?.full_name}</p>;
}
```

### SecureAuthGuard

Protect pages with authentication and role checks.

```tsx
import { SecureAuthGuard } from '@/components/auth';

// Require authentication
<SecureAuthGuard requireAuth>
  <ProtectedPage />
</SecureAuthGuard>

// Require specific role
<SecureAuthGuard requireAuth allowedRoles={['admin', 'super_admin']}>
  <AdminPage />
</SecureAuthGuard>
```

### useRequireAuth

Hook for protecting pages with redirect.

```tsx
import { useRequireAuth } from '@/components/auth';

function AdminPage() {
  const auth = useRequireAuth(['admin', 'super_admin']);
  // Automatically redirects to login if not authenticated
  // Automatically redirects to /unauthorized if wrong role
  
  return <div>Admin content</div>;
}
```

---

## Server-Side Auth

### requireServerAuth

For Server Components and Route Handlers:

```typescript
import { requireServerAuth } from '@/lib/auth/server-auth';

export default async function ProtectedPage() {
  const { user } = await requireServerAuth('en', '/dashboard');
  // Redirects to login if not authenticated
  
  return <div>Welcome {user.email}</div>;
}
```

### requireRole

For role-based server-side protection:

```typescript
import { requireRole } from '@/lib/auth/server-auth';

export default async function AdminPage() {
  const { user } = await requireRole(['admin'], 'en');
  // Redirects to /unauthorized if wrong role
  
  return <div>Admin only</div>;
}
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles with role and status |
| `user_mfa` | TOTP secrets and backup codes |
| `user_sessions` | Active session tracking |
| `failed_login_attempts` | Brute-force protection tracking |
| `security_audit_log` | Security event log |
| `auth_events` | Comprehensive auth audit trail |
| `password_reset_tokens` | Secure password reset tokens |
| `rate_limit_logs` | Rate limiting logs |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server only) |
| `UPSTASH_REDIS_REST_URL` | Recommended | Redis URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Redis token |
| `NEXT_PUBLIC_APP_URL` | Yes | Application base URL for CORS |

---

## Known Limitations

1. **Biometric authentication** — The `/api/auth/biometric` endpoint returns `enabled: false`. WebAuthn/FIDO2 integration is not yet implemented.
2. **Social login** — GitHub and Google OAuth are configured but require Supabase OAuth provider setup.
3. **MFA** — TOTP MFA is implemented but uses a custom `user_mfa` table rather than Supabase's built-in MFA (which would be more robust).

---

## Changelog

### 2026-02-26 — Auth System Enhancement

**Fixed:**
- `csrf-protection.ts` was completely empty — implemented full CSRF protection
- Middleware CSRF check had a logic bug — only blocked when both tokens existed AND differed; now correctly blocks when token is missing
- `logout/route.ts` called `createClient()` without `await` — fixed async call
- `check-session/route.ts` returned HTTP 200 for unauthenticated requests — now returns 401
- `refresh-session/route.ts` used `getSession()` instead of `getUser()` — fixed to use secure server-side validation
- Login form had hardcoded test credentials visible in UI — removed
- Client-side localStorage brute-force protection was bypassable — replaced with server-side DB tracking

**Added:**
- `GET /api/auth/csrf` — CSRF token endpoint
- `components/auth/auth-context.tsx` — Unified auth context with real Supabase session sync
- `components/auth/secure-auth-guard.tsx` — Route protection with role checks and returnTo URL
- `components/auth/enhanced-login-form-v3.tsx` — Production login form
- `components/auth/enhanced-register-form.tsx` — Registration form with password strength meter
- `components/auth/session-timeout-warning.tsx` — Session expiry warning dialog
- `lib/auth/brute-force-protection.ts` — Server-side brute-force tracking
- `lib/auth/server-auth.ts` — Secure server-side auth helpers
- `hooks/use-csrf.ts` — Client-side CSRF token hook
- `supabase/migrations/20260226000000_enhance_auth_security.sql` — DB migration for auth improvements
