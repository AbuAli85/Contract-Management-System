# 🛡️ RBAC Project Map

## Overview

This document provides a comprehensive map of the RBAC system implementation across the Contract Management System codebase.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Caching**: Redis (optional) + In-Memory
- **Testing**: Jest
- **Deployment**: Vercel

## Project Structure

```
Contract-Management-System/
├── supabase/
│   └── migrations/
│       └── 20250120_rbac_schema.sql          # RBAC database schema
├── scripts/
│   └── seed_rbac.sql                         # RBAC seed data
├── lib/
│   └── rbac/                                 # RBAC core implementation
│       ├── permissions.ts                    # Permission parsing & validation
│       ├── cache.ts                          # Permission caching (Redis + Memory)
│       ├── audit.ts                          # Audit logging
│       ├── context/
│       │   └── ownership.ts                  # Resource ownership evaluation
│       ├── evaluate.ts                       # Permission evaluation engine
│       └── guard.ts                          # Main RBAC guard functions
├── app/
│   └── api/
│       └── admin/                            # Admin API endpoints
│           ├── roles/
│           │   └── route.ts                  # Role management
│           └── users/
│               └── [userId]/
│                   └── roles/
│                       └── route.ts          # User role assignment
├── docs/
│   ├── rbac.md                               # Main RBAC documentation
│   ├── rbac_endpoint_mapping.md              # API endpoint permissions
│   └── rbac_project_map.md                   # This file
└── package.json                               # RBAC npm scripts
```

## Core Components

### 1. Database Layer (`supabase/migrations/`)

**File**: `20250120_rbac_schema.sql`

**Purpose**: Defines the complete RBAC database schema

**Key Tables**:
- `roles` - Role definitions with categories
- `permissions` - Granular permissions (resource:action:scope)
- `role_permissions` - Role-permission mappings
- `user_role_assignments` - User-role assignments with temporal validity
- `audit_logs` - Comprehensive audit trail
- `user_permissions` - Materialized view for performance

**Features**:
- Row Level Security (RLS) policies
- Automatic triggers for materialized view refresh
- Optimized indexes for fast lookups
- Built-in functions for common operations

### 2. Seed Data (`scripts/`)

**File**: `seed_rbac.sql`

**Purpose**: Populates the RBAC system with initial roles and permissions

**Content**:
- 12 predefined roles (Client, Provider, Admin families)
- 80+ granular permissions covering all system resources
- Role-permission mappings for each role family
- Idempotent design (safe to re-run)

### 3. Permission Engine (`lib/rbac/`)

#### `permissions.ts`
- Permission string parsing and validation
- Scope hierarchy management
- Permission pattern matching
- Input validation and sanitization

#### `cache.ts`
- 15-minute TTL permission caching
- Redis integration (optional)
- Memory cache fallback
- Automatic cleanup and invalidation

#### `audit.ts`
- Comprehensive audit logging
- Permission check tracking
- Role change logging
- IP address and user agent capture

#### `context/ownership.ts`
- Resource ownership evaluation
- Organization and provider access checking
- Dynamic permission context evaluation
- Support for all resource types

#### `evaluate.ts`
- Main permission evaluation engine
- Context-based permission checking
- Scope hierarchy resolution
- Performance optimization

#### `guard.ts`
- API route protection functions
- Higher-order function wrappers
- Enforcement mode handling (dry-run/enforce)
- Integration with Next.js App Router

### 4. Admin APIs (`app/api/admin/`)

#### `roles/route.ts`
- **GET**: List all roles with permissions and user counts
- **POST**: Create new roles
- **Required**: `role:read:all`, `role:create:all`

#### `users/[userId]/roles/route.ts`
- **GET**: Get user's current roles
- **POST**: Assign role to user
- **DELETE**: Remove role from user
- **Required**: `user:read:all`, `role:assign:all`

### 5. Documentation (`docs/`)

#### `rbac.md`
- Complete system overview
- Usage examples and best practices
- Configuration and deployment guide
- Troubleshooting and support

#### `rbac_endpoint_mapping.md`
- Comprehensive API endpoint mapping
- Required permissions for each endpoint
- Implementation notes and examples

#### `rbac_project_map.md`
- This file - system architecture overview
- Component relationships and dependencies
- Development and deployment workflow

## Integration Points

### 1. Authentication System

**Integration**: Supabase Auth
**Location**: `lib/supabase/server.ts`
**Purpose**: User authentication and session management

**RBAC Integration**:
```typescript
import { createClient } from '@/lib/supabase/server'
const { data: { user } } = await supabase.auth.getUser()
```

### 2. Existing Auth Middleware

**Integration**: Professional Security Middleware
**Location**: `lib/auth/professional-security-middleware.ts`
**Purpose**: Existing authentication and authorization

**RBAC Integration**:
```typescript
import { checkPermission } from '@/lib/rbac/guard'
// Delegate permission checks to RBAC system
```

### 3. Database Operations

**Integration**: Supabase Client
**Location**: Throughout RBAC system
**Purpose**: Database queries and operations

**Key Operations**:
- User permission lookups
- Role assignments
- Audit logging
- Materialized view management

### 4. API Route Protection

**Integration**: Next.js App Router
**Location**: All protected API routes
**Purpose**: Route-level permission enforcement

**Implementation**:
```typescript
import { withRBAC } from '@/lib/rbac/guard'
export const GET = withRBAC('user:read:all', handler)
```

## Data Flow

### 1. Permission Check Flow

```
User Request → Auth Check → Permission Evaluation → Context Evaluation → Cache Lookup → Database Query → Response
```

### 2. Role Assignment Flow

```
Admin Action → Permission Check → Role Assignment → Cache Invalidation → Materialized View Refresh → Audit Log
```

### 3. Cache Management Flow

```
Permission Request → Cache Check → Database Query → Cache Update → Response
```

## Security Features

### 1. Row Level Security (RLS)

- **Tables**: All RBAC tables have RLS enabled
- **Policies**: Admin-only access to sensitive operations
- **User Access**: Users can only view their own data

### 2. Permission Validation

- **Format**: Strict `{resource}:{action}:{scope}` validation
- **Scope Hierarchy**: Enforced scope relationships
- **Context Validation**: Resource ownership verification

### 3. Audit Trail

- **Comprehensive Logging**: All permission checks logged
- **Role Changes**: Tracked with attribution
- **Security Events**: IP address and user agent capture

## Performance Optimizations

### 1. Caching Strategy

- **Memory Cache**: Fast in-memory storage
- **Redis Cache**: Distributed caching support
- **TTL Management**: 15-minute expiration
- **Smart Invalidation**: User-specific cache clearing

### 2. Database Optimization

- **Materialized Views**: Pre-computed permission lookups
- **Strategic Indexes**: Optimized query performance
- **Function Calls**: Efficient permission checking
- **Trigger Management**: Automatic view refresh

### 3. Query Optimization

- **Batch Operations**: Efficient bulk operations
- **Connection Pooling**: Supabase connection management
- **Error Handling**: Graceful degradation

## Development Workflow

### 1. Adding New Permissions

```sql
-- 1. Define permission
INSERT INTO permissions (resource, action, scope, name, description) VALUES
('invoice', 'view', 'own', 'invoice:view:own', 'View own invoices');

-- 2. Assign to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Basic Client' AND p.name = 'invoice:view:own';

-- 3. Refresh materialized view
SELECT refresh_user_permissions();
```

### 2. Adding New Endpoints

```typescript
// 1. Define required permission
const requiredPermission = 'invoice:view:own'

// 2. Implement permission check
import { withRBAC } from '@/lib/rbac/guard'
export const GET = withRBAC(requiredPermission, handler)

// 3. Update endpoint mapping
// Add to docs/rbac_endpoint_mapping.md
```

### 3. Testing RBAC

```bash
# 1. Run migrations
npm run rbac:migrate

# 2. Seed data
npm run rbac:seed

# 3. Test permissions
npm run rbac:test

# 4. Check enforcement
RBAC_ENFORCEMENT=enforce npm run dev
```

## Deployment Considerations

### 1. Environment Variables

```bash
# Required
RBAC_ENFORCEMENT=dry-run    # dry-run | enforce | disabled

# Optional
REDIS_URL=redis://localhost:6379
```

### 2. Database Migration

```bash
# Production deployment
supabase db push

# Development
npm run rbac:migrate
```

### 3. Data Seeding

```bash
# Initial setup
npm run rbac:seed

# Re-seed if needed
supabase db query < scripts/seed_rbac.sql
```

## Monitoring and Maintenance

### 1. Performance Monitoring

- **Cache Hit Rates**: Monitor cache effectiveness
- **Query Performance**: Database query optimization
- **Response Times**: API endpoint performance
- **Resource Usage**: Memory and CPU utilization

### 2. Security Monitoring

- **Permission Denials**: Track access failures
- **Role Changes**: Monitor administrative actions
- **Audit Logs**: Review security events
- **Anomaly Detection**: Unusual access patterns

### 3. Regular Maintenance

- **Cache Cleanup**: Remove expired entries
- **Materialized View Refresh**: Keep data current
- **Permission Reviews**: Regular access audits
- **Role Optimization**: Permission consolidation

## Troubleshooting Guide

### 1. Common Issues

- **Permission Denied**: Check user roles and permissions
- **Cache Issues**: Verify cache invalidation
- **Performance**: Check materialized view status
- **Database Errors**: Verify table structure and indexes

### 2. Debug Commands

```sql
-- Check user permissions
SELECT * FROM get_user_permissions('user-uuid');

-- Verify materialized view
SELECT * FROM user_permissions WHERE user_id = 'user-uuid';

-- Check audit logs
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

### 3. Log Analysis

```bash
# Check RBAC logs
grep "🔐 RBAC" logs/application.log

# Monitor permission checks
tail -f logs/application.log | grep "PERMISSION_CHECK"
```

## Future Enhancements

### 1. Planned Features

- **Dynamic Permissions**: Runtime permission creation
- **Permission Inheritance**: Hierarchical structures
- **Advanced Scoping**: Time and location-based permissions
- **Machine Learning**: Automated optimization

### 2. Integration Opportunities

- **SSO Integration**: External identity providers
- **API Gateway**: Centralized permission management
- **Microservices**: Distributed permission checking
- **Event Streaming**: Real-time permission updates

### 3. Performance Improvements

- **Advanced Caching**: Multi-level cache strategies
- **Query Optimization**: Further database tuning
- **Async Processing**: Background permission updates
- **CDN Integration**: Edge permission checking

## Support and Resources

### 1. Documentation

- **Main Guide**: `docs/rbac.md`
- **API Reference**: `docs/rbac_endpoint_mapping.md`
- **Architecture**: `docs/rbac_project_map.md`

### 2. Code Examples

- **Basic Usage**: See `lib/rbac/guard.ts`
- **Context Evaluation**: See `lib/rbac/context/ownership.ts`
- **Admin APIs**: See `app/api/admin/`

### 3. Testing

- **Unit Tests**: `tests/rbac/`
- **Integration Tests**: API endpoint testing
- **Performance Tests**: Load testing scripts

### 4. Community

- **Issues**: GitHub issue tracker
- **Discussions**: GitHub discussions
- **Contributions**: Pull request guidelines
