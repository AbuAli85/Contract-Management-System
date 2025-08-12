# RBAC Endpoint Coverage

This document provides an overview of all endpoints that need RBAC protection.

## Summary

- **Total Endpoints**: 159
- **Protected Resources**: unknown, role, user, booking, company, contract, service, party, permission, promoter
- **Coverage Status**: 4/159 endpoints protected

## Endpoints by Resource Type

### Unknown

- [app\api\admin\backup\route.ts](./route.md) - GET, POST
- [app\api\admin\bulk-import\route.ts](./route.md) - POST
- [app\api\admin\check-schema\route.ts](./route.md) - GET
- [app\api\admin\seed-data\route.ts](./route.md) - POST
- [app\api\admin\simple-seed\route.ts](./route.md) - POST
- [app\api\admin\update-roles\route.ts](./route.md) - POST
- [app\api\audit-logs\route.ts](./route.md) - GET
- [app\api\auth\biometric\route.ts](./route.md) - GET, POST, DELETE
- [app\api\auth\callback\route.ts](./route.md) - GET, POST
- [app\api\auth\check-session\route.ts](./route.md) - GET
- [app\api\auth\devices\route.ts](./route.md) - GET, POST, DELETE
- [app\api\auth\helper\route.ts](./route.md) - POST
- [app\api\auth\login\route.ts](./route.md) - POST
- [app\api\auth\logout\route.ts](./route.md) - GET, POST
- [app\api\auth\manual-sync\route.ts](./route.md) - POST
- [app\api\auth\mfa\route.ts](./route.md) - GET, POST, DELETE
- [app\api\auth\professional\route.ts](./route.md) - GET, POST
- [app\api\auth\refresh-session\route.ts](./route.md) - GET, POST
- [app\api\auth\register-new\route.ts](./route.md) - POST
- [app\api\auth\security\route.ts](./route.md) - GET, POST
- [app\api\auth\sessions\route.ts](./route.md) - GET, POST, DELETE
- [app\api\auth\status\route.ts](./route.md) - GET
- [app\api\booking-resources\route.ts](./route.md) - GET
- [app\api\check-user-role\route.ts](./route.md) - GET
- [app\api\clear-cookies\route.ts](./route.md) - GET
- [app\api\contract-generation\route.ts](./route.md) - POST
- [app\api\dashboard\activities\route.ts](./route.md) - GET
- [app\api\dashboard\analytics\paginated\route.ts](./route.md) - GET, POST, DELETE
- [app\api\dashboard\analytics\route.ts](./route.md) - GET
- [app\api\dashboard\attendance\route.ts](./route.md) - GET
- [app\api\dashboard\env-check\route.ts](./route.md) - GET
- [app\api\dashboard\metrics\route.ts](./route.md) - GET
- [app\api\dashboard\notifications-clean\route.ts](./route.md) - GET, POST
- [app\api\dashboard\notifications\route.ts](./route.md) - GET, POST
- [app\api\dashboard\public-stats\route.ts](./route.md) - GET
- [app\api\dashboard\stats\route.ts](./route.md) - GET
- [app\api\dashboard\test\route.ts](./route.md) - GET
- [app\api\debug\apply-booking-fix\route.ts](./route.md) - POST
- [app\api\debug\booking-schema\route.ts](./route.md) - GET
- [app\api\debug\cookie-values\route.ts](./route.md) - GET
- [app\api\debug\cookies-server\route.ts](./route.md) - GET
- [app\api\debug\cookies\route.ts](./route.md) - GET
- [app\api\debug\env\route.ts](./route.md) - GET
- [app\api\debug\session-direct\route.ts](./route.md) - GET
- [app\api\debug\session\route.ts](./route.md) - GET
- [app\api\debug\supabase\route.ts](./route.md) - GET
- [app\api\debug\tables\route.ts](./route.md) - GET
- [app\api\debug\test-cookie-setting\route.ts](./route.md) - GET
- [app\api\debug\user-role\route.ts](./route.md) - GET, POST
- [app\api\fix-admin-role-simple\route.ts](./route.md) - POST
- [app\api\fix-admin-role\route.ts](./route.md) - POST
- [app\api\force-logout\route.ts](./route.md) - GET
- [app\api\generate-contract\route.ts](./route.md) - POST, PUT
- [app\api\get-user-role\route.ts](./route.md) - GET
- [app\api\health\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\notifications\route.ts](./route.md) - GET, POST, PATCH
- [app\api\pdf-generation\route.ts](./route.md) - GET, POST
- [app\api\provider\orders\route.ts](./route.md) - GET, PUT
- [app\api\provider\stats\route.ts](./route.md) - GET
- [app\api\reviewer-roles\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\reviews\pending\route.ts](./route.md) - GET
- [app\api\setup-admin\route.ts](./route.md) - POST
- [app\api\supabase-config\route.ts](./route.md) - GET
- [app\api\test-approval\route.ts](./route.md) - POST
- [app\api\test-auth-config\route.ts](./route.md) - GET
- [app\api\test-auth-security\route.ts](./route.md) - GET
- [app\api\test-authentication-flow\route.ts](./route.md) - GET
- [app\api\test-booking-upsert\route.ts](./route.md) - POST
- [app\api\test-contracts-schema\route.ts](./route.md) - GET
- [app\api\test-i18n\route.ts](./route.md) - GET
- [app\api\test-session-persistence\route.ts](./route.md) - GET
- [app\api\trackings\[id]\route.ts](./route.md) - GET, PATCH
- [app\api\upload\route.ts](./route.md) - POST, DELETE
- [app\api\user-role\route.ts](./route.md) - GET
- [app\api\users-fixed\route.ts](./route.md) - GET
- [app\api\webhook\contract-pdf-ready\route.ts](./route.md) - GET, POST
- [app\api\webhook\makecom\route.ts](./route.md) - GET, POST
- [app\api\webhooks\[type]\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\webhooks\booking-events\route.ts](./route.md) - GET, POST
- [app\api\workflow\config\route.ts](./route.md) - GET, POST, PUT, DELETE

### Role

- [app\api\admin\roles\route.ts](./route.md) - GET, POST
- [app\api\roles\[id]\route.ts](./route.md) - PUT, DELETE
- [app\api\roles\route.ts](./route.md) - GET, POST

### User

- [app\api\admin\users\[userId]\roles\route.ts](./route.md) - GET, POST, DELETE
- [app\api\users\[id]\approve\route.ts](./route.md) - PUT
- [app\api\users\[id]\permissions\route.ts](./route.md) - GET, POST
- [app\api\users\activity\route.ts](./route.md) - GET, POST
- [app\api\users\approval\route.ts](./route.md) - GET, POST
- [app\api\users\assign-role\route.ts](./route.md) - POST
- [app\api\users\change-password\route.ts](./route.md) - POST
- [app\api\users\debug\route.ts](./route.md) - GET
- [app\api\users\permissions\route.ts](./route.md) - GET
- [app\api\users\profile\[id]\route-fixed.ts](./route-fixed.md) - GET, PUT, DELETE
- [app\api\users\profile\[id]\route-temp-fix.ts](./route-temp-fix.md) - GET
- [app\api\users\profile\[id]\route.ts](./route.md) - GET
- [app\api\users\profile\route.ts](./route.md) - GET, PUT
- [app\api\users\roles\[id]\route.ts](./route.md) - GET, PUT, DELETE
- [app\api\users\roles\route.ts](./route.md) - GET, POST
- [app\api\users\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\users\simple-route.ts](./simple-route.md) - GET, POST
- [app\api\users\sync\route-emergency-fix.ts](./route-emergency-fix.md) - POST
- [app\api\users\sync\route.ts](./route.md) - POST

### Booking

- [app\api\bookings\[id]\route.ts](./route.md) - GET, PATCH
- [app\api\bookings\direct-webhook\route.ts](./route.md) - GET, POST
- [app\api\bookings\route.ts](./route.md) - GET, POST
- [app\api\bookings\upsert\route.ts](./route.md) - GET, POST
- [app\api\bookings\webhook\route.ts](./route.md) - GET, POST
- [app\api\bookings\webhook\test\route.ts](./route.md) - GET, POST
- [app\api\enhanced\bookings\route.ts](./route.md) - GET, POST

### Company

- [app\api\companies\route.ts](./route.md) - GET, POST
- [app\api\enhanced\companies\[id]\route.ts](./route.md) - GET
- [app\api\enhanced\companies\route.ts](./route.md) - GET, POST, PUT, DELETE

### Contract

- [app\api\contracts\[id]\activity\route.ts](./route.md) - GET
- [app\api\contracts\[id]\approve.ts](./approve.md) - POST
- [app\api\contracts\[id]\download-pdf\route.ts](./route.md) - GET, POST
- [app\api\contracts\[id]\download\route.ts](./route.md) - GET
- [app\api\contracts\[id]\fix-processing\route.ts](./route.md) - POST
- [app\api\contracts\[id]\generate-pdf\route.ts](./route.md) - POST
- [app\api\contracts\[id]\reject.ts](./reject.md) - POST
- [app\api\contracts\[id]\review.ts](./review.md) - POST
- [app\api\contracts\[id]\route.ts](./route.md) - GET, PUT
- [app\api\contracts\[id]\test-pdf\route.ts](./route.md) - GET
- [app\api\contracts\approval\approve\route.ts](./route.md) - POST
- [app\api\contracts\approval\submit\route.ts](./route.md) - POST
- [app\api\contracts\download-pdf\route.ts](./route.md) - GET, POST
- [app\api\contracts\generate\route.ts](./route.md) - GET, POST, PATCH
- [app\api\contracts\makecom\generate\route.ts](./route.md) - GET, POST
- [app\api\contracts\paginated\route.ts](./route.md) - GET, POST
- [app\api\contracts\route.ts](./route.md) - GET, POST
- [app\api\contracts\secure-route.ts](./secure-route.md) - GET, POST

### Service

- [app\api\enhanced\services\route.ts](./route.md) - GET, POST
- [app\api\provider\services\route.ts](./route.md) - GET, POST, PUT
- [app\api\services\route.ts](./route.md) - GET, POST

### Party

- [app\api\parties\route.ts](./route.md) - GET, POST

### Permission

- [app\api\permissions\route.ts](./route.md) - GET

### Promoter

- [app\api\promoter\achievements\route.ts](./route.md) - GET
- [app\api\promoter\metrics\route.ts](./route.md) - GET
- [app\api\promoter\tasks\route.ts](./route.md) - GET
- [app\api\promoters\[id]\attendance\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\badges\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\communications\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\documents.ts](./documents.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\documents\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\education.ts](./education.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\education\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\experience.ts](./experience.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\experience\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\feedback\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\leave-requests\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\notes\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\performance-metrics\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\reports\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\route.ts](./route.md) - GET, PUT, DELETE
- [app\api\promoters\[id]\scores\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\skills.ts](./skills.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\skills\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\[id]\tasks\route.ts](./route.md) - GET, POST, PUT, DELETE
- [app\api\promoters\dashboard\route.ts](./route.md) - GET
- [app\api\promoters\route.ts](./route.md) - GET, POST

## Implementation Status

| Resource   | Total | Protected | Pending |
| ---------- | ----- | --------- | ------- |
| unknown    | 80    | 0         | 80      |
| role       | 3     | 1         | 2       |
| user       | 19    | 1         | 18      |
| booking    | 7     | 1         | 6       |
| company    | 3     | 0         | 3       |
| contract   | 18    | 0         | 18      |
| service    | 3     | 1         | 2       |
| party      | 1     | 0         | 1       |
| permission | 1     | 0         | 1       |
| promoter   | 24    | 0         | 24      |

## Next Steps

1. **Review generated stubs** for each endpoint
2. **Implement permission checks** using the provided examples
3. **Test with different user roles** and permission levels
4. **Update audit logging** to track permission decisions
5. **Monitor performance** and adjust caching as needed

## RBAC Configuration

Ensure the following environment variables are set:

```bash
# Enable RBAC enforcement
RBAC_ENFORCEMENT=true

# Optional: Redis cache for permissions
REDIS_URL=redis://localhost:6379

# Cache settings
RBAC_CACHE_TTL=900000
RBAC_CACHE_MAX_SIZE=1000
```

## Support

For questions about RBAC implementation, refer to:

- [RBAC System Documentation](../rbac-system.md)
- [Permission Evaluation Guide](../rbac-permissions.md)
- [Audit Logging Guide](../rbac-audit.md)
