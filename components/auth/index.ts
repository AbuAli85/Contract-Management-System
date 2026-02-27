/**
 * Auth Components — Central export for all authentication components.
 *
 * Prefer importing from this file rather than individual component files.
 */

// Context and hooks
export { AuthProvider, useAuthContext, useRequireAuth } from './auth-context';
export type { AuthContextValue, UserProfile } from './auth-context';

// Route protection
export { SecureAuthGuard, withAuth } from './secure-auth-guard';

// Login form (v3 is the current production version)
export { default as EnhancedLoginFormV3 } from './enhanced-login-form-v3';

// Register form
export { EnhancedRegisterForm } from './enhanced-register-form';

// Session management
export { SessionTimeoutWarning } from './session-timeout-warning';
