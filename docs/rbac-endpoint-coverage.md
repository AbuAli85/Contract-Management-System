# 🔐 RBAC Endpoint Coverage Guide

This document explains how to use the RBAC endpoint coverage generator and implement permission checks across your API endpoints.

## Overview

The RBAC endpoint coverage generator automatically analyzes your codebase to identify endpoints that need RBAC protection and generates implementation stubs for each one.

## Quick Start

### 1. Generate Endpoint Coverage

```bash
# Install dependencies if needed
npm install glob

# Generate endpoint coverage stubs
node scripts/generate-rbac-endpoints.js
```

This will:

- Scan your API directories for endpoints
- Generate individual stub files for each endpoint
- Create an index file with coverage statistics
- Output everything to `docs/rbac-endpoints/`

### 2. Review Generated Stubs

Each generated stub contains:

- **Endpoint information** (file path, HTTP methods, resource type)
- **Required permissions** with scope suggestions
- **Implementation example** with permission checks
- **Testing guidelines** for different permission levels
- **Notes** for customization

### 3. Implement Permission Checks

Use the generated examples to add RBAC protection to your endpoints:

```typescript
import { permissionEvaluator } from '@/lib/rbac/evaluate';

export async function GET(request: NextRequest, { params }: { params: any }) {
  // Extract user ID from authenticated session
  const userId = await getUserIdFromSession(request);

  // Check permission
  const decision = await permissionEvaluator.evaluatePermission(
    userId,
    'user:read:own',
    {
      context: {
        user: { id: userId },
        params,
        resourceType: 'user',
        resourceId: params.id,
        request,
      },
    }
  );

  if (!decision.allowed) {
    return new Response('Forbidden', { status: 403 });
  }

  // Proceed with endpoint logic
  // ... your existing code here
}
```

## Generated File Structure

```
docs/rbac-endpoints/
├── README.md                 # Coverage overview and statistics
├── users.md                  # User endpoints stub
├── contracts.md              # Contract endpoints stub
├── bookings.md               # Booking endpoints stub
├── companies.md              # Company endpoints stub
└── ...                       # Additional endpoint stubs
```

## Permission Structure

Each permission follows the format: `{resource}:{action}:{scope}`

### Resources

- `user` - User management
- `contract` - Contract operations
- `booking` - Booking management
- `company` - Company operations
- `promoter` - Promoter profiles
- `party` - Contract parties
- `role` - Role management
- `permission` - Permission management

### Actions

- `read` - View resources
- `create` - Create new resources
- `edit` - Modify existing resources
- `delete` - Remove resources
- `search` - Search/filter resources
- `export` - Export data
- `import` - Import data
- `approve` - Approve actions
- `reject` - Reject actions

### Scopes

- `own` - User's own resources only
- `organization` - Resources within user's organization
- `provider` - Resources within user's provider network
- `booking` - Resources related to user's bookings
- `public` - Public resources (minimal access)
- `all` - All resources (admin access)

## Implementation Patterns

### 1. Basic Permission Check

```typescript
const decision = await permissionEvaluator.evaluatePermission(
  userId,
  'user:read:own',
  { context: { user: { id: userId }, params, request } }
);

if (!decision.allowed) {
  return new Response('Forbidden', { status: 403 });
}
```

### 2. Multiple Permission Check

```typescript
// Check if user has ANY of the required permissions
const decision = await permissionEvaluator.hasAnyPermission(
  userId,
  ['user:read:own', 'user:read:organization'],
  { context: { user: { id: userId }, params, request } }
);

// Check if user has ALL required permissions
const decision = await permissionEvaluator.hasAllPermissions(
  userId,
  ['user:read:own', 'user:write:own'],
  { context: { user: { id: userId }, params, request } }
);
```

### 3. Context-Based Permissions

```typescript
const context = {
  user: { id: userId, organization_id: userOrgId },
  params,
  resourceType: 'contract',
  resourceId: contractId,
  request,
};

const decision = await permissionEvaluator.evaluatePermission(
  userId,
  'contract:read:organization',
  { context }
);
```

## Testing Guidelines

### 1. Test Permission Levels

```typescript
describe('User Endpoint RBAC', () => {
  it('should deny access without permissions', async () => {
    // Test with user having no permissions
    const decision = await permissionEvaluator.evaluatePermission(
      'user-no-perms',
      'user:read:own'
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('NO_BASE_PERMISSION');
  });

  it('should allow access with own scope', async () => {
    // Test with user having own scope permission
    const decision = await permissionEvaluator.evaluatePermission(
      'user-own-perms',
      'user:read:own',
      {
        context: {
          user: { id: 'user-own-perms' },
          resourceId: 'user-own-perms',
        },
      }
    );

    expect(decision.allowed).toBe(true);
  });
});
```

### 2. Test Different Scopes

```typescript
it('should allow broader scope access', async () => {
  // User has 'all' scope but requests 'own' scope
  const decision = await permissionEvaluator.evaluatePermission(
    'admin-user',
    'user:read:own'
  );

  expect(decision.allowed).toBe(true);
  expect(decision.reason).toContain('Broader scope permission');
});
```

## Customization

### 1. Adjust Permission Scopes

Modify the `SCOPE_SUGGESTIONS` in the generator script:

```javascript
const SCOPE_SUGGESTIONS = {
  'user:read': ['own', 'organization', 'all'],
  'user:write': ['own', 'organization', 'all'],
  'user:delete': ['all'], // Only admins can delete users
  // ... add more custom mappings
};
```

### 2. Add New Resource Types

Extend the `RESOURCE_MAPPING`:

```javascript
const RESOURCE_MAPPING = {
  // ... existing mappings
  invoices: 'invoice',
  payments: 'payment',
  reports: 'report',
};
```

### 3. Custom Permission Actions

Add new actions to `PERMISSION_TEMPLATES`:

```javascript
const PERMISSION_TEMPLATES = {
  // ... existing templates
  APPROVE: 'approve',
  REJECT: 'reject',
  ARCHIVE: 'archive',
  RESTORE: 'restore',
};
```

## Performance Considerations

### 1. Permission Caching

The RBAC system automatically caches user permissions:

```typescript
// Cache is enabled by default
const decision = await permissionEvaluator.evaluatePermission(
  userId,
  'user:read:own'
);

// Bypass cache when needed (e.g., after role changes)
const decision = await permissionEvaluator.evaluatePermission(
  userId,
  'user:read:own',
  { skipCache: true }
);
```

### 2. Redis Integration

Enable Redis for distributed caching:

```bash
# .env
REDIS_URL=redis://localhost:6379
RBAC_CACHE_TTL=900000
RBAC_CACHE_MAX_SIZE=1000
```

### 3. Audit Logging

All permission decisions are automatically logged:

```typescript
// Audit is enabled by default
const decision = await permissionEvaluator.evaluatePermission(
  userId,
  'user:read:own'
);

// Skip audit for internal checks
const decision = await permissionEvaluator.evaluatePermission(
  userId,
  'user:read:own',
  { skipAudit: true }
);
```

## Monitoring and Maintenance

### 1. Permission Statistics

```typescript
import { permissionCache } from '@/lib/rbac/cache';

// Get cache statistics
const stats = permissionCache.getStats();
console.log('Cache stats:', stats);
```

### 2. Audit Log Analysis

```typescript
import { auditLogger } from '@/lib/rbac/audit';

// Get audit statistics
const stats = await auditLogger.getAuditStats();
console.log('Audit stats:', stats);

// Get recent permission checks
const logs = await auditLogger.getAuditLogsByType('PERMISSION_CHECK', 100, 0);
```

### 3. Cache Invalidation

```typescript
import { permissionCache } from '@/lib/rbac/cache';

// Invalidate specific user
await permissionCache.invalidateUser('user123');

// Invalidate all users (e.g., after role changes)
await permissionCache.invalidateAll();
```

## Troubleshooting

### Common Issues

1. **Permission Denied Unexpectedly**
   - Check if user has the required permission
   - Verify permission format (resource:action:scope)
   - Check context parameters for scope-based permissions

2. **Cache Issues**
   - Clear cache: `await permissionCache.invalidateAll()`
   - Check Redis connection if enabled
   - Verify cache TTL settings

3. **Audit Logging Failures**
   - Check database connection
   - Verify audit_logs table exists
   - Check table schema matches expected format

### Debug Mode

Enable debug logging:

```typescript
// Add to your endpoint for debugging
console.log('Permission decision:', decision);
console.log('User permissions:', decision.user_permissions);
console.log('User roles:', decision.user_roles);
```

## Next Steps

1. **Review Generated Stubs** - Understand what needs to be implemented
2. **Implement Permission Checks** - Add RBAC protection to endpoints
3. **Test Thoroughly** - Verify different permission levels work correctly
4. **Monitor Performance** - Watch cache hit rates and response times
5. **Review Audit Logs** - Ensure permission decisions are being logged
6. **Iterate and Improve** - Refine permission scopes based on usage

## Support

For questions or issues with RBAC implementation:

- Check the generated endpoint stubs for examples
- Review the RBAC system documentation
- Test with the provided test suite
- Monitor audit logs for permission decision details

## Related Documentation

- [RBAC System Overview](../rbac-system.md)
- [Permission Evaluation Guide](../rbac-permissions.md)
- [Audit Logging Guide](../rbac-audit.md)
- [Cache Management Guide](../rbac-cache.md)
- [Testing Guidelines](../rbac-testing.md)
