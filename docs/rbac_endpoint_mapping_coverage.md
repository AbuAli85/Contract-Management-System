# 🛡️ RBAC Endpoint Mapping Coverage Analysis

## 📋 Overview

This document analyzes the coverage of RBAC guards across all API endpoints in the Contract Management System. It identifies which endpoints are protected, which need protection, and provides implementation guidance.

**Analysis Date**: January 20, 2025  
**Total Endpoints Found**: 80+  
**Protected Endpoints**: 5 (Admin routes only)  
**Coverage**: ~6%

## 🔒 Protected Endpoints (RBAC Guards Present)

| Endpoint                          | Method | Required Permission | Guard Implementation          | Status       |
| --------------------------------- | ------ | ------------------- | ----------------------------- | ------------ |
| `/api/admin/roles`                | GET    | `role:read:all`     | `withRBAC('role:read:all')`   | ✅ PROTECTED |
| `/api/admin/roles`                | POST   | `role:create:all`   | `withRBAC('role:create:all')` | ✅ PROTECTED |
| `/api/admin/users/[userId]/roles` | GET    | `user:read:all`     | `withRBAC('user:read:all')`   | ✅ PROTECTED |
| `/api/admin/users/[userId]/roles` | POST   | `role:assign:all`   | `withRBAC('role:assign:all')` | ✅ PROTECTED |
| `/api/admin/users/[userId]/roles` | DELETE | `role:assign:all`   | `withRBAC('role:assign:all')` | ✅ PROTECTED |

## 🚨 Critical Endpoints (High Priority for RBAC Protection)

### User Management

| Endpoint                      | Method | Required Permission | Current Status | Priority |
| ----------------------------- | ------ | ------------------- | -------------- | -------- |
| `/api/users/[id]/permissions` | GET    | `user:read:all`     | ❌ UNGUARDED   | P0       |
| `/api/users/[id]/permissions` | POST   | `user:edit:all`     | ❌ UNGUARDED   | P0       |
| `/api/users/assign-role`      | POST   | `role:assign:all`   | ❌ UNGUARDED   | P0       |
| `/api/users/[id]/approve`     | PUT    | `user:approve:all`  | ❌ UNGUARDED   | P0       |
| `/api/users/approval`         | GET    | `user:read:all`     | ❌ UNGUARDED   | P0       |
| `/api/users/approval`         | POST   | `user:approve:all`  | ❌ UNGUARDED   | P0       |
| `/api/users/sync`             | POST   | `user:sync:all`     | ❌ UNGUARDED   | P0       |

### Contract Management

| Endpoint                           | Method | Required Permission         | Current Status | Priority |
| ---------------------------------- | ------ | --------------------------- | -------------- | -------- |
| `/api/contracts/[id]`              | GET    | `contract:view:own`         | ❌ UNGUARDED   | P0       |
| `/api/contracts/[id]`              | PUT    | `contract:edit:own`         | ❌ UNGUARDED   | P0       |
| `/api/contracts/[id]/approve`      | POST   | `contract:approve:provider` | ❌ UNGUARDED   | P0       |
| `/api/contracts/[id]/reject`       | POST   | `contract:reject:provider`  | ❌ UNGUARDED   | P0       |
| `/api/contracts/[id]/generate-pdf` | POST   | `contract:generate:own`     | ❌ UNGUARDED   | P1       |
| `/api/contracts/[id]/download-pdf` | GET    | `contract:download:own`     | ❌ UNGUARDED   | P1       |

### Service Management

| Endpoint                 | Method | Required Permission     | Current Status | Priority |
| ------------------------ | ------ | ----------------------- | -------------- | -------- |
| `/api/services`          | GET    | `service:view:public`   | ❌ UNGUARDED   | P1       |
| `/api/services`          | POST   | `service:create:own`    | ❌ UNGUARDED   | P0       |
| `/api/provider/services` | GET    | `service:view:provider` | ❌ UNGUARDED   | P1       |
| `/api/provider/services` | POST   | `service:create:own`    | ❌ UNGUARDED   | P0       |
| `/api/provider/services` | PUT    | `service:edit:own`      | ❌ UNGUARDED   | P0       |

### Booking Management

| Endpoint                 | Method | Required Permission      | Current Status | Priority |
| ------------------------ | ------ | ------------------------ | -------------- | -------- |
| `/api/enhanced/bookings` | GET    | `booking:view:own`       | ❌ UNGUARDED   | P0       |
| `/api/enhanced/bookings` | POST   | `booking:create:own`     | ❌ UNGUARDED   | P0       |
| `/api/booking-resources` | GET    | `booking:resources:view` | ❌ UNGUARDED   | P1       |

### Company Management

| Endpoint                       | Method | Required Permission           | Current Status | Priority |
| ------------------------------ | ------ | ----------------------------- | -------------- | -------- |
| `/api/enhanced/companies`      | GET    | `company:view:organization`   | ❌ UNGUARDED   | P1       |
| `/api/enhanced/companies`      | POST   | `company:create:organization` | ❌ UNGUARDED   | P0       |
| `/api/enhanced/companies/[id]` | GET    | `company:view:organization`   | ❌ UNGUARDED   | P1       |
| `/api/enhanced/companies/[id]` | PUT    | `company:edit:organization`   | ❌ UNGUARDED   | P0       |
| `/api/enhanced/companies/[id]` | DELETE | `company:delete:organization` | ❌ UNGUARDED   | P0       |

## ⚠️ Medium Priority Endpoints

### Workflow & Reviews

| Endpoint               | Method | Required Permission    | Current Status | Priority |
| ---------------------- | ------ | ---------------------- | -------------- | -------- |
| `/api/workflow/config` | GET    | `workflow:view:all`    | ❌ UNGUARDED   | P2       |
| `/api/workflow/config` | POST   | `workflow:create:all`  | ❌ UNGUARDED   | P2       |
| `/api/workflow/config` | PUT    | `workflow:edit:all`    | ❌ UNGUARDED   | P2       |
| `/api/workflow/config` | DELETE | `workflow:delete:all`  | ❌ UNGUARDED   | P2       |
| `/api/reviews/pending` | GET    | `review:view:provider` | ❌ UNGUARDED   | P2       |
| `/api/reviewer-roles`  | GET    | `role:view:all`        | ❌ UNGUARDED   | P2       |
| `/api/reviewer-roles`  | POST   | `role:create:all`      | ❌ UNGUARDED   | P2       |

### File Management

| Endpoint      | Method | Required Permission | Current Status | Priority |
| ------------- | ------ | ------------------- | -------------- | -------- |
| `/api/upload` | POST   | `file:upload:own`   | ❌ UNGUARDED   | P2       |
| `/api/upload` | DELETE | `file:delete:own`   | ❌ UNGUARDED   | P2       |

### Tracking & Analytics

| Endpoint              | Method | Required Permission   | Current Status | Priority |
| --------------------- | ------ | --------------------- | -------------- | -------- |
| `/api/trackings/[id]` | GET    | `tracking:view:own`   | ❌ UNGUARDED   | P2       |
| `/api/trackings/[id]` | PATCH  | `tracking:edit:own`   | ❌ UNGUARDED   | P2       |
| `/api/provider/stats` | GET    | `stats:view:provider` | ❌ UNGUARDED   | P2       |

## 🔓 Low Priority Endpoints (Public/Utility)

### Authentication & Status

| Endpoint                    | Method | Required Permission    | Current Status | Priority |
| --------------------------- | ------ | ---------------------- | -------------- | -------- |
| `/api/auth/status`          | GET    | `auth:status:public`   | ❌ UNGUARDED   | P3       |
| `/api/auth/refresh-session` | GET    | `auth:refresh:own`     | ❌ UNGUARDED   | P3       |
| `/api/auth/refresh-session` | POST   | `auth:refresh:own`     | ❌ UNGUARDED   | P3       |
| `/api/auth/register-new`    | POST   | `auth:register:public` | ❌ UNGUARDED   | P3       |
| `/api/supabase-config`      | GET    | `config:view:public`   | ❌ UNGUARDED   | P3       |

### Webhooks (External Systems)

| Endpoint                          | Method | Required Permission      | Current Status | Priority |
| --------------------------------- | ------ | ------------------------ | -------------- | -------- |
| `/api/webhooks/[type]`            | POST   | `webhook:receive:public` | ❌ UNGUARDED   | P3       |
| `/api/webhook/makecom`            | POST   | `webhook:makecom:public` | ❌ UNGUARDED   | P3       |
| `/api/webhook/contract-pdf-ready` | POST   | `webhook:pdf:public`     | ❌ UNGUARDED   | P3       |

### Test & Development

| Endpoint           | Method | Required Permission | Current Status | Priority |
| ------------------ | ------ | ------------------- | -------------- | -------- |
| `/api/test-*`      | \*     | `test:access:all`   | ❌ UNGUARDED   | P3       |
| `/api/setup-admin` | POST   | `admin:setup:all`   | ❌ UNGUARDED   | P3       |

## 🛠️ Implementation Plan

### Phase 1: Critical Endpoints (P0)

**Timeline**: Week 1  
**Endpoints**: 15  
**Implementation**: Wrap with `withRBAC()` guards

```typescript
// Example implementation for user permissions endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRBAC('user:read:all', async (req, ctx) => {
    // Existing handler logic
    const userId = (await params).id;
    // ... rest of implementation
  })(request, { params });
}
```

### Phase 2: High Priority Endpoints (P1)

**Timeline**: Week 2  
**Endpoints**: 12  
**Implementation**: Wrap with appropriate permission checks

### Phase 3: Medium Priority Endpoints (P2)

**Timeline**: Week 3  
**Endpoints**: 18  
**Implementation**: Add RBAC guards with proper error handling

### Phase 4: Low Priority Endpoints (P3)

**Timeline**: Week 4  
**Endpoints**: 20+  
**Implementation**: Add minimal guards or mark as public

## 📊 Coverage Targets

| Phase   | Target Coverage | Endpoints Protected | Timeline |
| ------- | --------------- | ------------------- | -------- |
| Current | 6%              | 5                   | Baseline |
| Phase 1 | 25%             | 20                  | Week 1   |
| Phase 2 | 40%             | 32                  | Week 2   |
| Phase 3 | 65%             | 52                  | Week 3   |
| Phase 4 | 90%             | 72                  | Week 4   |
| Final   | 95%             | 76                  | Week 5   |

## 🔍 Implementation Guidelines

### 1. Permission Mapping

- **User endpoints**: Use `user:*:own` for personal data, `user:*:all` for admin access
- **Contract endpoints**: Use `contract:*:own` for user contracts, `contract:*:provider` for provider access
- **Service endpoints**: Use `service:*:own` for provider services, `service:*:public` for discovery
- **Company endpoints**: Use `company:*:organization` for org-scoped access

### 2. Guard Implementation

```typescript
// Single permission
export async function GET(request: NextRequest) {
  return withRBAC('user:read:all', async req => {
    // Handler logic
  })(request);
}

// Multiple permissions (any)
export async function POST(request: NextRequest) {
  return withAnyRBAC(['user:create:all', 'admin:access:all'], async req => {
    // Handler logic
  })(request);
}

// Context-aware permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRBAC('contract:view:own', async (req, ctx) => {
    // Handler logic with context
  })(request, { params });
}
```

### 3. Error Handling

```typescript
// Custom error responses
export async function GET(request: NextRequest) {
  return withRBAC('user:read:all', async req => {
    try {
      // Handler logic
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      );
    }
  })(request);
}
```

## ⚠️ Risk Assessment

### High Risk (P0)

- **User management endpoints**: Direct access to user data and role assignment
- **Contract approval endpoints**: Ability to approve/reject contracts
- **Service creation endpoints**: Ability to create services

### Medium Risk (P1)

- **Data viewing endpoints**: Information disclosure
- **Resource management**: Resource manipulation

### Low Risk (P2/P3)

- **Public endpoints**: Limited sensitive data
- **Utility endpoints**: System configuration and status

## 📝 Next Steps

1. **Immediate**: Implement P0 endpoints protection
2. **Week 1**: Complete Phase 1 implementation
3. **Week 2**: Implement P1 endpoints
4. **Week 3**: Add P2 endpoint guards
5. **Week 4**: Finalize P3 endpoints
6. **Week 5**: Testing and validation

## 🔧 Testing Strategy

### Unit Tests

- Test each guard with valid/invalid permissions
- Verify error responses and status codes
- Test context evaluation

### Integration Tests

- Test complete request flows
- Verify audit logging
- Test cache invalidation

### Performance Tests

- Measure guard overhead
- Test concurrent access
- Validate memory usage

## 📚 Resources

- [RBAC Implementation Guide](rbac.md)
- [RBAC Project Map](rbac_project_map.md)
- [RBAC Endpoint Mapping](rbac_endpoint_mapping.md)
- [RBAC Guard Implementation](lib/rbac/guard.ts)
