<<<<<<< Updated upstream
# 🛡️ RBAC Endpoint Mapping

## Overview

This document maps API endpoints to their required RBAC permissions. All endpoints follow the `{resource}:{action}:{scope}` format.

## Authentication Endpoints

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/auth/login` | POST | `auth:login:public` | User login |
| `/api/auth/logout` | POST | `auth:logout:own` | User logout |
| `/api/auth/refresh` | POST | `auth:refresh:own` | Refresh token |
| `/api/auth/impersonate` | POST | `auth:impersonate:all` | Impersonate user |

## User Management

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/users` | GET | `user:read:all` | List all users |
| `/api/users` | POST | `user:create:all` | Create new user |
| `/api/users` | PUT | `user:update:all` | Bulk update users |
| `/api/users` | DELETE | `user:delete:all` | Bulk delete users |
| `/api/users/[id]` | GET | `user:view:own` or `user:view:all` | Get user profile |
| `/api/users/[id]` | PUT | `user:edit:own` or `user:edit:all` | Update user profile |
| `/api/users/[id]` | DELETE | `user:delete:all` | Delete user |
| `/api/users/[id]/profile` | GET | `profile:view:own` or `profile:view:all` | Get user profile |
| `/api/users/[id]/profile` | PUT | `profile:edit:own` or `profile:edit:all` | Update user profile |

## Service Management

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/services` | GET | `service:view:public` | List public services |
| `/api/services` | POST | `service:create:own` | Create new service |
| `/api/services/[id]` | GET | `service:view:public` or `service:view:own` | Get service details |
| `/api/services/[id]` | PUT | `service:edit:own` | Update service |
| `/api/services/[id]` | DELETE | `service:delete:own` | Delete service |
| `/api/services/[id]/moderate` | POST | `service:moderate:all` | Moderate service |

## Service Discovery

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/discovery/search` | GET | `discovery:search:public` | Search services |
| `/api/discovery/browse` | GET | `discovery:browse:public` | Browse services |
| `/api/discovery/filter` | GET | `discovery:filter:public` | Filter services |
| `/api/discovery/recommend` | GET | `discovery:recommend:own` | Get recommendations |

## Booking Management

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/bookings` | GET | `booking:view:own` or `booking:view:provider` | List bookings |
| `/api/bookings` | POST | `booking:create:own` | Create new booking |
| `/api/bookings/[id]` | GET | `booking:view:own` or `booking:view:provider` | Get booking details |
| `/api/bookings/[id]` | PUT | `booking:edit:own` or `booking:edit:provider` | Update booking |
| `/api/bookings/[id]` | DELETE | `booking:cancel:own` or `booking:cancel:provider` | Cancel booking |
| `/api/bookings/[id]/approve` | POST | `booking:approve:provider` | Approve booking |
| `/api/bookings/[id]/reject` | POST | `booking:reject:provider` | Reject booking |

## Booking Lifecycle

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/bookings/[id]/start` | POST | `booking_lifecycle:start:provider` | Start booking session |
| `/api/bookings/[id]/pause` | POST | `booking_lifecycle:pause:provider` | Pause booking session |
| `/api/bookings/[id]/resume` | POST | `booking_lifecycle:resume:provider` | Resume booking session |
| `/api/bookings/[id]/complete` | POST | `booking_lifecycle:complete:provider` | Complete booking session |
| `/api/bookings/[id]/extend` | POST | `booking_lifecycle:extend:provider` | Extend booking session |

## Communication

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/communications` | GET | `communication:view:own` or `communication:view:provider` | List communications |
| `/api/communications` | POST | `communication:send:own` | Send message |
| `/api/communications/[id]` | GET | `communication:view:own` or `communication:view:provider` | Get message |
| `/api/communications/[id]/moderate` | POST | `communication:moderate:all` | Moderate message |

## Calls

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/calls` | GET | `call:view:own` or `call:view:provider` | List calls |
| `/api/calls` | POST | `call:initiate:own` | Initiate call |
| `/api/calls/[id]/join` | POST | `call:join:own` | Join call |
| `/api/calls/[id]/record` | POST | `call:record:provider` | Record call |
| `/api/calls/[id]` | GET | `call:view:own` or `call:view:provider` | Get call details |

## Payments & Finance

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/payments` | GET | `payment:view:own` or `payment:view:provider` | List payments |
| `/api/payments/[id]` | GET | `payment:view:own` or `payment:view:provider` | Get payment details |
| `/api/payments/[id]/process` | POST | `payment:process:provider` | Process payment |
| `/api/payments/[id]/refund` | POST | `payment:refund:provider` | Process refund |
| `/api/finance/export` | GET | `finance:export:own` or `finance:export:provider` | Export financial data |

## Role Administration

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/admin/roles` | GET | `role:view:all` | List all roles |
| `/api/admin/roles` | POST | `role:create:all` | Create new role |
| `/api/admin/roles/[id]` | PUT | `role:edit:all` | Update role |
| `/api/admin/roles/[id]` | DELETE | `role:delete:all` | Delete role |
| `/api/admin/users/[id]/roles` | GET | `user:read:all` | Get user roles |
| `/api/admin/users/[id]/roles` | POST | `role:assign:all` | Assign role to user |
| `/api/admin/users/[id]/roles` | DELETE | `role:assign:all` | Remove role from user |

## System Administration

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/admin/system` | GET | `system:view:all` | Get system info |
| `/api/admin/system/settings` | GET | `system:settings:all` | Get system settings |
| `/api/admin/system/settings` | PUT | `system:settings:all` | Update system settings |
| `/api/admin/system/logs` | GET | `system:logs:all` | Get system logs |
| `/api/admin/system/backup` | POST | `system:backup:all` | Create backup |
| `/api/admin/system/maintenance` | POST | `system:maintenance:all` | Perform maintenance |

## Security & MFA

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/security/mfa` | GET | `security:mfa:own` | Get MFA status |
| `/api/security/mfa` | POST | `security:mfa:own` | Enable MFA |
| `/api/security/mfa` | DELETE | `security:mfa:own` | Disable MFA |
| `/api/admin/users/[id]/mfa` | GET | `security:mfa:all` | Get user MFA status |
| `/api/admin/users/[id]/mfa` | POST | `security:mfa:all` | Manage user MFA |

## Audit & Monitoring

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/admin/audit/logs` | GET | `audit:view:all` | Get audit logs |
| `/api/admin/audit/stats` | GET | `audit:view:all` | Get audit statistics |
| `/api/admin/audit/users/[id]` | GET | `audit:view:all` | Get user audit logs |

## Company & Organization

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/companies` | GET | `company:view:own` or `company:view:all` | List companies |
| `/api/companies` | POST | `company:create:own` | Create company |
| `/api/companies/[id]` | GET | `company:view:own` or `company:view:all` | Get company details |
| `/api/companies/[id]` | PUT | `company:edit:own` | Update company |
| `/api/companies/[id]` | DELETE | `company:delete:own` | Delete company |

## Promoter Management

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/promoters` | GET | `promoter:view:own` or `promoter:view:all` | List promoters |
| `/api/promoters` | POST | `promoter:create:own` | Create promoter profile |
| `/api/promoters/[id]` | GET | `promoter:view:own` or `promoter:view:all` | Get promoter details |
| `/api/promoters/[id]` | PUT | `promoter:edit:own` | Update promoter profile |
| `/api/promoters/[id]` | DELETE | `promoter:delete:own` | Delete promoter profile |

## Contract Management

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/contracts` | GET | `contract:view:own` | List contracts |
| `/api/contracts` | POST | `contract:create:own` | Create contract |
| `/api/contracts/[id]` | GET | `contract:view:own` | Get contract details |
| `/api/contracts/[id]` | PUT | `contract:edit:own` | Update contract |
| `/api/contracts/[id]` | DELETE | `contract:delete:own` | Delete contract |

## Party Management

| Endpoint | Method | Required Permission | Description |
|----------|--------|-------------------|-------------|
| `/api/parties` | GET | `party:view:own` | List parties |
| `/api/parties` | POST | `party:create:own` | Create party |
| `/api/parties/[id]` | GET | `party:view:own` | Get party details |
| `/api/parties/[id]` | PUT | `party:edit:own` | Update party |
| `/api/parties/[id]` | DELETE | `party:delete:own` | Delete party |

## Implementation Notes

### Permission Inheritance

Some endpoints support multiple permission levels:

- **Own Resources**: User can only access their own resources
- **Provider Access**: User can access resources within their provider organization
- **Organization Access**: User can access resources within their company
- **All Access**: User can access any resource (admin level)

### Context Requirements

For context-based permissions, the following parameters are required:

```typescript
{
  user: { id: string, provider_id?: string, organization_id?: string },
  params: { id?: string, [key: string]: any },
  resourceType: string,
  resourceId?: string
}
```

### Default Permissions

- **Public endpoints**: No authentication required
- **Authenticated endpoints**: User must be logged in
- **Protected endpoints**: User must have specific permissions
- **Admin endpoints**: User must have admin-level permissions

### Permission Validation

All permissions are validated against:

1. **User authentication**: User must be logged in
2. **Role assignment**: User must have assigned roles
3. **Permission mapping**: Role must include required permission
4. **Scope validation**: Permission scope must match context
5. **Resource ownership**: User must own or have access to resource

### Error Responses

When permission is denied:

```json
{
  "error": "Insufficient permissions",
  "required_permission": "user:view:all",
  "reason": "User does not have required permission"
}
```

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

1. **Define required permission** using `{resource}:{action}:{scope}` format
2. **Add to this mapping** with endpoint, method, and permission
3. **Implement permission check** using `guardPermission()` or `withRBAC()`
4. **Test permission enforcement** in both dry-run and enforce modes
5. **Update documentation** with usage examples

## Testing Permissions

Test permission enforcement:

```bash
# Test in dry-run mode
RBAC_ENFORCEMENT=dry-run npm run dev

# Test in enforce mode
RBAC_ENFORCEMENT=enforce npm run dev

# Check audit logs
SELECT * FROM audit_logs WHERE event_type = 'PERMISSION_CHECK' ORDER BY timestamp DESC;
```
=======
### Proposed Endpoint → Permission Mapping

- GET /api/bookings → booking:read:own (booking:read:provider for provider views; booking:read:all for admin dashboards)
- POST /api/bookings → booking:create:own
- GET /api/provider/services → service:read:own (manager/admin may need service:read:all)
- POST /api/provider/services → service:create:own
- GET /api/users → user:read:all (admin-only views)
- POST /api/users/:id/roles (future) → role:assign:all (scoped by org in evaluator)
- Moderation: service/message moderation routes → service:moderate:all | message:moderate:all

Notes:
- Ambiguous endpoints will default to most restrictive mapping and be flagged during review.
- Existing `professionalSecurityMiddleware` remains; RBAC runs in dry-run initially to audit.


>>>>>>> Stashed changes
