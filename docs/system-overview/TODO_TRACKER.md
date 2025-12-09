# Technical Debt and TODO Tracker

This document tracks TODO/FIXME items found in the codebase that need to be addressed.

## Summary

| Category            | Count | Priority |
| ------------------- | ----- | -------- |
| Authentication/MFA  | 21    | High     |
| Security Features   | 14    | High     |
| Notifications       | 6     | Medium   |
| Analytics/Reporting | 4     | Medium   |
| UI/UX               | 5     | Low      |
| Misc                | 12    | Low      |

## High Priority - Authentication & MFA

File: `lib/auth/professional-auth-service.ts`

These TODOs represent incomplete MFA (Multi-Factor Authentication) implementation:

- [ ] `checkMFARequirement(userId)` - Implement MFA requirement check
- [ ] `registerDevice(userId, request)` - Implement device registration
- [ ] `verifyTOTPToken(userId, token)` - Implement TOTP verification
- [ ] `verifyBackupCode(userId, code)` - Implement backup code verification
- [ ] `getLoginHistory(email)` - Implement login history retrieval
- [ ] `getFailedAttempts(email, timeWindow)` - Implement failed attempts counting
- [ ] `isDeviceTrusted(fingerprint)` - Implement device trust checking
- [ ] `generateTOTPSecret()` - Implement TOTP secret generation
- [ ] `generateQRCode(email, secret)` - Implement QR code generation
- [ ] `generateBackupCodes()` - Implement backup code generation
- [ ] `storePendingMFASecret(userId, secret)` - Implement pending MFA secret storage
- [ ] `storeBackupCodes(userId, codes)` - Implement backup codes storage
- [ ] `getPendingMFASecret(userId)` - Implement pending MFA secret retrieval
- [ ] `verifyTOTPToken(secret, token)` - Implement TOTP token verification
- [ ] `confirmMFASetup(userId, secret)` - Implement MFA setup confirmation
- [ ] `clearPendingMFASecret(userId)` - Implement pending secret cleanup
- [ ] `removeMFASetup(userId)` - Implement MFA removal
- [ ] `generateNewBackupCodes(userId)` - Implement new backup codes generation
- [ ] `getStoredCredentials()` - Implement WebAuthn credentials retrieval
- [ ] `verifyBiometricAssertion(assertion)` - Implement biometric assertion verification
- [ ] `refreshSession()` - Implement session refresh logic

**Recommendation**: Use a dedicated library like `otplib` for TOTP, `qrcode` for QR generation, and implement a `mfa_settings` table in the database.

## High Priority - Security Features

File: `lib/auth/professional-security-middleware.ts`

- [ ] Implement API key rotation
- [ ] Implement rate limiting per user/IP
- [ ] Implement request signing verification
- [ ] Implement security audit logging

File: `app/api/auth/sessions/route.ts`

- [ ] Implement session revocation
- [ ] Implement concurrent session limits
- [ ] Implement session activity tracking

File: `app/api/auth/devices/route.ts`

- [ ] Implement device management API
- [ ] Implement device verification flow

File: `app/api/auth/biometric/route.ts`

- [ ] Implement WebAuthn registration
- [ ] Implement WebAuthn authentication

## Medium Priority - Notifications

File: `lib/advanced/notification-service.ts`

- [ ] Implement push notification delivery
- [ ] Implement SMS notifications
- [ ] Implement notification preferences
- [ ] Implement notification batching
- [ ] Implement notification analytics

File: `lib/services/promoter-notification.service.ts`

- [ ] Implement real-time notification delivery

## Medium Priority - Analytics/Reporting

File: `app/api/dashboard/stats/route.ts`

- [ ] Implement caching for dashboard stats

File: `lib/document-monitor.ts`

- [ ] Implement document expiry alerts
- [ ] Implement document compliance checks

## Low Priority - UI/UX

File: `components/dashboards/provider-dashboard.tsx`

- [ ] Implement provider analytics charts

File: `components/dashboards/client-dashboard.tsx`

- [ ] Implement client analytics charts

File: `components/enhanced-promoters-view.tsx`

- [ ] Implement bulk actions UI

File: `components/hr/hr-navigation.tsx`

- [ ] Implement dynamic HR menu items

File: `components/contracts-analytics.tsx`

- [ ] Implement contract trend charts

## Low Priority - Misc

File: `lib/utils/logger.ts`

- [ ] Implement external logging service integration (Sentry/DataDog)

File: `lib/rbac/cache.ts`

- [ ] Implement cache invalidation strategy

File: `lib/api/error-logger.ts`

- [ ] Implement error aggregation
- [ ] Implement error alerting

File: `app/api/webhooks/resend/route.ts`

- [ ] Implement email delivery tracking
- [ ] Implement bounce handling
- [ ] Implement complaint handling

File: `app/api/csp-report/route.ts`

- [ ] Implement CSP violation alerting

File: `lib/advanced/booking-service.ts`

- [ ] Implement booking conflict detection

File: `lib/advanced/tracking-service.ts`

- [ ] Implement real-time tracking updates

---

## How to Address TODOs

1. **Create GitHub Issues**: Each TODO category should become a GitHub issue
2. **Prioritize**: Security > Functionality > UX
3. **Implement Incrementally**: Start with high-priority security features
4. **Test Thoroughly**: Each implementation should have tests
5. **Document**: Update this file when TODOs are resolved

## Notes

- TODOs in `_disabled` folders are for deprecated/unused features and can be ignored
- Many TODOs in auth files are for advanced security features not critical for MVP
- The MFA implementation is a significant undertaking and could be a separate epic
