# 🔐 Session & Authentication Security Checklist

**Application:** Contract Management System  
**Portal:** https://portal.thesmartpro.io  
**Priority:** High

---

## 📋 Overview

This checklist ensures your authentication and session management follows security best practices. Complete each item to secure user sessions against common attacks.

---

## 🍪 Cookie Security Configuration

### Supabase Cookie Settings

#### Current Configuration Check
Verify your Supabase client configuration includes secure cookie settings:

```typescript
// Location: lib/supabase/client.ts or similar

import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Cookie configuration
      storage: {
        getItem: (key) => {
          // Custom cookie implementation
        },
        setItem: (key, value) => {
          // Ensure cookies are set with secure flags
        },
        removeItem: (key) => {
          // Proper cleanup
        }
      },
      // Flow type
      flowType: 'pkce', // ✅ Use PKCE for better security
      
      // Auto refresh settings
      autoRefreshToken: true,
      
      // Persist session
      persistSession: true,
      
      // Detect session in URL (useful for email confirmations)
      detectSessionInUrl: true
    },
    // Cookie options for SSR
    cookieOptions: {
      name: 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 1 week
      domain: '.thesmartpro.io', // Set your domain
      path: '/',
      sameSite: 'lax', // or 'strict' for maximum security
    }
  }
)
```

### Required Cookie Attributes

Ensure all authentication cookies have these attributes:

- [ ] **`Secure`** - Cookie only sent over HTTPS
  ```javascript
  Set-Cookie: sb-auth-token=...; Secure
  ```

- [ ] **`HttpOnly`** - Cookie not accessible via JavaScript
  ```javascript
  Set-Cookie: sb-auth-token=...; HttpOnly
  ```

- [ ] **`SameSite=Strict` or `SameSite=Lax`** - CSRF protection
  ```javascript
  Set-Cookie: sb-auth-token=...; SameSite=Lax
  ```
  - Use `Strict` if all navigation is same-origin
  - Use `Lax` if you have email links that authenticate users

- [ ] **`Max-Age` or `Expires`** - Session timeout
  ```javascript
  Set-Cookie: sb-auth-token=...; Max-Age=3600
  ```
  - Recommended: 1-24 hours for session tokens
  - Recommended: 7-30 days for refresh tokens

- [ ] **`Domain`** - Properly scoped to your domain
  ```javascript
  Set-Cookie: sb-auth-token=...; Domain=.thesmartpro.io
  ```

- [ ] **`Path=/`** - Cookie available for entire site
  ```javascript
  Set-Cookie: sb-auth-token=...; Path=/
  ```

### Example: Ideal Cookie Header
```
Set-Cookie: sb-access-token=eyJhbGc...; Path=/; Domain=.thesmartpro.io; Secure; HttpOnly; SameSite=Lax; Max-Age=3600
Set-Cookie: sb-refresh-token=eyJhbGc...; Path=/; Domain=.thesmartpro.io; Secure; HttpOnly; SameSite=Strict; Max-Age=604800
```

---

## 🔑 Session Management

### Session Lifecycle

- [ ] **Session Creation**
  - Generate cryptographically random session IDs
  - Associate session with user account
  - Set appropriate timeout
  - Log session creation (IP, user agent, timestamp)

- [ ] **Session Validation**
  - Validate on every request
  - Check expiration time
  - Verify user still has access
  - Detect concurrent sessions (optional)

- [ ] **Session Refresh**
  - Implement automatic token refresh
  - Use refresh tokens instead of long-lived access tokens
  - Rotate refresh tokens on use (optional for extra security)

- [ ] **Session Termination**
  - Explicit logout functionality
  - Clear all session data (server & client)
  - Invalidate refresh tokens
  - Redirect to login page

### Session Timeout Configuration

```typescript
// Recommended timeout values
const SESSION_CONFIG = {
  // Access token lifetime (short)
  accessTokenLifetime: 60 * 60, // 1 hour
  
  // Refresh token lifetime (longer)
  refreshTokenLifetime: 60 * 60 * 24 * 7, // 7 days
  
  // Absolute session timeout (maximum session duration)
  absoluteTimeout: 60 * 60 * 24 * 30, // 30 days
  
  // Idle timeout (inactivity timeout)
  idleTimeout: 60 * 30, // 30 minutes
  
  // Remember me duration (if implemented)
  rememberMeDuration: 60 * 60 * 24 * 30, // 30 days
};
```

---

## 🔐 Multi-Factor Authentication (MFA)

### Implementation Checklist

- [ ] **Enable MFA for Admin Accounts**
  - All users with admin role must enable MFA
  - Enforce at login time
  - Allow recovery codes

- [ ] **MFA Methods**
  - [ ] TOTP (Time-based One-Time Password) - Recommended
  - [ ] SMS (less secure, but better than nothing)
  - [ ] Email codes (fallback option)
  - [ ] Backup codes (for account recovery)

- [ ] **MFA Enforcement**
  ```typescript
  // Example: Require MFA for sensitive actions
  async function requireMFA(userId: string, action: string) {
    const user = await getUser(userId);
    
    // Check if user has MFA enabled
    if (user.mfa_enabled) {
      // Require MFA verification
      const mfaVerified = await verifyMFA(userId);
      if (!mfaVerified) {
        throw new Error('MFA verification required');
      }
    } else if (user.role === 'admin' || isSensitiveAction(action)) {
      // Force MFA setup for admin or sensitive actions
      throw new Error('MFA setup required');
    }
  }
  ```

### Supabase MFA Configuration

```typescript
// Enable MFA in Supabase
import { supabase } from '@/lib/supabase/client';

// Enroll user in MFA
async function enrollMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'My Authenticator App'
  });
  
  if (data) {
    // Show QR code to user
    const { qr_code, secret, totp_uri } = data;
    // Display qr_code or totp_uri
  }
}

// Verify MFA during login
async function verifyMFA(code: string) {
  const factors = await supabase.auth.mfa.listFactors();
  const totpFactor = factors.data?.totp[0];
  
  if (totpFactor) {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      code: code
    });
    
    return !error;
  }
  
  return false;
}
```

---

## 🚫 Rate Limiting

### Current Implementation
Location: `middleware.ts`

```typescript
const RATE_LIMIT_CONFIG = {
  '/api/auth/check-session': {
    windowMs: 60000,
    maxRequests: 5,
  },
};
```

### Recommended Rate Limits

```typescript
const ENHANCED_RATE_LIMIT_CONFIG = {
  // Authentication endpoints
  '/api/auth/signin': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    blockDuration: 60 * 60 * 1000, // Block for 1 hour after limit
  },
  
  '/api/auth/signup': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 signups per hour per IP
  },
  
  '/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset requests per hour
  },
  
  '/api/auth/verify-email': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 verification attempts per hour
  },
  
  // Sensitive operations
  '/api/contracts': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  
  '/api/promoters': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  
  // Global API rate limit
  '/api/*': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute per IP
  },
};
```

### Implementation with Upstash Redis

Your project already includes `@upstash/ratelimit`. Implement it:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create rate limiter
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// Usage in API routes
export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(
    identifier
  );
  
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  
  return { limit, reset, remaining };
}
```

---

## 🔍 Login Attempt Monitoring

### Implement Login Audit Log

```typescript
// lib/audit-log.ts
interface LoginAttempt {
  user_id?: string;
  email: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  failure_reason?: string;
  timestamp: Date;
  location?: string; // Optional: IP geolocation
}

export async function logLoginAttempt(attempt: LoginAttempt) {
  // Log to database
  const { data, error } = await supabase
    .from('login_attempts')
    .insert({
      user_id: attempt.user_id,
      email: attempt.email,
      ip_address: attempt.ip_address,
      user_agent: attempt.user_agent,
      success: attempt.success,
      failure_reason: attempt.failure_reason,
      timestamp: attempt.timestamp,
      location: attempt.location,
    });
    
  // Optional: Alert on suspicious activity
  if (!attempt.success) {
    await checkForBruteForce(attempt.email, attempt.ip_address);
  }
}

async function checkForBruteForce(email: string, ip: string) {
  // Check last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const { data: recentFailures } = await supabase
    .from('login_attempts')
    .select('*')
    .eq('email', email)
    .eq('success', false)
    .gte('timestamp', tenMinutesAgo.toISOString());
    
  if (recentFailures && recentFailures.length >= 5) {
    // Alert security team
    await sendSecurityAlert({
      type: 'brute_force_detected',
      email,
      ip,
      attempts: recentFailures.length,
    });
    
    // Consider account lockout
    await lockAccount(email, '15 minutes');
  }
}
```

### Create Database Table

```sql
-- Migration: create_login_attempts_table.sql
CREATE TABLE login_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  location TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_login_attempts_email ON login_attempts(email),
  INDEX idx_login_attempts_ip ON login_attempts(ip_address),
  INDEX idx_login_attempts_timestamp ON login_attempts(timestamp),
  INDEX idx_login_attempts_success ON login_attempts(success)
);

-- RLS policies
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view all login attempts"
  ON login_attempts
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- System can insert login attempts
CREATE POLICY "System can insert login attempts"
  ON login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

## 📊 Security Dashboard

### Metrics to Monitor

- [ ] **Failed login attempts** (last 24 hours)
- [ ] **Unique IPs with failed logins** (detect distributed attacks)
- [ ] **Account lockouts** (how many users are locked out)
- [ ] **MFA adoption rate** (percentage of users with MFA enabled)
- [ ] **Session duration** (average and maximum)
- [ ] **Concurrent sessions per user** (detect account sharing)
- [ ] **Password reset requests** (detect account takeover attempts)

### Example Dashboard Query

```typescript
// Get security metrics
async function getSecurityMetrics() {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Failed login attempts
  const { count: failedLogins } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('success', false)
    .gte('timestamp', last24Hours.toISOString());
    
  // MFA adoption
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
    
  const { count: mfaUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('mfa_enabled', true);
    
  return {
    failedLogins,
    mfaAdoptionRate: totalUsers > 0 ? (mfaUsers / totalUsers) * 100 : 0,
    totalUsers,
    mfaUsers,
  };
}
```

---

## ✅ Quick Verification Checklist

### Run These Tests

```bash
# 1. Check cookie security
# Login to your app and check cookies in DevTools
# - Should have Secure, HttpOnly, SameSite flags

# 2. Test rate limiting
curl -X POST https://portal.thesmartpro.io/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  # Repeat 6 times - should get rate limited

# 3. Test session expiry
# Login, wait for session timeout, try to access protected page
# Should redirect to login

# 4. Test CSRF protection
curl -X POST https://portal.thesmartpro.io/api/contracts \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  # Should return 403 Forbidden

# 5. Test MFA (if implemented)
# Login with admin account
# Should require MFA code
```

---

## 🚀 Implementation Priority

### High Priority (Do Now)
1. ✅ Verify Supabase cookie configuration (Secure, HttpOnly, SameSite)
2. ⬜ Enable MFA for all admin accounts
3. ⬜ Implement login attempt logging
4. ⬜ Set up rate limiting for auth endpoints
5. ⬜ Configure session timeouts

### Medium Priority (This Week)
6. ⬜ Create security monitoring dashboard
7. ⬜ Implement brute force detection
8. ⬜ Set up security alerts
9. ⬜ Document incident response procedures
10. ⬜ Test all security measures

### Low Priority (This Month)
11. ⬜ Implement IP geolocation for login attempts
12. ⬜ Add device fingerprinting
13. ⬜ Implement suspicious activity alerts
14. ⬜ Create security awareness training for users

---

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase MFA Guide](https://supabase.com/docs/guides/auth/auth-mfa)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Last Updated:** October 24, 2025  
**Next Review:** November 24, 2025

