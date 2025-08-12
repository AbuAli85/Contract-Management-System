<<<<<<< Updated upstream

# 🛡️ RBAC (Role-Based Access Control) System

## Overview

The RBAC system provides fine-grained access control using a `{resource}:{action}:{scope}` permission model. It's designed to be secure, performant, and easy to manage.

## Architecture

### Core Components

- **Permissions**: Granular access control with resource, action, and scope
- **Roles**: Collections of permissions organized by user type
- **Role Assignments**: User-role mappings with temporal validity
- **Context Evaluators**: Dynamic permission checking based on resource ownership
- **Permission Cache**: 15-minute TTL with Redis support
- **Audit Logging**: Comprehensive tracking of all permission checks and role changes

### Permission Format

```
{resource}:{action}:{scope}
```

**Examples:**

- `user:view:own` - View own user profile
- `service:create:own` - Create own services
- `booking:view:all` - View all bookings
- `role:assign:all` - Assign roles to any user

### Scopes

| Scope          | Description                    | Example              |
| -------------- | ------------------------------ | -------------------- |
| `own`          | User owns the resource         | User's own profile   |
| `provider`     | User is in same provider org   | Provider's services  |
| `organization` | User is in same organization   | Company resources    |
| `booking`      | User has access to the booking | Booking participants |
| `public`       | Publicly accessible            | Service discovery    |
| `all`          | System-wide access             | Admin operations     |

## Role Families

### Client Roles

- **Basic Client**: Core booking and service discovery
- **Premium Client**: Enhanced features + MFA
- **Enterprise Client**: Multi-user management
- **Client Administrator**: Organization management

### Provider Roles

- **Individual Provider**: Service management and bookings
- **Provider Team Member**: Limited service access
- **Provider Manager**: Team and financial management
- **Provider Administrator**: Organization management

### Admin Roles

- **Support Agent**: User and system access
- **Content Moderator**: Content and communication moderation
- **Platform Administrator**: Full platform management
- **System Administrator**: Complete system access

## Implementation

### Database Schema

The RBAC system uses these core tables:

```sql
-- Core tables
roles                    -- Role definitions
permissions             -- Permission definitions
role_permissions        -- Role-permission mappings
user_role_assignments   -- User-role assignments
audit_logs              -- Permission and role change logs

-- Materialized view for performance
user_permissions        -- Optimized permission lookups
```

### Key Features

- **Temporal Validity**: Role assignments can have expiration dates
- **Context-Aware**: Permissions respect resource ownership
- **Audit Trail**: All permission checks and role changes are logged
- **Performance**: Materialized views and caching for fast lookups
- **Flexibility**: Easy to add new resources, actions, and scopes

## Usage

### Basic Permission Check

```typescript
import { checkPermission } from '@/lib/rbac/guard';

// Check if user has permission
const result = await checkPermission('user:view:own', {
  context: {
    user: { id: 'user-123' },
    params: { id: 'user-123' },
    resourceType: 'user',
    resourceId: 'user-123',
  },
});

if (result.allowed) {
  // User has permission
} else {
  // Access denied
}
```

### API Route Protection

```typescript
import { withRBAC } from '@/lib/rbac/guard';

// Protect API route
export const GET = withRBAC('user:read:all', async request => {
  // Your handler code here
  return NextResponse.json({ data: 'protected' });
});
```

### Context-Based Permissions

```typescript
import { checkPermission } from '@/lib/rbac/guard';

const result = await checkPermission('booking:edit:provider', {
  context: {
    user: { id: 'user-123', provider_id: 'provider-456' },
    params: { bookingId: 'booking-789' },
    resourceType: 'booking',
    resourceId: 'booking-789',
  },
});
```

## Configuration

### Environment Variables

```bash
# RBAC Enforcement Mode
RBAC_ENFORCEMENT=dry-run    # dry-run | enforce | disabled
# Default: dry-run

# Redis Cache (optional)
REDIS_URL=redis://localhost:6379
```

### Enforcement Modes

- **`dry-run`**: Logs permission checks but allows all requests
- **`enforce`**: Strictly enforces permissions, blocks unauthorized access
- **`disabled`**: RBAC system is completely disabled

## Commands

### Database Operations

```bash
# Apply RBAC migrations
npm run rbac:migrate

# Seed RBAC data
npm run rbac:seed

# Run RBAC tests
npm run rbac:test

# Update documentation
npm run rbac:docs
```

### Manual Database Operations

```sql
-- Refresh materialized view
SELECT refresh_user_permissions();

-- Check user permissions
SELECT * FROM get_user_permissions('user-uuid');

-- Check specific permission
SELECT has_permission('user-uuid', 'user', 'view', 'own');
```

## Adding New Permissions

### 1. Define Permission

```sql
INSERT INTO permissions (resource, action, scope, name, description) VALUES
('invoice', 'view', 'own', 'invoice:view:own', 'View own invoices');
```

### 2. Assign to Roles

```sql
-- Assign to Basic Client role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Basic Client' AND p.name = 'invoice:view:own';
```

### 3. Update Materialized View

```sql
SELECT refresh_user_permissions();
```

## Monitoring and Auditing

### Audit Logs

All permission checks and role changes are logged to `audit_logs`:

- **Permission Checks**: ALLOW/DENY/WOULD_BLOCK results
- **Role Changes**: Assignment and revocation tracking
- **Context**: IP address, user agent, timestamps

### Metrics

```typescript
import { auditLogger } from '@/lib/rbac/audit';

// Get audit statistics
const stats = await auditLogger.getAuditStats();
console.log(`Total logs: ${stats.total_logs}`);
console.log(`Allow rate: ${(stats.allow_count / stats.total_logs) * 100}%`);
```

### Cache Statistics

```typescript
import { permissionCache } from '@/lib/rbac/cache';

// Get cache performance metrics
const stats = permissionCache.getStats();
console.log(`Cached users: ${stats.totalCachedUsers}`);
console.log(`Redis enabled: ${stats.redisEnabled}`);
```

## Security Considerations

### Default Deny

- Users have no permissions by default
- All access must be explicitly granted
- Role assignments are validated and audited

### Principle of Least Privilege

- Users receive only necessary permissions
- Scopes are as restrictive as possible
- Regular permission reviews recommended

### Audit Trail

- All permission checks are logged
- Role changes are tracked with attribution
- Logs include IP addresses and user agents

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check user has required role
   - Verify role has required permission
   - Check permission scope matches context

2. **Cache Issues**
   - Clear user cache: `permissionCache.invalidateUser(userId)`
   - Refresh materialized view: `SELECT refresh_user_permissions()`

3. **Performance Issues**
   - Check materialized view is up to date
   - Monitor cache hit rates
   - Verify database indexes are present

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
DEBUG=rbac:*

// Or in code
console.log('🔐 RBAC: Debug mode enabled')
```

## Rollout Plan

### Phase 1: Dry-Run (Current)

- RBAC system logs all permission checks
- No requests are blocked
- Monitor permission usage patterns

### Phase 2: Gradual Enforcement

- Enable enforcement for non-critical endpoints
- Monitor deny rates and user impact
- Adjust permissions based on usage data

### Phase 3: Full Enforcement

- All endpoints protected by RBAC
- Regular permission audits
- Performance monitoring and optimization

### Rollback Plan

```bash
# Disable RBAC enforcement
export RBAC_ENFORCEMENT=disabled

# Or set in .env file
RBAC_ENFORCEMENT=disabled
```

## Support

For RBAC-related issues:

1. Check audit logs for permission failures
2. Verify user role assignments
3. Check materialized view is current
4. Review cache performance metrics

## Verification

### Running Tests

```bash
# Run all RBAC tests
npm run rbac:test

# Run specific test suites
npm test -- --testPathPattern=rbac/db.idempotency
npm test -- --testPathPattern=rbac/modes
npm test -- --testPathPattern=rbac/scopes.integration
npm test -- --testPathPattern=rbac/cache
npm test -- --testPathPattern=rbac/audit
npm test -- --testPathPattern=rbac/perf.sanity
```

### Test Coverage

The RBAC system includes comprehensive tests covering:

- **Database Idempotency**: Migrations and seeds are safe to re-run
- **Enforcement Modes**: dry-run, enforce, and disabled modes work correctly
- **Permission Scopes**: All scopes (own, provider, organization, booking, public, all) are validated
- **Caching**: Permission cache TTL and invalidation mechanisms
- **Audit Logging**: Complete audit trail for all RBAC operations
- **Performance**: Acceptable overhead and scalability characteristics

### Verification Checklist

- [ ] All tests pass (`npm run rbac:test`)
- [ ] Database migrations are idempotent
- [ ] Seed scripts can be re-run safely
- [ ] Enforcement modes work as expected
- [ ] Permission scopes are properly evaluated
- [ ] Cache invalidation works correctly
- [ ] Audit logging captures all events
- [ ] Performance overhead is acceptable

## Future Enhancements

- **Dynamic Permissions**: Runtime permission creation
- **Permission Inheritance**: Hierarchical permission structures
- **Advanced Scoping**: Time-based and location-based permissions
- **Machine Learning**: Automated permission optimization
- # **Integration**: SSO and external identity provider support

### RBAC Overview

- Permission format: `{resource}:{action}:{scope}` with scopes: own | provider | organization | booking | public | all
- Role categories: client | provider | admin
- Inheritance: higher roles include lower via seeds/mappings
- Feature flag: `RBAC_ENFORCEMENT=dry-run|enforce` (default dry-run)

Modules

- `lib/rbac/permissions.ts` — parse and types
- `lib/rbac/cache.ts` — MV-backed permission cache
- `lib/rbac/context/*` — ownership/provider/org/booking evaluators
- `lib/rbac/guard.ts` — `withRBAC()` wrapper for App Router handlers
- `lib/rbac/audit.ts` — audit logger

Schema

- Tables: `rbac_roles`, `rbac_permissions`, `rbac_role_permissions`, `rbac_user_role_assignments`, `rbac_audit_logs`
- MV: `rbac_user_permissions_mv` + refresh function `rbac_refresh_user_permissions_mv`

Commands

- rbac:migrate — include RBAC migration in normal pipeline (supabase migrate)
- rbac:seed — seeds roles/permissions and mappings
- rbac:test — run RBAC unit/integration tests (to be added)

Rollout

- Start with `RBAC_ENFORCEMENT=dry-run` for one full cycle; inspect `rbac_audit_logs`
- Flip to `enforce` once WOULD_BLOCK rates are acceptable
- Rollback: switch back to `dry-run`; schema is additive

How to extend

- Add new permission string → insert via seed using `rbac_upsert_permission`
- Map to roles → attach via `rbac_attach_permission`
- Guard endpoint → wrap handler with `withRBAC('resource:action:scope', handler)`

> > > > > > > Stashed changes
