# API Routes Organization

This document describes the API routes structure and provides guidance for consolidation.

## Current Structure

### Core Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/api/auth/*` | Authentication endpoints | ✅ Active |
| `/api/contracts/*` | Contract management | ✅ Active |
| `/api/promoters/*` | Promoter management | ✅ Active |
| `/api/parties/*` | Party/company management | ✅ Active |
| `/api/users/*` | User management | ✅ Active |
| `/api/dashboard/*` | Dashboard data | ✅ Active |
| `/api/analytics/*` | Analytics and reporting | ✅ Active |
| `/api/admin/*` | Admin operations | ✅ Active |

### Webhook Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/api/webhook/makecom*` | Make.com integration | ✅ Active |
| `/api/webhook/contract-pdf-ready*` | PDF ready callbacks | ✅ Active |
| `/api/webhooks/resend` | Email delivery webhooks | ✅ Active |
| `/api/webhooks/payment-success` | Payment webhooks | ⚠️ Review |
| `/api/webhooks/booking-events` | Booking webhooks | 📁 Disabled |

### Disabled Routes

These routes are in `_disabled` or `_disabled_debug` folders and are not active:

- `/api/_disabled/bookings/*` - Booking system (deprecated)
- `/api/_disabled/hr/*` - HR module (not implemented)
- `/api/_disabled/invoices/*` - Invoicing (not implemented)
- `/api/_disabled/provider/*` - Provider features (deprecated)
- `/api/_disabled/workflow/*` - Workflow automation (not implemented)
- `/api/_disabled_debug/*` - Debug endpoints (development only)

## Redundancy Issues

### 1. User Role Routes (Should Consolidate)

Multiple routes serving similar purposes:

- `/api/get-user-role` 
- `/api/check-user-role`
- `/api/user-role`
- `/api/users/roles`
- `/api/reviewer-roles`

**Recommendation**: Consolidate to `/api/users/roles` with query params.

### 2. Authentication Routes (Complex but Needed)

Multiple auth endpoints for different scenarios:

- `/api/auth/login` - Standard login
- `/api/auth/simple-login` - Simplified login
- `/api/auth/production-login` - Production-specific
- `/api/auth/professional` - Professional auth
- `/api/auth/register` - Standard registration
- `/api/auth/register-new` - New registration flow
- `/api/auth/simple-register` - Simplified registration
- `/api/auth/production-register` - Production-specific

**Recommendation**: Keep standardized endpoints, mark others for deprecation.

### 3. Contract Generation Routes (Redundant)

- `/api/contract-generation`
- `/api/generate-contract`
- `/api/contracts/generate`
- `/api/contracts/general/generate`
- `/api/contracts/makecom/generate`
- `/api/pdf-generation`
- `/api/pdf/generate-contract`

**Recommendation**: Consolidate to `/api/contracts/generate` with type parameter.

### 4. Health Check Routes (Duplicate)

- `/api/health`
- `/api/health-check`
- `/api/promoters/health`

**Recommendation**: Keep only `/api/health`.

### 5. Users Fixed Route (Legacy)

- `/api/users-fixed` - Temporary fix

**Recommendation**: Remove after verifying `/api/users` works correctly.

## Route Conventions

### Standard CRUD Pattern

```
GET    /api/[resource]        # List
POST   /api/[resource]        # Create
GET    /api/[resource]/[id]   # Read
PUT    /api/[resource]/[id]   # Update
DELETE /api/[resource]/[id]   # Delete
```

### Nested Resources

```
GET    /api/[parent]/[parentId]/[child]        # List children
POST   /api/[parent]/[parentId]/[child]        # Create child
GET    /api/[parent]/[parentId]/[child]/[id]   # Read child
```

### Actions

```
POST   /api/[resource]/[id]/[action]   # e.g., /api/contracts/123/approve
```

## Recommended Consolidation Plan

### Phase 1: Remove Duplicates

1. Remove `/api/users-fixed` after verification
2. Remove duplicate health endpoints
3. Consolidate role check endpoints

### Phase 2: Standardize Auth

1. Keep `/api/auth/login` and `/api/auth/register`
2. Deprecate production-specific and simple variants
3. Add feature flags for auth modes

### Phase 3: Consolidate Generation

1. Unify contract generation under `/api/contracts/generate`
2. Use query params for type: `?type=employment|general|makecom`
3. Unify PDF generation under `/api/contracts/[id]/pdf`

### Phase 4: Clean Up Disabled

1. Delete or archive `_disabled` routes
2. Remove `_disabled_debug` from production builds

## Security Considerations

All API routes should:

1. Validate authentication via middleware
2. Check RBAC permissions
3. Rate limit by user/IP
4. Log requests for audit
5. Sanitize inputs
6. Return standardized error responses

## API Response Format

Standard success response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Standard error response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

