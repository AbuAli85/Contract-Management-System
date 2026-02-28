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
- `app/[locale]/admin/page.tsx` — server-side RBAC gate + AdminDashboardUnified
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
- Use **307 Temporary** during burn-in; **308 Permanent** when final

### Phase 4 — Remove pages/

- Delete migrated pages after 7–14 days stable
- Shrink allowlist in `check-pages-freeze.ts`

## Next Migration Target

**Recommended:** Admin + RBAC screens first (reduces security drift fastest).
