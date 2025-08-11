# 🛡️ RBAC Drift Report

Generated: 2025-08-11T21:04:59.699Z

## 📊 Executive Summary

- **Total Seeded Permissions**: 97
- **Total Used in Code**: 39
- **Total in Documentation**: 87

## 🔴 P0 Critical Issues (Used in Code but NOT Seeded)

✅ No critical issues found

## 🟡 P2 Low Priority Issues

### Seeded but NOT Used in Code
- `user:edit:own`
- `user:view:all`
- `user:edit:all`
- `profile:view:own`
- `profile:edit:own`
- `profile:view:all`
- `profile:update:all`
- `auth:logout:own`
- `auth:refresh:own`
- `auth:impersonate:all`
- `security:mfa:own`
- `security:mfa:all`
- `service:view:own`
- `service:view:provider`
- `service:view:all`
- `service:edit:own`
- `service:delete:own`
- `service:moderate:all`
- `discovery:browse:public`
- `discovery:filter:public`
- `discovery:recommend:own`
- `booking:view:provider`
- `booking:view:all`
- `booking:create:own`
- `booking:edit:own`
- `booking:edit:provider`
- `booking:cancel:own`
- `booking:cancel:provider`
- `booking:approve:provider`
- `booking:reject:provider`
- `booking_lifecycle:pause:provider`
- `booking_lifecycle:resume:provider`
- `booking_lifecycle:complete:provider`
- `booking_lifecycle:extend:provider`
- `communication:receive:own`
- `communication:view:own`
- `communication:view:provider`
- `communication:moderate:all`
- `call:join:own`
- `call:record:provider`
- `call:view:own`
- `call:view:provider`
- `payment:view:provider`
- `payment:view:all`
- `payment:process:provider`
- `payment:refund:provider`
- `finance:view:own`
- `finance:view:provider`
- `finance:view:all`
- `finance:export:own`
- `finance:export:provider`
- `role:create:all`
- `role:edit:all`
- `role:delete:all`
- `role:revoke:all`
- `system:settings:all`
- `system:logs:all`
- `system:maintenance:all`

### Documented but NOT Implemented
- `{resource}:{action}:{scope}`
- `auth:login:public`
- `user:view:own`
- `profile:edit:all`
- `service:view:public`
- `discovery:search:public`
- `booking:view:own`
- `booking_lifecycle:start:provider`
- `communication:send:own`
- `call:initiate:own`
- `payment:view:own`
- `role:view:all`
- `system:view:all`
- `audit:view:all`
- `company:view:own`
- `company:view:all`
- `company:create:own`
- `company:edit:own`
- `company:delete:own`
- `promoter:view:own`
- `promoter:view:all`
- `promoter:create:own`
- `promoter:edit:own`
- `promoter:delete:own`
- `contract:view:own`
- `contract:edit:own`
- `contract:delete:own`
- `party:view:own`
- `party:create:own`
- `party:edit:own`
- `party:delete:own`
- `

### Audit Logging

All permission checks are logged with:

- User ID
- Required permission
- Result (ALLOW/DENY/WOULD_BLOCK)
- IP address
- User agent
- Timestamp
- Context information

## Adding New Endpoints

When adding new endpoints:

1. **Define required permission** using `

## 📋 Detailed Permission Analysis

### Seeded Permissions
- `analytics:read:all`
- `audit:read:all`
- `auth:impersonate:all`
- `auth:logout:own`
- `auth:refresh:own`
- `booking:approve:provider`
- `booking:cancel:own`
- `booking:cancel:provider`
- `booking:create:own`
- `booking:edit:own`
- `booking:edit:provider`
- `booking:reject:provider`
- `booking:view:all`
- `booking:view:provider`
- `booking_lifecycle:complete:provider`
- `booking_lifecycle:extend:provider`
- `booking_lifecycle:pause:provider`
- `booking_lifecycle:resume:provider`
- `call:join:own`
- `call:record:provider`
- `call:view:own`
- `call:view:provider`
- `communication:moderate:all`
- `communication:receive:own`
- `communication:view:own`
- `communication:view:provider`
- `company:manage:all`
- `company:read:all`
- `company:read:organization`
- `company:read:own`
- `contract:approve:all`
- `contract:create:own`
- `contract:download:own`
- `contract:generate:own`
- `contract:message:own`
- `contract:read:own`
- `contract:submit:own`
- `contract:update:own`
- `data:import:all`
- `data:seed:all`
- `discovery:browse:public`
- `discovery:filter:public`
- `discovery:recommend:own`
- `file:upload:own`
- `finance:export:own`
- `finance:export:provider`
- `finance:view:all`
- `finance:view:own`
- `finance:view:provider`
- `notification:create:own`
- `notification:read:organization`
- `notification:read:own`
- `party:read:own`
- `payment:process:provider`
- `payment:refund:provider`
- `payment:view:all`
- `payment:view:provider`
- `permission:manage:all`
- `profile:edit:own`
- `profile:read:all`
- `profile:read:own`
- `profile:update:all`
- `profile:update:own`
- `profile:view:all`
- `profile:view:own`
- `promoter:manage:own`
- `promoter:read:own`
- `role:assign:all`
- `role:create:all`
- `role:delete:all`
- `role:edit:all`
- `role:read:all`
- `role:revoke:all`
- `role:update:all`
- `security:mfa:all`
- `security:mfa:own`
- `service:create:own`
- `service:delete:own`
- `service:edit:own`
- `service:moderate:all`
- `service:update:own`
- `service:view:all`
- `service:view:own`
- `service:view:provider`
- `system:backup:all`
- `system:logs:all`
- `system:maintenance:all`
- `system:settings:all`
- `user:approve:all`
- `user:create:all`
- `user:delete:all`
- `user:edit:all`
- `user:edit:own`
- `user:read:all`
- `user:update:all`
- `user:view:all`
- `webhook:ingest:public`

### Used in Code
- `analytics:read:all`
- `audit:read:all`
- `company:manage:all`
- `company:read:all`
- `company:read:organization`
- `company:read:own`
- `contract:approve:all`
- `contract:create:own`
- `contract:download:own`
- `contract:generate:own`
- `contract:message:own`
- `contract:read:own`
- `contract:submit:own`
- `contract:update:own`
- `data:import:all`
- `data:seed:all`
- `file:upload:own`
- `notification:create:own`
- `notification:read:organization`
- `notification:read:own`
- `party:read:own`
- `permission:manage:all`
- `profile:read:all`
- `profile:read:own`
- `profile:update:own`
- `promoter:manage:own`
- `promoter:read:own`
- `role:assign:all`
- `role:read:all`
- `role:update:all`
- `service:create:own`
- `service:update:own`
- `system:backup:all`
- `user:approve:all`
- `user:create:all`
- `user:delete:all`
- `user:read:all`
- `user:update:all`
- `webhook:ingest:public`

### In Documentation
- `

### Audit Logging

All permission checks are logged with:

- User ID
- Required permission
- Result (ALLOW/DENY/WOULD_BLOCK)
- IP address
- User agent
- Timestamp
- Context information

## Adding New Endpoints

When adding new endpoints:

1. **Define required permission** using `
- `audit:view:all`
- `auth:impersonate:all`
- `auth:login:public`
- `auth:logout:own`
- `auth:refresh:own`
- `booking:approve:provider`
- `booking:cancel:own`
- `booking:cancel:provider`
- `booking:create:own`
- `booking:edit:own`
- `booking:edit:provider`
- `booking:reject:provider`
- `booking:view:own`
- `booking:view:provider`
- `booking_lifecycle:complete:provider`
- `booking_lifecycle:extend:provider`
- `booking_lifecycle:pause:provider`
- `booking_lifecycle:resume:provider`
- `booking_lifecycle:start:provider`
- `call:initiate:own`
- `call:join:own`
- `call:record:provider`
- `call:view:own`
- `call:view:provider`
- `communication:moderate:all`
- `communication:send:own`
- `communication:view:own`
- `communication:view:provider`
- `company:create:own`
- `company:delete:own`
- `company:edit:own`
- `company:view:all`
- `company:view:own`
- `contract:create:own`
- `contract:delete:own`
- `contract:edit:own`
- `contract:view:own`
- `discovery:browse:public`
- `discovery:filter:public`
- `discovery:recommend:own`
- `discovery:search:public`
- `finance:export:own`
- `finance:export:provider`
- `party:create:own`
- `party:delete:own`
- `party:edit:own`
- `party:view:own`
- `payment:process:provider`
- `payment:refund:provider`
- `payment:view:own`
- `payment:view:provider`
- `profile:edit:all`
- `profile:edit:own`
- `profile:view:all`
- `profile:view:own`
- `promoter:create:own`
- `promoter:delete:own`
- `promoter:edit:own`
- `promoter:view:all`
- `promoter:view:own`
- `role:assign:all`
- `role:create:all`
- `role:delete:all`
- `role:edit:all`
- `role:view:all`
- `security:mfa:all`
- `security:mfa:own`
- `service:create:own`
- `service:delete:own`
- `service:edit:own`
- `service:moderate:all`
- `service:view:own`
- `service:view:public`
- `system:backup:all`
- `system:logs:all`
- `system:maintenance:all`
- `system:settings:all`
- `system:view:all`
- `user:create:all`
- `user:delete:all`
- `user:edit:all`
- `user:edit:own`
- `user:read:all`
- `user:view:all`
- `user:view:own`
- `{resource}:{action}:{scope}`

## 🚨 Action Items

1. ✅ No immediate action required

2. **REVIEW**: Consider removing unused seeded permissions:
        - `user:edit:own`
        - `user:view:all`
        - `user:edit:all`
        - `profile:view:own`
        - `profile:edit:own`
        - `profile:view:all`
        - `profile:update:all`
        - `auth:logout:own`
        - `auth:refresh:own`
        - `auth:impersonate:all`
        - `security:mfa:own`
        - `security:mfa:all`
        - `service:view:own`
        - `service:view:provider`
        - `service:view:all`
        - `service:edit:own`
        - `service:delete:own`
        - `service:moderate:all`
        - `discovery:browse:public`
        - `discovery:filter:public`
        - `discovery:recommend:own`
        - `booking:view:provider`
        - `booking:view:all`
        - `booking:create:own`
        - `booking:edit:own`
        - `booking:edit:provider`
        - `booking:cancel:own`
        - `booking:cancel:provider`
        - `booking:approve:provider`
        - `booking:reject:provider`
        - `booking_lifecycle:pause:provider`
        - `booking_lifecycle:resume:provider`
        - `booking_lifecycle:complete:provider`
        - `booking_lifecycle:extend:provider`
        - `communication:receive:own`
        - `communication:view:own`
        - `communication:view:provider`
        - `communication:moderate:all`
        - `call:join:own`
        - `call:record:provider`
        - `call:view:own`
        - `call:view:provider`
        - `payment:view:provider`
        - `payment:view:all`
        - `payment:process:provider`
        - `payment:refund:provider`
        - `finance:view:own`
        - `finance:view:provider`
        - `finance:view:all`
        - `finance:export:own`
        - `finance:export:provider`
        - `role:create:all`
        - `role:edit:all`
        - `role:delete:all`
        - `role:revoke:all`
        - `system:settings:all`
        - `system:logs:all`
        - `system:maintenance:all`

3. **REVIEW**: Update documentation or implement missing permissions:
        - `{resource}:{action}:{scope}`
        - `auth:login:public`
        - `user:view:own`
        - `profile:edit:all`
        - `service:view:public`
        - `discovery:search:public`
        - `booking:view:own`
        - `booking_lifecycle:start:provider`
        - `communication:send:own`
        - `call:initiate:own`
        - `payment:view:own`
        - `role:view:all`
        - `system:view:all`
        - `audit:view:all`
        - `company:view:own`
        - `company:view:all`
        - `company:create:own`
        - `company:edit:own`
        - `company:delete:own`
        - `promoter:view:own`
        - `promoter:view:all`
        - `promoter:create:own`
        - `promoter:edit:own`
        - `promoter:delete:own`
        - `contract:view:own`
        - `contract:edit:own`
        - `contract:delete:own`
        - `party:view:own`
        - `party:create:own`
        - `party:edit:own`
        - `party:delete:own`
        - `

### Audit Logging

All permission checks are logged with:

- User ID
- Required permission
- Result (ALLOW/DENY/WOULD_BLOCK)
- IP address
- User agent
- Timestamp
- Context information

## Adding New Endpoints

When adding new endpoints:

1. **Define required permission** using `

## 🔧 How to Fix

### Add Missing Permissions
```sql
-- Add to scripts/seed_rbac.sql
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('resource', 'action', 'scope', 'permission:name', 'Description');
```

### Remove Unused Permissions
```sql
-- Remove from scripts/seed_rbac.sql
DELETE FROM permissions WHERE name = 'unused:permission:name';
```

### Update Documentation
Edit `docs/rbac_endpoint_mapping.md` to reflect actual implementation.

---
*Report generated by RBAC Drift Check script*
