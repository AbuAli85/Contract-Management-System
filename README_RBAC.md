# 🛡️ RBAC Implementation - Contract Management System

## 🚀 Quick Start

```bash
# 1. Apply database migrations
npm run rbac:migrate

# 2. Seed RBAC data
npm run rbac:seed

# 3. Test the system
npm run rbac:test

# 4. Start development (dry-run mode)
RBAC_ENFORCEMENT=dry-run npm run dev

# 5. View test coverage
npm test -- --coverage --testPathPattern=rbac
```

## 📋 What's Been Implemented

### ✅ **COMPLETE** - Database & Schema
- **Migration**: `supabase/migrations/20250120_rbac_schema.sql`
- **Tables**: `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `audit_logs`
- **Materialized View**: `user_permissions` for optimized lookups
- **Indexes**: Strategic indexing for performance
- **RLS Policies**: Row-level security enabled
- **Functions**: Built-in permission checking functions

### ✅ **COMPLETE** - Seed Data
- **File**: `scripts/seed_rbac.sql`
- **Roles**: 12 predefined roles (Client, Provider, Admin families)
- **Permissions**: 80+ granular permissions
- **Mappings**: Complete role-permission assignments
- **Idempotent**: Safe to re-run

### ✅ **COMPLETE** - Core RBAC Engine
- **Permissions**: `lib/rbac/permissions.ts` - Parsing & validation
- **Cache**: `lib/rbac/cache.ts` - 15-min TTL + Redis support
- **Audit**: `lib/rbac/audit.ts` - Comprehensive logging
- **Context**: `lib/rbac/context/ownership.ts` - Resource ownership
- **Evaluation**: `lib/rbac/evaluate.ts` - Permission engine
- **Guard**: `lib/rbac/guard.ts` - Main protection functions

### ✅ **COMPLETE** - Admin APIs
- **Roles**: `app/api/admin/roles/route.ts` - Role management
- **User Roles**: `app/api/admin/users/[userId]/roles/route.ts` - Assignments
- **Protected**: All endpoints require appropriate permissions
- **Audit**: Role changes are logged

### ✅ **COMPLETE** - Documentation
- **Main Guide**: `docs/rbac.md` - Complete system overview
- **API Mapping**: `docs/rbac_endpoint_mapping.md` - Endpoint permissions
- **Project Map**: `docs/rbac_project_map.md` - Architecture overview
- **Examples**: Usage patterns and best practices

### ✅ **COMPLETE** - Testing & Scripts
- **Tests**: Comprehensive test suite covering all RBAC components
  - `tests/rbac/permissions.spec.ts` - Permission parsing & validation
  - `tests/rbac/db.idempotency.spec.ts` - Database idempotency
  - `tests/rbac/modes.spec.ts` - Enforcement modes
  - `tests/rbac/scopes.integration.spec.ts` - Permission scope validation
  - `tests/rbac/cache.spec.ts` - Caching mechanisms
  - `tests/rbac/audit.spec.ts` - Audit logging
  - `tests/rbac/perf.sanity.spec.ts` - Performance validation
- **Scripts**: NPM commands for RBAC operations
- **Coverage**: ≥85% test coverage target for `lib/rbac/**`

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Routes    │    │   RBAC Guard    │    │  Permission     │
│                 │───▶│                 │───▶│   Evaluator     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Permission    │    │   Context      │
                       │     Cache       │    │  Evaluator     │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   Audit        │
                       │   (Supabase)    │    │   Logger       │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
RBAC_ENFORCEMENT=dry-run    # dry-run | enforce | disabled

# Optional
REDIS_URL=redis://localhost:6379
```

### Enforcement Modes

- **`dry-run`** (default): Logs permission checks, allows all requests
- **`enforce`**: Strictly enforces permissions, blocks unauthorized access
- **`disabled`**: RBAC system completely disabled

## 📚 Usage Examples

### Basic Permission Check

```typescript
import { checkPermission } from '@/lib/rbac/guard'

const result = await checkPermission('user:view:own', {
  context: {
    user: { id: 'user-123' },
    params: { id: 'user-123' },
    resourceType: 'user',
    resourceId: 'user-123'
  }
})

if (result.allowed) {
  // User has permission
} else {
  // Access denied
}
```

### API Route Protection

```typescript
import { withRBAC } from '@/lib/rbac/guard'

export const GET = withRBAC('user:read:all', async (request) => {
  // Your handler code here
  return NextResponse.json({ data: 'protected' })
})
```

### Context-Based Permissions

```typescript
const result = await checkPermission('booking:edit:provider', {
  context: {
    user: { id: 'user-123', provider_id: 'provider-456' },
    params: { bookingId: 'booking-789' },
    resourceType: 'booking',
    resourceId: 'booking-789'
  }
})
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Roles and permissions
roles                    -- Role definitions
permissions             -- Permission definitions  
role_permissions        -- Role-permission mappings

-- User assignments
user_role_assignments   -- User-role assignments with temporal validity

-- Audit and performance
audit_logs              -- Comprehensive audit trail
user_permissions        -- Materialized view for fast lookups
```

### Key Features

- **Temporal Validity**: Role assignments can expire
- **Audit Trail**: All permission checks and role changes logged
- **Performance**: Materialized views and strategic indexing
- **Security**: Row-level security policies

## 🔐 Permission Model

### Format: `{resource}:{action}:{scope}`

**Examples:**
- `user:view:own` - View own user profile
- `service:create:own` - Create own services
- `booking:view:all` - View all bookings
- `role:assign:all` - Assign roles to any user

### Scopes

| Scope | Description | Example |
|-------|-------------|---------|
| `own` | User owns the resource | User's own profile |
| `provider` | Same provider organization | Provider's services |
| `organization` | Same company | Company resources |
| `booking` | Booking participants | Booking access |
| `public` | Publicly accessible | Service discovery |
| `all` | System-wide access | Admin operations |

## 👥 Role Families

### Client Roles
- **Basic Client**: Core booking and discovery
- **Premium Client**: Enhanced features + MFA
- **Enterprise Client**: Multi-user management
- **Client Administrator**: Organization management

### Provider Roles
- **Individual Provider**: Service management
- **Provider Team Member**: Limited access
- **Provider Manager**: Team and financial management
- **Provider Administrator**: Organization management

### Admin Roles
- **Support Agent**: User and system access
- **Content Moderator**: Content moderation
- **Platform Administrator**: Full platform management
- **System Administrator**: Complete system access

## 🚀 Getting Started

### 1. Database Setup

```bash
# Apply migrations
npm run rbac:migrate

# Seed initial data
npm run rbac:seed
```

### 2. Environment Configuration

```bash
# .env.local
RBAC_ENFORCEMENT=dry-run
REDIS_URL=redis://localhost:6379  # Optional
```

### 3. Test the System

```bash
# Run tests
npm run rbac:test

# Start development
npm run dev
```

### 4. Monitor Logs

```bash
# Check RBAC logs
grep "🔐 RBAC" logs/application.log

# Monitor permission checks
tail -f logs/application.log | grep "PERMISSION_CHECK"
```

## 📊 Monitoring & Metrics

### Audit Statistics

```typescript
import { auditLogger } from '@/lib/rbac/audit'

const stats = await auditLogger.getAuditStats()
console.log(`Total logs: ${stats.total_logs}`)
console.log(`Allow rate: ${stats.allow_count / stats.total_logs * 100}%`)
```

### Cache Performance

```typescript
import { permissionCache } from '@/lib/rbac/cache'

const stats = permissionCache.getStats()
console.log(`Cached users: ${stats.totalCachedUsers}`)
console.log(`Redis enabled: ${stats.redisEnabled}`)
```

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check user has required role
   - Verify role has required permission
   - Check permission scope matches context

2. **Cache Issues**
   - Clear user cache: `permissionCache.invalidateUser(userId)`
   - Refresh materialized view: `SELECT refresh_user_permissions()`

3. **Performance Issues**
   - Check materialized view is current
   - Monitor cache hit rates
   - Verify database indexes

### Debug Commands

```sql
-- Check user permissions
SELECT * FROM get_user_permissions('user-uuid');

-- Verify materialized view
SELECT * FROM user_permissions WHERE user_id = 'user-uuid';

-- Check audit logs
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

## 📈 Rollout Plan

### Phase 1: Dry-Run (Current)
- ✅ RBAC system logs all permission checks
- ✅ No requests are blocked
- ✅ Monitor permission usage patterns

### Phase 2: Gradual Enforcement
- 🔄 Enable enforcement for non-critical endpoints
- 🔄 Monitor deny rates and user impact
- 🔄 Adjust permissions based on usage data

### Phase 3: Full Enforcement
- 🔄 All endpoints protected by RBAC
- 🔄 Regular permission audits
- 🔄 Performance monitoring and optimization

### Rollback Plan

```bash
# Disable RBAC enforcement
export RBAC_ENFORCEMENT=disabled

# Or set in .env file
RBAC_ENFORCEMENT=disabled
```

## 🧪 Testing

### Run Tests

```bash
# All RBAC tests
npm run rbac:test

# Specific test file
npm test tests/rbac/permissions.spec.ts

# With coverage
npm run test:coverage
```

### Test Scenarios

- Permission parsing and validation
- Scope hierarchy and inheritance
- Context-based permission evaluation
- Cache performance and invalidation
- Audit logging and metrics

## 📚 Additional Resources

### Documentation
- **Main Guide**: `docs/rbac.md`
- **API Reference**: `docs/rbac_endpoint_mapping.md`
- **Architecture**: `docs/rbac_project_map.md`

### Code Examples
- **Basic Usage**: See `lib/rbac/guard.ts`
- **Context Evaluation**: See `lib/rbac/context/ownership.ts`
- **Admin APIs**: See `app/api/admin/`

### Database Operations
- **Manual Queries**: See `scripts/seed_rbac.sql`
- **Functions**: Built-in database functions
- **Triggers**: Automatic materialized view refresh

## 🤝 Contributing

### Adding New Permissions

1. **Define permission** in database
2. **Assign to roles** as needed
3. **Update endpoint mapping** documentation
4. **Test permission enforcement**
5. **Update this README**

### Adding New Endpoints

1. **Define required permission** using format
2. **Implement permission check** using `withRBAC()`
3. **Add to endpoint mapping** documentation
4. **Test in both modes** (dry-run/enforce)

## 📞 Support

For RBAC-related issues:

1. Check audit logs for permission failures
2. Verify user role assignments
3. Check materialized view is current
4. Review cache performance metrics
5. Consult troubleshooting guide above

## 🔮 Future Enhancements

- **Dynamic Permissions**: Runtime permission creation
- **Permission Inheritance**: Hierarchical structures
- **Advanced Scoping**: Time and location-based permissions
- **Machine Learning**: Automated permission optimization
- **SSO Integration**: External identity providers

---

**🎉 Congratulations!** You now have a production-grade RBAC system that provides:

- **Security**: Fine-grained access control
- **Performance**: Optimized caching and database queries
- **Audit**: Comprehensive logging and monitoring
- **Flexibility**: Easy to extend and customize
- **Compliance**: Enterprise-grade security features

The system is ready for production use and can be gradually enforced as your team becomes comfortable with the permission model.
