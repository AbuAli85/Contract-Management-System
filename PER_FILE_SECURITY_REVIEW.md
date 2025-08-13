# 📋 PER-FILE SECURITY REVIEW

## Critical Files Analysis

### `middleware.ts`
- **Purpose:** Route protection, security headers, RBAC enforcement
- **Security-relevant code:**
  ```typescript
  Line 18: const role = request.cookies.get('active_role')?.value;
  Line 25-41: Role-based route protection logic
  Line 64-69: Conditional security headers
  Line 78-82: Dynamic CORS configuration
  ```
- **Findings:**
  - **[P0]** Cookie-based role storage allows complete bypass via `document.cookie = "active_role=admin"`
  - **[P2]** Security headers only applied when `SECURITY_HEADERS_ENABLED=true`
  - **[P2]** CORS origins from env without validation
  - **[P3]** No rate limiting at middleware level
- **Evidence:** Manual cookie manipulation grants admin access to all routes
- **Recommended Fix:**
  ```typescript
  // Replace line 18 with secure JWT verification
  const token = request.cookies.get('sb-access-token')?.value;
  const { role, isValid } = await verifyJWTAndGetRole(token);
  
  if (!isValid) {
    return redirectToLogin(request);
  }
  ```
- **Tests to Add:**
  - Cookie manipulation bypass test
  - Security headers presence test
  - CORS origin validation test

---

### `lib/rbac/guard.ts`
- **Purpose:** Main RBAC permission checking and enforcement
- **Security-relevant code:**
  ```typescript
  Line 35-70: checkPermission() main logic
  Line 96: if (enforcementMode === 'dry-run') return null;
  Line 169-185: withRBAC() HOC wrapper
  Line 526-549: RBAC enforcement mode checks
  ```
- **Findings:**
  - **[P0]** Dry-run mode bypasses all RBAC checks completely
  - **[P1]** Generic error handling loses audit trail
  - **[P2]** No caching strategy for permission checks
  - **[P3]** Limited context validation
- **Evidence:** `RBAC_ENFORCEMENT=dry-run` allows all actions regardless of permissions
- **Recommended Fix:**
  ```typescript
  // Remove dry-run bypass in production
  if (process.env.NODE_ENV === 'production' && enforcementMode !== 'enforce') {
    throw new Error('RBAC must be enforced in production');
  }
  ```
- **Tests to Add:**
  - Dry-run mode security test
  - Permission cache validation
  - Context-based permission test

---

### `app/api/auth/login/route.ts`
- **Purpose:** User authentication endpoint
- **Security-relevant code:**
  ```typescript
  Line 18-26: Input validation
  Line 36-42: Supabase authentication
  Line 45-50: Error handling and audit logging
  Line 89-95: Session management
  ```
- **Findings:**
  - **[P1]** Basic rate limiting implementation only
  - **[P2]** Detailed error messages expose auth internals
  - **[P2]** No account lockout mechanism
  - **[P3]** Limited audit logging
- **Evidence:** Error responses contain specific Supabase error details
- **Recommended Fix:**
  ```typescript
  // Generic error messages
  const genericError = { error: 'Invalid credentials' };
  return NextResponse.json(genericError, { status: 401 });
  ```
- **Tests to Add:**
  - Rate limiting effectiveness test
  - Account lockout test
  - Error message information disclosure test

---

### `app/api/auth/register-new/route.ts`
- **Purpose:** User registration endpoint
- **Security-relevant code:**
  ```typescript
  Line 15-29: Input validation
  Line 37: email_confirmed_at: new Date().toISOString()
  Line 45-60: Profile creation logic
  ```
- **Findings:**
  - **[P1]** Minimal input validation (no email format, password strength)
  - **[P2]** Auto-confirmation bypasses email verification
  - **[P2]** No duplicate account protection
  - **[P3]** Role assignment without permission check
- **Evidence:** Registration accepts weak passwords and malformed emails
- **Recommended Fix:**
  ```typescript
  // Add comprehensive validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }
  
  if (!passwordRegex.test(password)) {
    return NextResponse.json({ error: 'Password does not meet requirements' }, { status: 400 });
  }
  ```
- **Tests to Add:**
  - Email format validation test
  - Password strength requirement test
  - Duplicate registration prevention test

---

### `app/api/admin/users/[userId]/roles/route.ts`
- **Purpose:** Admin role management
- **Security-relevant code:**
  ```typescript
  Line 98-120: User authentication and permission checks
  Line 168-190: Role assignment logic
  Line 219-250: Database role operations
  ```
- **Findings:**
  - **[P1]** Inconsistent permission checking patterns
  - **[P1]** Direct database access without RBAC validation
  - **[P2]** No validation of role assignment scope
  - **[P3]** Missing audit logging for role changes
- **Evidence:** Role assignment bypasses RBAC guard in some code paths
- **Recommended Fix:**
  ```typescript
  // Consistent RBAC protection
  export const POST = withRBAC('role:assign:all', async (request, { params }) => {
    // Handler logic with guaranteed permission check
  });
  ```
- **Tests to Add:**
  - Role assignment permission test
  - Cross-user role modification test
  - Audit logging verification test

---

### `src/components/auth/rbac-provider.tsx`
- **Purpose:** Client-side RBAC context provider
- **Security-relevant code:**
  ```typescript
  Line 263: if (user.email === 'luxsess2001@gmail.com')
  Line 50-90: Role loading and caching logic
  Line 234-250: API fallback mechanisms
  ```
- **Findings:**
  - **[P1]** Hardcoded admin email check creates privilege escalation path
  - **[P2]** Client-side role caching without server validation
  - **[P2]** Multiple fallback mechanisms reduce security consistency
  - **[P3]** No role change detection/invalidation
- **Evidence:** Email change to hardcoded value grants admin access
- **Recommended Fix:**
  ```typescript
  // Remove hardcoded email checks completely
  // Always validate roles server-side
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  ```
- **Tests to Add:**
  - Hardcoded email bypass test
  - Role cache invalidation test
  - Server-side role validation test

---

### `app/api/invoices/route.ts`
- **Purpose:** Invoice management API
- **Security-relevant code:**
  ```typescript
  Line 22-35: Authentication and role checking
  Line 75-90: Booking ownership verification
  Line 180-210: Role-based data filtering
  ```
- **Findings:**
  - **[P1]** Role validation occurs after data access
  - **[P2]** Inconsistent permission model vs other endpoints
  - **[P2]** No resource-level authorization
  - **[P3]** Limited audit trail
- **Evidence:** Some data queries execute before permission validation
- **Recommended Fix:**
  ```typescript
  // Move permission check to top of handler
  export const POST = withRBAC('invoice:create:own', async (req) => {
    // All logic after permission validation
  });
  ```
- **Tests to Add:**
  - Resource ownership validation test
  - Cross-tenant data access test
  - Permission timing test

---

### `app/api/webhooks/payment-success/route.ts`
- **Purpose:** Payment webhook processing
- **Security-relevant code:**
  ```typescript
  Line 26-35: Webhook signature verification (placeholder)
  Line 45-60: Service role client creation
  Line 110-130: Database operations with elevated privileges
  ```
- **Findings:**
  - **[P1]** Webhook signature verification not implemented
  - **[P1]** Service role client allows unrestricted database access
  - **[P2]** No webhook replay protection
  - **[P3]** Limited webhook source validation
- **Evidence:** Commented webhook verification allows unsigned requests
- **Recommended Fix:**
  ```typescript
  // Implement actual signature verification
  const isValid = verifyStripeSignature(payload, signature, webhookSecret);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }
  ```
- **Tests to Add:**
  - Webhook signature validation test
  - Replay attack protection test
  - Unauthorized webhook source test

---

### `components/dashboard-auth-guard.tsx`
- **Purpose:** Client-side route protection
- **Security-relevant code:**
  ```typescript
  Line 120-150: Role-based access control
  Line 180-200: Session validation logic
  ```
- **Findings:**
  - **[P2]** Client-side only protection (bypassable)
  - **[P2]** No server-side validation of route access
  - **[P3]** Race conditions in auth checking
- **Evidence:** JavaScript disabled or modified bypasses all protection
- **Recommended Fix:**
  ```typescript
  // Always validate access server-side
  // Client guard is UI enhancement only
  ```
- **Tests to Add:**
  - Client-side bypass test
  - JavaScript disabled access test
  - Race condition test

---

### `package.json`
- **Purpose:** Dependency management
- **Security-relevant code:**
  ```json
  Line 60: "next": "14.2.28"
  Line 95: "supabase": "1.200.3"
  Dependencies with known vulnerabilities
  ```
- **Findings:**
  - **[P0]** Next.js version has critical security vulnerabilities
  - **[P2]** Multiple dependency vulnerabilities (dompurify, xlsx, cookie)
  - **[P3]** No dependency vulnerability monitoring
- **Evidence:** npm audit shows 6 vulnerabilities including 1 critical
- **Recommended Fix:**
  ```bash
  npm install next@14.2.31
  npm install dompurify@3.2.4
  npm audit fix --force
  ```
- **Tests to Add:**
  - Dependency vulnerability scan
  - Security update verification
  - Breaking change validation

---

## Summary by Severity

### P0 (Critical) - 3 files
- `middleware.ts` - Cookie role bypass
- `lib/rbac/guard.ts` - Dry-run bypass
- `package.json` - Critical CVEs

### P1 (High) - 5 files  
- `app/api/auth/register-new/route.ts` - Input validation
- `app/api/admin/users/[userId]/roles/route.ts` - Inconsistent RBAC
- `src/components/auth/rbac-provider.tsx` - Hardcoded admin
- `app/api/invoices/route.ts` - Permission timing
- `app/api/webhooks/payment-success/route.ts` - Webhook security

### P2 (Medium) - 4 files
- `app/api/auth/login/route.ts` - Error disclosure
- `components/dashboard-auth-guard.tsx` - Client-side only
- Various files - Missing security features

### P3 (Low) - All files
- Missing audit logging
- Limited test coverage
- Documentation gaps
