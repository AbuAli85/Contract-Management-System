# Phased Routing Cutover: pages/ → app/

**Policy (Phase 0):** New routes go **only** in `app/`. `pages/` is maintenance-only until retired.

## CI Guard

`npm run routing:check-pages-freeze` fails if any file exists under `pages/` that is not in the allowlist.

- **Allowlist:** `scripts/check-pages-freeze.js` → `ALLOWLIST`
- **When migrating:** Remove file from `pages/`, add `app/` equivalent, remove from allowlist

## Route Ownership

| Surface | Canonical | Legacy |
|---------|-----------|--------|
| UI pages | `app/` | `pages/` (maintenance only) |
| API | `app/api/*` | — |
| i18n/RTL | `app/` layout | — |

## Phased Plan

### Phase 1 — Inventory (current)

**Migrated (redirect-only):**
- `pages/admin.tsx` → 307 redirect to `/[locale]/admin`
- `pages/not-authorized.tsx` → 307 redirect to `/[locale]/auth/unauthorized`

**App equivalents:**
- `app/[locale]/admin/layout.tsx` — single RBAC gate for all admin routes (requireAdminAccess)
- `app/[locale]/admin/page.tsx` — AdminDashboardUnified (gate enforced by layout)
- `app/[locale]/admin/users`, `permissions`, `integrations`, `contracts-without-promoters` — all protected by layout
- `app/[locale]/auth/unauthorized/page.tsx` — Access Denied UI

**Already in app:**
- `/api/auth/*`
- Contracts, templates, export

### Phase 2 — Build app/ equivalents

1. Create `app/` route with identical URL and behavior
2. Add `NEXT_PUBLIC_APP_ROUTING_CUTOVER` flag (optional)
3. Verify parity before redirect

### Phase 3 — Cutover

- Redirect old pages route → new app route
- Use **307 Temporary** during burn-in; **308 Permanent** when stable (reduces repeated redirects, improves SEO/UX)

### Phase 4 — Remove pages/

- Middleware redirects for `/admin` and `/not-authorized` are implemented behind `ENABLE_LEGACY_ROUTE_REDIRECTS=0|1`. When `1`, middleware handles redirects before pages router.
- **Burn-in:** Set `ENABLE_LEGACY_ROUTE_REDIRECTS=1` in production for 7–14 days. Redirect hits are logged (sampled ~10%) with `path`, `locale_source`, `resolved_locale` for confidence before removal.
- **Phase 4 steps:** 1) Enable flag and monitor; 2) Delete `pages/admin.tsx` and `pages/not-authorized.tsx`; 3) Set `ALLOWLIST = new Set()` in `check-pages-freeze.js` (fails if any `pages/` file exists); 4) Switch redirect status from 307 → 308 when stable.

## Server Gate Contract (pattern for future routes)

All gates should redirect unauthenticated → `/${locale}/auth/login`, unauthorized → `/${locale}/auth/unauthorized`, and return a consistent auth context.

| Helper | Use |
|--------|-----|
| `requireAdminAccess(locale)` | Admin/manager/super_admin pages |
| `requireManagerAccess(locale)` | Manager+ (future) |
| `requireCompanyAccess(locale)` | Any authenticated tenant (future) |
| `requireFeatureAccess(locale, featureKey)` | Plan/subscription gating (future) |

Client components receive `authorized={true}` from the server page when the gate passes — avoids privileged queries before authorization.

## Next Migration Target

**Recommended:** Admin + RBAC screens first (reduces security drift fastest).
