# API RBAC Guard Mapping

**Goal:** Every sensitive `/api/*` endpoint has tenant isolation, permission checks, consistent error handling, and audit logging.

## Canonical Guards (existing)

| Guard | Use | Location |
|-------|-----|----------|
| `withRBAC('permission:name')` | Permission-based access | `lib/rbac/guard.ts` |
| `withAnyRBAC(['p1', 'p2'])` | Any of multiple permissions | `lib/rbac/guard.ts` |
| `getCompanyRole(supabase)` | Manual tenant scoping | `lib/auth/get-company-role.ts` |

**Future (recommended):**
- `requireApiAuth()` — any authenticated user
- `requireApiAdmin()` — admin/manager/super_admin (reuse `requireAdminAccess` logic)
- `requireApiPermission('contracts:write')` — alias for `withRBAC`

---

## Top 10 Most Sensitive Routes — Guard Mapping

| Route | Methods | Current Guard | Recommended | Tenant Scoping |
|-------|---------|---------------|-------------|----------------|
| `/api/users` | GET, POST | `withRBAC` (POST) | `user:read:all` / `user:create:all` | Service role for admin; scope by company |
| `/api/users/management` | * | Check | `user:read:all` or `user:manage:all` | company_id |
| `/api/users/roles`, `/api/users/permissions` | * | Check | `role:read:all` / `role:assign:all` | company_id |
| `/api/contracts` | GET, POST, PUT, DELETE | `withRBAC`, `withAnyRBAC` | `contracts:read:own`, `contracts:write:own` | company_id via getCompanyRole |
| `/api/contracts/templates` | GET, POST | `withRBAC` | `contracts:read:own`, `contracts:write:own` | company_id |
| `/api/contracts/clause-library` | GET, POST | `withRBAC` | `contracts:read:own`, `contracts:write:own` | company_id |
| `/api/audit-logs` | GET | `withRBAC('audit:read:all')` | ✅ | Scope by company_id |
| `/api/user/data-export` | * | Check | `user:read:own` or `user:export:own` | user_id / company_id |
| `/api/roles` | GET, POST, PUT, DELETE | Check | `role:read:all`, `role:create:all` | company_id |
| `/api/promoters` | GET, POST | `withRBAC` | `promoter:read:own`, `promoter:write:own` | company_id |
| `/api/hr/employees`, `/api/hr/attendance-requests`, `/api/hr/leave-requests` | * | `getCompanyRole` manual | `hr:read:own`, `hr:write:own` | company_id |

**Routes using manual `getCompanyRole` (candidate for `withRBAC`):**
- `/api/inbox/*`, `/api/hr/*`, `/api/dashboard/metrics`, `/api/analytics/hr` — use `getCompanyRole` + manual checks. Consider wrapping with `withRBAC('hr:read:own')` etc. for consistency.

---

## Intentionally Unguarded Routes (allowlist for CI)

These routes must NOT require `withRBAC` (public or special auth):

| Route | Reason |
|-------|--------|
| `/api/auth/*` | Login, register, callback, CSRF, session — own auth flow |
| `/api/webhooks/stripe` | Stripe webhook (signature verification) |
| `/api/webhooks/whatsapp`, `/api/webhooks/resend` | External webhooks |
| `/api/csp-report` | Browser CSP reports (no auth) |
| `/api/internal/webhook-proxy` | Internal; has `withRBAC` |

---

## CI: API Guard Enforcement

**`scripts/check-api-guards.js`** — default-deny: all `app/api/**/route.ts` must use `withRBAC` or `withAnyRBAC` unless in allowlist.

- `UNGUARDED_ALLOWLIST` — auth, webhooks, csp-report, health, etc.
- `PENDING_MIGRATION` — routes using manual auth; each has `expires` (YYYY-MM-DD). CI fails when expired unless `ALLOW_PENDING_MIGRATION=1`. Target: empty by 2026-03-31.
- Run: `npm run api:check-guards`

**`scripts/rbac-lint.ts`** — generates report; fails if routes lack `withRBAC` (file-level check).

**Legacy (optional):** Add an explicit allowlist for routes that are intentionally unguarded, similar to `check-pages-freeze.js`:

```js
// scripts/check-api-guards.js (outline)
const UNGUARDED_ALLOWLIST = new Set([
  'app/api/auth/login/route.ts',
  'app/api/auth/register-new/route.ts',
  'app/api/auth/callback/route.ts',
  'app/api/auth/csrf/route.ts',
  'app/api/auth/check-session/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/auth/refresh-session/route.ts',
  'app/api/csp-report/route.ts',
  'app/api/webhooks/stripe/route.ts',
  // ... add as needed
]);

// For each route in app/api/**/route.ts:
// - If in UNGUARDED_ALLOWLIST → OK
// - Else must contain withRBAC( or withAnyRBAC( → OK
// - Else → FAIL
```

Run in CI before deploy. Prevents new sensitive routes from being added without guards.

---

## Integration Tests (3 critical assertions)

### 1. Cross-tenant access denied ✅ Implemented

**`tests/tenant-isolation.test.js`** — User B cannot access Tenant A's contract.

- Run: `npm run test:tenant-isolation`
- Env: `TEST_TENANT_A_EMAIL`, `TEST_TENANT_A_PASSWORD`, `TEST_TENANT_B_EMAIL`, `TEST_TENANT_B_PASSWORD`, `CONTRACT_ID_TENANT_A` (required in all envs)
- **CI missing env → fail.** Local missing env → skip.
- **Policy:** Expect 404 (preferred). 403 accepted until `TENANT_TEST_ENFORCE_404=1`.
- **TENANT_TEST_STRICT:** Repo variable to make blocking. **TENANT_TEST_ENFORCE_404:** Repo variable to fail on 403.

### 2. Non-admin denied on admin APIs ✅ Implemented

**`tests/non-admin-denied.test.js`** — Provider/client user gets **403 only** on admin endpoints.

- Run: `npm run test:non-admin-denied`
- Env: `TEST_NON_ADMIN_EMAIL`, `TEST_NON_ADMIN_PASSWORD` (user with role provider or client)
- Endpoints: `/api/users/management`, `/api/audit-logs`, `/api/roles`
- **Policy:** Auth is validated first; 401 fails (broken token/auth). Authenticated user without permission → 403.

### 3. Contracts export role-matrix test (next ROI)

Export endpoints are common escalation targets. Minimal test:

- User with `contracts:read` but not `contracts:export` → denied
- User with `contracts:export` → allowed

Catches permission miswiring even when guards exist.

---

## Done Criteria (workstream complete when)

1. `api:check-guards` is strict and **no expired allowlist** (PENDING_MIGRATION all migrated or expires updated)
2. `rbac:lint` is **blocking** (set repo variable `RBAC_LINT_STRICT=1`)
3. Tenant isolation test is in CI and **passing**:
   - Secrets: `TEST_TENANT_A_EMAIL`, `TEST_TENANT_A_PASSWORD`, `TEST_TENANT_B_EMAIL`, `TEST_TENANT_B_PASSWORD`, `CONTRACT_ID_TENANT_A`
   - Repo variable: `TENANT_TEST_STRICT=1` (removes continue-on-error)

## CI lock-in sequence (recommended order)

Once secrets are configured and tests stable:

1. Set **`TENANT_TEST_STRICT=1`**
2. Set **`TENANT_TEST_ENFORCE_404=1`** (strict mode implies strict concealment)
3. Set **`RBAC_LINT_STRICT=1`**
4. Burn down **PENDING_MIGRATION** before 2026-03-31

## Next Steps

1. Run `npm run api:check-guards` and `npm run rbac:lint` to see current compliance.
2. Migrate routes from PENDING_MIGRATION to `withRBAC` before 2026-03-31.
3. Set `RBAC_LINT_STRICT=1` when rbac-lint passes.
4. Add TEST_TENANT_A_*, TEST_TENANT_B_*, CONTRACT_ID_TENANT_A, TEST_NON_ADMIN_* secrets.
5. Run `npm run test:integration` for full integration suite.
