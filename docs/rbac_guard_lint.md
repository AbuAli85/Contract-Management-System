# 🛡️ RBAC Guard Lint Report

Generated: 2025-08-11T21:38:58.766Z

## 📊 Executive Summary

- **Total Route Files**: 147
- **Properly Guarded**: 30
- **Missing Guards**: 117
- **Critical Issues**: 0

## 🚨 Critical Path Security Status

### Admin Routes
- **Total**: 0
- **Guarded**: 0
- **Missing**: 0
- **Status**: ✅ SECURE

### Contract Routes
- **Total**: 0
- **Guarded**: 0
- **Missing**: 0
- **Status**: ✅ SECURE

### User Routes
- **Total**: 0
- **Guarded**: 0
- **Missing**: 0
- **Status**: ✅ SECURE

### Audit Log Routes
- **Total**: 0
- **Guarded**: 0
- **Missing**: 0
- **Status**: ✅ SECURE

### Upload Routes
- **Total**: 0
- **Guarded**: 0
- **Missing**: 0
- **Status**: ✅ SECURE

### Workflow Routes
- **Total**: 0
- **Guarded**: 0
- **Missing**: 0
- **Status**: ✅ SECURE

### Other Routes
- **Total**: 147
- **Guarded**: 30
- **Missing**: 117
- **Status**: ⚠️ REVIEW

## 📋 Detailed File Analysis

### ❌ `app\api\users-fixed\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\user-role\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\users\route.ts`
    - Guarded: GET, POST, PUT, DELETE

### ✅ `app\api\upload\route.ts`
    - Guarded: POST

### ❌ `app\api\test-session-persistence\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\test-contracts-schema\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\test-i18n\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\test-booking-upsert\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\test-authentication-flow\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\test-auth-security\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\test-auth-config\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\test-approval\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\supabase-config\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\setup-admin\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\services\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\roles\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\reviewer-roles\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\promoters\route.ts`
    - Guarded: GET

### ❌ `app\api\permissions\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\parties\route.ts`
    - Guarded: GET

### ❌ `app\api\pdf-generation\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\health\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\notifications\route.ts`
    - Guarded: GET, POST

### ❌ `app\api\get-user-role\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\generate-contract\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\force-logout\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\fix-admin-role-simple\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\fix-admin-role\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\contracts\route.ts`
    - Guarded: GET, POST

### ❌ `app\api\contract-generation\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\companies\route.ts`
    - Guarded: GET

### ❌ `app\api\clear-cookies\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\check-user-role\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\booking-resources\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\bookings\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\audit-logs\route.ts`
    - Guarded: GET

### ❌ `app\api\workflow\config\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\webhooks\booking-events\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\webhooks\[type]\route.ts`
    - Guarded: POST

### ❌ `app\api\webhook\makecom\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\webhook\contract-pdf-ready\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\users\roles\route.ts`
    - Guarded: GET, POST

### ❌ `app\api\users\sync\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\users\profile\route.ts`
    - Guarded: GET, PUT

### ✅ `app\api\users\permissions\route.ts`
    - Guarded: GET

### ❌ `app\api\users\debug\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\users\change-password\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\users\assign-role\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\users\approval\route.ts`
    - Guarded: GET, POST

### ❌ `app\api\users\activity\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\trackings\[id]\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\roles\[id]\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\reviews\pending\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\provider\stats\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\provider\services\route.ts`
    - Guarded: POST, PUT

### ❌ `app\api\provider\orders\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoter\tasks\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoter\metrics\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoter\achievements\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\promoters\[id]\route.ts`
    - Guarded: GET

### ❌ `app\api\promoters\dashboard\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\enhanced\services\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\enhanced\companies\route.ts`
    - Guarded: GET, POST

### ❌ `app\api\enhanced\bookings\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\user-role\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\test-cookie-setting\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\supabase\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\tables\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\session-direct\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\session\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\env\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\cookies-server\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\cookies\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\cookie-values\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\booking-schema\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\debug\apply-booking-fix\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\dashboard\test\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\dashboard\stats\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\dashboard\public-stats\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\dashboard\notifications-clean\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\dashboard\metrics\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\dashboard\notifications\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\dashboard\env-check\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\dashboard\attendance\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\dashboard\analytics\route.ts`
    - Guarded: GET

### ❌ `app\api\dashboard\activities\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\contracts\[id]\route.ts`
    - Guarded: GET, PUT

### ✅ `app\api\contracts\paginated\route.ts`
    - Guarded: POST

### ✅ `app\api\contracts\download-pdf\route.ts`
    - Guarded: GET, POST

### ✅ `app\api\contracts\generate\route.ts`
    - Guarded: POST

### ❌ `app\api\bookings\[id]\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\bookings\upsert\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\bookings\webhook\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\bookings\direct-webhook\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\status\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\sessions\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\security\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\register-new\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\refresh-session\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\professional\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\mfa\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\manual-sync\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\logout\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\login\route.ts`
    - Issues: Missing RBAC guards for: POST (line 146)
    - Missing Guards: POST

### ❌ `app\api\auth\helper\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\devices\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\check-session\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\callback\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\auth\biometric\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\admin\update-roles\route.ts`
    - Guarded: POST

### ✅ `app\api\admin\seed-data\route.ts`
    - Guarded: POST

### ❌ `app\api\admin\simple-seed\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\admin\roles\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\admin\check-schema\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\admin\bulk-import\route.ts`
    - Guarded: POST

### ✅ `app\api\admin\backup\route.ts`
    - Guarded: POST

### ❌ `app\api\users\[id]\permissions\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\users\[id]\approve\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\users\roles\[id]\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\users\profile\[id]\route.ts`
    - Guarded: GET

### ❌ `app\api\promoters\[id]\skills\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\tasks\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\scores\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\reports\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\performance-metrics\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\notes\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\leave-requests\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\feedback\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\experience\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\education\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\documents\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\communications\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\badges\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\promoters\[id]\attendance\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\enhanced\companies\[id]\route.ts`
    - Guarded: GET

### ❌ `app\api\dashboard\analytics\paginated\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\contracts\[id]\test-pdf\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\contracts\[id]\generate-pdf\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\contracts\[id]\fix-processing\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\contracts\[id]\download\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\contracts\[id]\download-pdf\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\contracts\[id]\activity\route.ts`
    - Issues: No HTTP method handlers found

### ✅ `app\api\contracts\makecom\generate\route.ts`
    - Guarded: POST

### ✅ `app\api\contracts\approval\submit\route.ts`
    - Guarded: POST

### ✅ `app\api\contracts\approval\approve\route.ts`
    - Guarded: POST

### ❌ `app\api\bookings\webhook\test\route.ts`
    - Issues: No HTTP method handlers found

### ❌ `app\api\admin\users\[userId]\roles\route.ts`
    - Issues: No HTTP method handlers found

## 🚨 Action Items

1. ✅ No critical issues to fix

2. **REVIEW**: Add RBAC guards to remaining unsecured routes:
        - `app\api\users-fixed\route.ts`
        - `app\api\user-role\route.ts`
        - `app\api\test-session-persistence\route.ts`
        - `app\api\test-contracts-schema\route.ts`
        - `app\api\test-i18n\route.ts`
        - `app\api\test-booking-upsert\route.ts`
        - `app\api\test-authentication-flow\route.ts`
        - `app\api\test-auth-security\route.ts`
        - `app\api\test-auth-config\route.ts`
        - `app\api\test-approval\route.ts`
        - `app\api\supabase-config\route.ts`
        - `app\api\setup-admin\route.ts`
        - `app\api\services\route.ts`
        - `app\api\roles\route.ts`
        - `app\api\reviewer-roles\route.ts`
        - `app\api\permissions\route.ts`
        - `app\api\pdf-generation\route.ts`
        - `app\api\health\route.ts`
        - `app\api\get-user-role\route.ts`
        - `app\api\generate-contract\route.ts`
        - `app\api\force-logout\route.ts`
        - `app\api\fix-admin-role-simple\route.ts`
        - `app\api\fix-admin-role\route.ts`
        - `app\api\contract-generation\route.ts`
        - `app\api\clear-cookies\route.ts`
        - `app\api\check-user-role\route.ts`
        - `app\api\booking-resources\route.ts`
        - `app\api\bookings\route.ts`
        - `app\api\workflow\config\route.ts`
        - `app\api\webhooks\booking-events\route.ts`
        - `app\api\webhook\makecom\route.ts`
        - `app\api\webhook\contract-pdf-ready\route.ts`
        - `app\api\users\sync\route.ts`
        - `app\api\users\debug\route.ts`
        - `app\api\users\change-password\route.ts`
        - `app\api\users\assign-role\route.ts`
        - `app\api\users\activity\route.ts`
        - `app\api\trackings\[id]\route.ts`
        - `app\api\roles\[id]\route.ts`
        - `app\api\reviews\pending\route.ts`
        - `app\api\provider\stats\route.ts`
        - `app\api\provider\orders\route.ts`
        - `app\api\promoter\tasks\route.ts`
        - `app\api\promoter\metrics\route.ts`
        - `app\api\promoter\achievements\route.ts`
        - `app\api\promoters\dashboard\route.ts`
        - `app\api\enhanced\services\route.ts`
        - `app\api\enhanced\bookings\route.ts`
        - `app\api\debug\user-role\route.ts`
        - `app\api\debug\test-cookie-setting\route.ts`
        - `app\api\debug\supabase\route.ts`
        - `app\api\debug\tables\route.ts`
        - `app\api\debug\session-direct\route.ts`
        - `app\api\debug\session\route.ts`
        - `app\api\debug\env\route.ts`
        - `app\api\debug\cookies-server\route.ts`
        - `app\api\debug\cookies\route.ts`
        - `app\api\debug\cookie-values\route.ts`
        - `app\api\debug\booking-schema\route.ts`
        - `app\api\debug\apply-booking-fix\route.ts`
        - `app\api\dashboard\test\route.ts`
        - `app\api\dashboard\stats\route.ts`
        - `app\api\dashboard\public-stats\route.ts`
        - `app\api\dashboard\notifications-clean\route.ts`
        - `app\api\dashboard\metrics\route.ts`
        - `app\api\dashboard\notifications\route.ts`
        - `app\api\dashboard\env-check\route.ts`
        - `app\api\dashboard\attendance\route.ts`
        - `app\api\dashboard\activities\route.ts`
        - `app\api\bookings\[id]\route.ts`
        - `app\api\bookings\upsert\route.ts`
        - `app\api\bookings\webhook\route.ts`
        - `app\api\bookings\direct-webhook\route.ts`
        - `app\api\auth\status\route.ts`
        - `app\api\auth\sessions\route.ts`
        - `app\api\auth\security\route.ts`
        - `app\api\auth\register-new\route.ts`
        - `app\api\auth\refresh-session\route.ts`
        - `app\api\auth\professional\route.ts`
        - `app\api\auth\mfa\route.ts`
        - `app\api\auth\manual-sync\route.ts`
        - `app\api\auth\logout\route.ts`
        - `app\api\auth\login\route.ts`
        - `app\api\auth\helper\route.ts`
        - `app\api\auth\devices\route.ts`
        - `app\api\auth\check-session\route.ts`
        - `app\api\auth\callback\route.ts`
        - `app\api\auth\biometric\route.ts`
        - `app\api\admin\simple-seed\route.ts`
        - `app\api\admin\roles\route.ts`
        - `app\api\admin\check-schema\route.ts`
        - `app\api\users\[id]\permissions\route.ts`
        - `app\api\users\[id]\approve\route.ts`
        - `app\api\users\roles\[id]\route.ts`
        - `app\api\promoters\[id]\skills\route.ts`
        - `app\api\promoters\[id]\tasks\route.ts`
        - `app\api\promoters\[id]\scores\route.ts`
        - `app\api\promoters\[id]\reports\route.ts`
        - `app\api\promoters\[id]\performance-metrics\route.ts`
        - `app\api\promoters\[id]\notes\route.ts`
        - `app\api\promoters\[id]\leave-requests\route.ts`
        - `app\api\promoters\[id]\feedback\route.ts`
        - `app\api\promoters\[id]\experience\route.ts`
        - `app\api\promoters\[id]\education\route.ts`
        - `app\api\promoters\[id]\documents\route.ts`
        - `app\api\promoters\[id]\communications\route.ts`
        - `app\api\promoters\[id]\badges\route.ts`
        - `app\api\promoters\[id]\attendance\route.ts`
        - `app\api\dashboard\analytics\paginated\route.ts`
        - `app\api\contracts\[id]\test-pdf\route.ts`
        - `app\api\contracts\[id]\generate-pdf\route.ts`
        - `app\api\contracts\[id]\fix-processing\route.ts`
        - `app\api\contracts\[id]\download\route.ts`
        - `app\api\contracts\[id]\download-pdf\route.ts`
        - `app\api\contracts\[id]\activity\route.ts`
        - `app\api\bookings\webhook\test\route.ts`
        - `app\api\admin\users\[userId]\roles\route.ts`

## 🔧 How to Fix

### Add RBAC Guard to Route Handler
```typescript
// Before (INSECURE)
export const GET = async (request: NextRequest) => {
  // handler logic
};

// After (SECURE)
export const GET = withRBAC('resource:action:scope', async (request: NextRequest) => {
  // handler logic
});
```

### Use Multiple Permission Check
```typescript
export const GET = withAnyRBAC(['permission1', 'permission2'], async (request: NextRequest) => {
  // handler logic
});
```

### Required Permission Format
All permissions must follow the format: `{resource}:{action}:{scope}`

Examples:
- `user:read:own` - User can read their own data
- `contract:create:all` - User can create contracts for anyone
- `admin:manage:system` - Admin can manage system settings

## 📚 RBAC Guard Functions

### withRBAC(permission, handler)
Single permission check - user must have exact permission.

### withAnyRBAC(permissions[], handler)
Multiple permission check - user must have at least one permission.

## 🚨 Security Implications

Missing RBAC guards create security vulnerabilities:
- **Unauthorized Access**: Users can access endpoints without proper permissions
- **Data Breaches**: Sensitive data may be exposed to unauthorized users
- **Privilege Escalation**: Users may gain access to admin functions
- **Compliance Issues**: May violate security compliance requirements

---
*Report generated by RBAC Guard Lint script*
